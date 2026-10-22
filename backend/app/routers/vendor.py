from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.config import storage_path
from app.db import get_db
from app.deps import audit, ensure_owned_session, fail, require, vendor_participant
from app.limitations import CONSENT_TEXT, CONSENT_VERSION, GUIDE_STEPS
from app.models import (
    CalibrationProfile,
    OilEvent,
    OilSession,
    Participant,
    StripClassification,
    StripPhoto,
    User,
)
from app.present import (
    accumulated_minutes,
    ensure_utc,
    iso,
    photo_out,
    session_out,
    vendor_science,
)
from app.services.colorimetry import analyze_image

router = APIRouter(prefix="/api/v1/vendor", tags=["vendor"])


class ConsentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accepted: bool
    statement_version: str


class SessionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    oil_type: str = Field(min_length=1, max_length=120)
    food: str = Field(min_length=1, max_length=120)
    temperature_c: float | None = None
    heating_minutes: float = Field(ge=0, le=1440)
    started_at: datetime
    note: str | None = Field(default=None, max_length=500)
    client_mutation_id: str | None = Field(default=None, max_length=64)


class EventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_type: str
    occurred_at: datetime
    duration_minutes: float | None = Field(default=None, ge=0, le=1440)
    note: str | None = Field(default=None, max_length=500)
    client_mutation_id: str | None = Field(default=None, max_length=64)


class CorrectionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    band: str
    note: str | None = Field(default=None, max_length=500)


@router.get("/consent-statement")
def consent_statement(user: User = Depends(require("vendor"))) -> dict:
    return {"version": CONSENT_VERSION, "text": CONSENT_TEXT, "role": user.role}


@router.post("/consent")
def grant_consent(
    body: ConsentIn,
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
) -> dict:
    if body.accepted is not True or body.statement_version != CONSENT_VERSION:
        fail(
            422,
            "consent_version",
            "Show the current consent statement and send accepted true with that version.",
        )
    participant = vendor_participant(db, user, write=False)
    now = ensure_utc(datetime.now().astimezone())
    participant.consent_status = "granted"
    participant.consent_version = CONSENT_VERSION
    participant.consented_at = now
    participant.withdrawn_at = None
    audit(db, user.id, "consent_granted", participant.pseudonym)
    db.commit()
    return {"consent_status": participant.consent_status, "version": CONSENT_VERSION, "consented_at": iso(now)}


@router.post("/consent/withdraw")
def withdraw(
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
) -> dict:
    participant = vendor_participant(db, user, write=False)
    now = ensure_utc(datetime.now().astimezone())
    participant.consent_status = "withdrawn"
    participant.withdrawn_at = now
    audit(db, user.id, "consent_withdrawn", participant.pseudonym)
    db.commit()
    return {
        "consent_status": "withdrawn",
        "withdrawn_at": iso(now),
        "message": "New oil logs and strip photos are stopped. Ask an administrator if the stored research records should be deleted.",
    }


@router.get("/guide")
def guide(user: User = Depends(require("vendor"))) -> dict:
    return {
        "steps": GUIDE_STEPS,
        "retake_reasons_are_heuristic": True,
        "strip_photograph_is_tpc": False,
        "role": user.role,
    }


@router.post("/sessions")
def create_session(
    body: SessionIn,
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
) -> dict:
    if body.temperature_c is not None and not 50 <= body.temperature_c <= 300:
        fail(422, "temperature_celsius", "Enter Celsius if you know it. Leave temperature empty if you do not.")
    participant = vendor_participant(db, user, write=True)
    existing = _existing_mutation(db, OilSession, participant.id, body.client_mutation_id)
    if existing:
        return session_out(db, existing)
    row = OilSession(
        participant_id=participant.id,
        client_mutation_id=body.client_mutation_id,
        oil_type=body.oil_type.strip(),
        food=body.food.strip(),
        temperature_c=body.temperature_c,
        heating_minutes=body.heating_minutes,
        started_at=ensure_utc(body.started_at),
        note=body.note,
    )
    db.add(row)
    db.flush()
    audit(db, user.id, "session_created", row.id)
    db.commit()
    return session_out(db, row)


@router.get("/sessions")
def list_sessions(
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=500),
) -> dict:
    participant = vendor_participant(db, user, write=False)
    rows = (
        db.query(OilSession)
        .filter(OilSession.participant_id == participant.id)
        .order_by(OilSession.started_at.desc())
        .limit(limit)
        .all()
    )
    return {"sessions": [session_out(db, row) for row in rows]}


@router.post("/sessions/{session_id}/events")
def add_event(
    session_id: str,
    body: EventIn,
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
) -> dict:
    if body.event_type not in {"heat", "reuse", "replenish", "replace"}:
        fail(422, "event_type", "Use heat, reuse, replenish, or replace.")
    if body.event_type in {"heat", "reuse"} and body.duration_minutes is None:
        fail(422, "duration_required", "Heat and reuse events need duration_minutes.")
    participant = vendor_participant(db, user, write=True)
    ensure_owned_session(db, participant, session_id)
    existing = _existing_mutation(db, OilEvent, participant.id, body.client_mutation_id)
    if existing:
        return session_out(db, db.get(OilSession, existing.session_id))
    row = OilEvent(
        session_id=session_id,
        participant_id=participant.id,
        event_type=body.event_type,
        occurred_at=ensure_utc(body.occurred_at),
        duration_minutes=body.duration_minutes,
        note=body.note,
        client_mutation_id=body.client_mutation_id,
    )
    db.add(row)
    audit(db, user.id, "oil_event", f"{session_id}:{body.event_type}")
    db.commit()
    return session_out(db, db.get(OilSession, session_id))


@router.post("/strips")
async def upload_strip(
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    color_card_present: bool = Form(False),
    physical_strip_id: str | None = Form(default=None),
    session_id: str | None = Form(default=None),
    client_mutation_id: str | None = Form(default=None),
    device_label: str | None = Form(default=None),
    lighting_condition: str | None = Form(default=None),
    captured_at: datetime | None = Form(default=None),
) -> dict:
    participant = vendor_participant(db, user, write=True)
    if session_id:
        ensure_owned_session(db, participant, session_id)
    existing = _existing_mutation(db, StripPhoto, participant.id, client_mutation_id)
    if existing:
        return photo_out(db, existing)

    payload = await file.read()
    if not payload:
        fail(422, "image_missing", "Attach a strip photograph.")
    if len(payload) > 8 * 1024 * 1024:
        fail(422, "image_too_large", "Photographs must be 8 MB or smaller.")

    calibration = db.query(CalibrationProfile).filter(CalibrationProfile.is_active.is_(True)).one_or_none()
    centroids = None if calibration is None else calibration.bands_json
    status = "unavailable" if calibration is None else calibration.status
    try:
        reading = analyze_image(payload, centroids, status, color_card_present)
    except ValueError:
        fail(422, "image_unreadable", "The file could not be read as an image.")

    photo_id = str(uuid4())
    storage_name = f"{photo_id}.img"
    (storage_path() / storage_name).write_bytes(payload)
    when = ensure_utc(captured_at or datetime.now().astimezone())
    photo = StripPhoto(
        id=photo_id,
        participant_id=participant.id,
        session_id=session_id,
        physical_strip_id=physical_strip_id or str(uuid4()),
        client_mutation_id=client_mutation_id,
        storage_name=storage_name,
        content_type=file.content_type or "application/octet-stream",
        device_label=device_label,
        lighting_condition=lighting_condition,
        color_card_present=color_card_present,
        captured_at=when,
        sync_status="analyzed",
        retake_reasons=reading["retake_reasons"],
    )
    db.add(photo)
    db.add(
        StripClassification(
            photo_id=photo.id,
            source="automated",
            band=reading["band"],
            is_current=True,
            label_status=reading["label_status"],
            calibration_status=reading["calibration_status"],
            experimental=True,
            rgb_r=reading["rgb"]["r"],
            rgb_g=reading["rgb"]["g"],
            rgb_b=reading["rgb"]["b"],
            lab_l=reading["cielab"]["L"],
            lab_a=reading["cielab"]["a"],
            lab_b=reading["cielab"]["b"],
        )
    )
    audit(db, user.id, "strip_uploaded", photo.id)
    db.commit()
    return photo_out(db, photo)


@router.get("/strips")
def list_strips(
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=500),
) -> dict:
    participant = vendor_participant(db, user, write=False)
    rows = (
        db.query(StripPhoto)
        .filter(StripPhoto.participant_id == participant.id)
        .order_by(StripPhoto.captured_at.desc())
        .limit(limit)
        .all()
    )
    return {"strips": [photo_out(db, row) for row in rows]}


@router.get("/strips/{photo_id}")
def get_strip(
    photo_id: str,
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
) -> dict:
    participant = vendor_participant(db, user, write=False)
    photo = _own_photo(db, participant, photo_id)
    return photo_out(db, photo)


@router.post("/strips/{photo_id}/correction")
def correct_strip(
    photo_id: str,
    body: CorrectionIn,
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
) -> dict:
    if body.band not in {"1", "2", "3", "unreadable"}:
        fail(422, "band", "Choose band 1, 2, 3, or unreadable.")
    participant = vendor_participant(db, user, write=True)
    photo = _own_photo(db, participant, photo_id)
    current = (
        db.query(StripClassification)
        .filter(StripClassification.photo_id == photo.id, StripClassification.is_current.is_(True))
        .all()
    )
    for item in current:
        item.is_current = False
    calibration = db.query(CalibrationProfile).filter(CalibrationProfile.is_active.is_(True)).one_or_none()
    db.add(
        StripClassification(
            photo_id=photo.id,
            source="manual",
            band=body.band,
            is_current=True,
            label_status="experimental",
            calibration_status="manual" if calibration is None else calibration.status,
            experimental=True,
            note=body.note,
        )
    )
    audit(db, user.id, "strip_corrected", photo.id)
    db.commit()
    return photo_out(db, photo)


@router.get("/strips/{photo_id}/image")
def strip_image(
    photo_id: str,
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
):
    participant = vendor_participant(db, user, write=False)
    photo = _own_photo(db, participant, photo_id)
    path = storage_path() / photo.storage_name
    if not path.exists():
        fail(404, "image_missing", "The photograph file is not in storage.")
    return FileResponse(path, media_type=photo.content_type)


@router.get("/dashboard")
def dashboard(user: User = Depends(require("vendor")), db: Session = Depends(get_db)) -> dict:
    participant = vendor_participant(db, user, write=False)
    photos = (
        db.query(StripPhoto)
        .filter(StripPhoto.participant_id == participant.id)
        .order_by(StripPhoto.captured_at.desc())
        .all()
    )
    presented = [photo_out(db, row) for row in photos]
    latest = presented[0] if presented else None
    previous = presented[1] if len(presented) > 1 else None
    comparison = None
    if latest and previous and latest["current_band"] and previous["current_band"]:
        comparison = {
            "current_band": latest["current_band"],
            "previous_band": previous["current_band"],
            "changed": latest["current_band"] != previous["current_band"],
        }
    incomplete = [
        item for item in presented if item["label_status"] in {"incomplete", "needs_review"}
    ]
    return {
        "pseudonym": participant.pseudonym,
        "consent_status": participant.consent_status,
        "latest_strip": latest,
        "successive_comparison": comparison,
        "accumulated_frying_minutes": accumulated_minutes(db, participant.id),
        "incomplete_or_review_count": len(incomplete),
        **vendor_science(),
    }


@router.get("/history")
def history(
    user: User = Depends(require("vendor")),
    db: Session = Depends(get_db),
    session_id: str | None = None,
    incomplete: bool = False,
) -> dict:
    participant = vendor_participant(db, user, write=False)
    sessions = db.query(OilSession).filter(OilSession.participant_id == participant.id)
    photos = db.query(StripPhoto).filter(StripPhoto.participant_id == participant.id)
    if session_id:
        sessions = sessions.filter(OilSession.id == session_id)
        photos = photos.filter(StripPhoto.session_id == session_id)
    session_rows = [session_out(db, row) for row in sessions.order_by(OilSession.started_at).all()]
    strip_rows = [photo_out(db, row) for row in photos.order_by(StripPhoto.captured_at).all()]
    if incomplete:
        strip_rows = [row for row in strip_rows if row["label_status"] in {"incomplete", "needs_review"}]
    return {"sessions": session_rows, "strips": strip_rows, **vendor_science()}


def _existing_mutation(db: Session, model, participant_id: str, mutation_id: str | None):
    if not mutation_id:
        return None
    return (
        db.query(model)
        .filter(model.participant_id == participant_id, model.client_mutation_id == mutation_id)
        .one_or_none()
    )


def _own_photo(db: Session, participant: Participant, photo_id: str) -> StripPhoto:
    photo = db.get(StripPhoto, photo_id)
    if photo is None or photo.participant_id != participant.id:
        fail(404, "strip_not_found", "That strip photograph was not found for this account.")
    return photo
