from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.limitations import ACCUMULATED_DEFINITION, VENDOR_LIMITATIONS, band_copy
from app.models import OilEvent, OilSession, StripClassification, StripPhoto


def iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def event_out(row: OilEvent) -> dict:
    return {
        "id": row.id,
        "session_id": row.session_id,
        "event_type": row.event_type,
        "occurred_at": iso(row.occurred_at),
        "duration_minutes": row.duration_minutes,
        "note": row.note,
        "client_mutation_id": row.client_mutation_id,
    }


def session_out(db: Session, row: OilSession) -> dict:
    events = (
        db.query(OilEvent)
        .filter(OilEvent.session_id == row.id)
        .order_by(OilEvent.occurred_at)
        .all()
    )
    return {
        "id": row.id,
        "participant_id": row.participant_id,
        "oil_type": row.oil_type,
        "food": row.food,
        "temperature_c": row.temperature_c,
        "heating_minutes": row.heating_minutes,
        "started_at": iso(row.started_at),
        "note": row.note,
        "client_mutation_id": row.client_mutation_id,
        "evidence_source": "vendor_observation",
        "events": [event_out(item) for item in events],
    }


def classification_out(row: StripClassification) -> dict:
    return {
        "id": row.id,
        "source": row.source,
        "band": row.band,
        "is_current": row.is_current,
        "label_status": row.label_status,
        "calibration_status": row.calibration_status,
        "experimental": True,
        "is_tpc": False,
        "rgb": None
        if row.rgb_r is None
        else {"r": row.rgb_r, "g": row.rgb_g, "b": row.rgb_b},
        "cielab": None
        if row.lab_l is None
        else {"L": row.lab_l, "a": row.lab_a, "b": row.lab_b},
        "copy": band_copy(row.source, row.band, row.calibration_status),
        "note": row.note,
        "created_at": iso(row.created_at),
    }


def photo_out(db: Session, row: StripPhoto) -> dict:
    classes = (
        db.query(StripClassification)
        .filter(StripClassification.photo_id == row.id)
        .order_by(StripClassification.created_at)
        .all()
    )
    automated = next((item for item in classes if item.source == "automated"), None)
    manuals = [item for item in classes if item.source == "manual"]
    manual = manuals[-1] if manuals else None
    current = next((item for item in reversed(classes) if item.is_current), None)
    return {
        "id": row.id,
        "participant_id": row.participant_id,
        "session_id": row.session_id,
        "physical_strip_id": row.physical_strip_id,
        "partition_key": row.physical_strip_id,
        "device_label": row.device_label,
        "lighting_condition": row.lighting_condition,
        "color_card_present": row.color_card_present,
        "captured_at": iso(row.captured_at),
        "sync_status": row.sync_status,
        "retake_reasons": row.retake_reasons or [],
        "quality_checks": "heuristic",
        "experimental": True,
        "is_tpc": False,
        "evidence_source": "vendor_observation",
        "separation": "This classification is from image color. It is not a TPC forecast.",
        "automated_band": None if automated is None else automated.band,
        "manual_band": None if manual is None else manual.band,
        "current_band": None if current is None else current.band,
        "current_source": None if current is None else current.source,
        "label_status": None if current is None else current.label_status,
        "classifications": [classification_out(item) for item in classes],
        "client_mutation_id": row.client_mutation_id,
    }


def accumulated_minutes(db: Session, participant_id: str) -> float:
    sessions = db.query(OilSession).filter(OilSession.participant_id == participant_id).all()
    total = sum(row.heating_minutes or 0 for row in sessions)
    events = (
        db.query(OilEvent)
        .filter(OilEvent.participant_id == participant_id, OilEvent.event_type.in_(["heat", "reuse"]))
        .all()
    )
    total += sum(row.duration_minutes or 0 for row in events)
    return float(total)


def vendor_science() -> dict:
    return {
        "limitations": VENDOR_LIMITATIONS,
        "accumulated_frying_minutes_definition": ACCUMULATED_DEFINITION,
        "vendor_specific_forecast": "disabled",
        "strip_photograph_is_tpc": False,
    }
