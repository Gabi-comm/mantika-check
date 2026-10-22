import csv
import io
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.config import storage_path
from app.db import get_db
from app.deps import audit, fail, require
from app.limitations import GROUPING_RULE
from app.models import (
    CalibrationProfile,
    DatasetRow,
    LabReference,
    ModelEvaluation,
    OilSession,
    Participant,
    ParticipantIdentity,
    Questionnaire,
    ResearchDataset,
    StripClassification,
    StripPhoto,
    User,
)
from app.present import ensure_utc, iso, photo_out
from app.services.datasets import DatasetError, describe, parse_csv
from app.services.forecasting import evaluate_tpc
from app.services.privacy import MINIMUM_STALLS, area_summary, split_report

router = APIRouter(prefix="/api/v1/lab", tags=["lab"])
staff = require("researcher", "administrator")


class EvaluateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_id: str


class CalibrationIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    status: str
    bands: list[dict]


class ParticipantIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    consent_granted: bool
    contact_name: str | None = None
    phone: str | None = None
    stall_name: str | None = None
    stall_area: str | None = None


class QuestionnaireIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    oil_type_usual: str | None = None
    foods: str | None = None
    typical_reuse: str | None = None
    notes: str | None = None


class SplitIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    train_physical_strip_ids: list[str]
    test_physical_strip_ids: list[str]


class ReferenceIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    participant_id: str
    tpc: float
    measured_at: datetime
    lab_name: str = Field(min_length=1, max_length=200)
    note: str | None = None


@router.post("/datasets")
async def import_dataset(
    user: User = Depends(staff),
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    name: str = Form(...),
    evidence_source: str = Form(...),
    declared_source_name: str = Form(...),
    citation: str = Form(...),
    outcome: str = Form(...),
    source_url: str | None = Form(default=None),
) -> dict:
    if evidence_source not in {"published_laboratory", "simulated"}:
        fail(422, "evidence_source", "Use published_laboratory or simulated. Vendor logs are a different set of tables.")
    if evidence_source == "published_laboratory" and len(citation.strip()) < 12:
        fail(422, "provenance_required", "A published dataset needs a citation.")
    lowered = citation.lower()
    if evidence_source == "simulated" and ("10.17632/4k7b395yxx" in lowered or "mendeley" in lowered):
        fail(422, "simulated_provenance", "A simulated file cannot cite the Li (2020) dataset as its source.")
    content = await file.read()
    try:
        parsed = parse_csv(content, outcome)
    except DatasetError as exc:
        fail(422, exc.code, exc.message)

    dataset = ResearchDataset(
        name=name.strip(),
        evidence_source=evidence_source,
        declared_source_name=declared_source_name.strip(),
        citation=citation.strip(),
        source_url=source_url,
        outcome=outcome,
        filename=file.filename or "upload.csv",
        profile_json=parsed["profile"],
    )
    db.add(dataset)
    db.flush()
    for index, row in enumerate(parsed["rows"]):
        db.add(
            DatasetRow(
                dataset_id=dataset.id,
                temperature_c=row["temperature_c"],
                time_h=row["time_h"],
                measured_value=row["measured_value"],
                row_index=index,
            )
        )
    audit(db, user.id, "dataset_imported", dataset.id)
    db.commit()
    return _dataset_out(db, dataset)


@router.get("/datasets")
def list_datasets(user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    rows = db.query(ResearchDataset).order_by(ResearchDataset.created_at.desc()).all()
    return {"datasets": [_dataset_out(db, row) for row in rows], "viewer_role": user.role}


@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str, user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    return _dataset_out(db, _dataset(db, dataset_id))


@router.post("/forecast/evaluate")
def evaluate(
    body: EvaluateIn,
    user: User = Depends(staff),
    db: Session = Depends(get_db),
) -> dict:
    dataset = _dataset(db, body.dataset_id)
    if dataset.outcome != "tpc":
        fail(
            422,
            "forecast_target_must_be_tpc",
            "Only a TPC dataset can be evaluated. Acid value and carbonyl value stay separate.",
        )
    rows = db.query(DatasetRow).filter(DatasetRow.dataset_id == dataset.id).all()
    payload = evaluate_tpc(
        [
            {"temperature_c": row.temperature_c, "time_h": row.time_h, "tpc": row.measured_value}
            for row in rows
        ],
        evidence_source=dataset.evidence_source,
        dataset_name=dataset.name,
        declared_source_name=dataset.declared_source_name,
        dataset_id=dataset.id,
        evaluation_id=str(uuid4()),
    )
    record = ModelEvaluation(
        id=payload["id"],
        dataset_id=dataset.id,
        evidence_source=dataset.evidence_source,
        result_json=payload,
    )
    db.add(record)
    audit(db, user.id, "forecast_evaluated", record.id)
    db.commit()
    return payload


@router.get("/forecast/evaluations")
def list_evaluations(user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    rows = db.query(ModelEvaluation).order_by(ModelEvaluation.created_at.desc()).all()
    summaries = []
    for row in rows:
        baselines = []
        for item in row.result_json.get("baselines", []):
            baselines.append(
                {
                    "model": item["model"],
                    "validation": item["validation"],
                    "status": item["status"],
                    "mae": item["mae"],
                    "rmse": item["rmse"],
                }
            )
        summaries.append(
            {
                "id": row.id,
                "dataset_id": row.dataset_id,
                "evidence_source": row.evidence_source,
                "created_at": iso(row.created_at),
                "reporting_block": row.result_json.get("reporting_block"),
                "baselines": baselines,
            }
        )
    return {"evaluations": summaries, "viewer_role": user.role}


@router.get("/forecast/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: str, user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    row = db.get(ModelEvaluation, evaluation_id)
    if row is None:
        fail(404, "evaluation_not_found", "That evaluation was not found.")
    return row.result_json


@router.get("/strip-calibration")
def get_calibration(user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    return {"calibration": _calibration_out(db), "viewer_role": user.role}


@router.put("/strip-calibration")
def put_calibration(
    body: CalibrationIn,
    user: User = Depends(staff),
    db: Session = Depends(get_db),
) -> dict:
    if body.status not in {"schematic_placeholder", "measured_card"}:
        fail(422, "calibration_status", "Use schematic_placeholder or measured_card.")
    if len(body.bands) != 3:
        fail(422, "calibration_bands", "Provide three patches, one for each band.")
    cleaned = []
    seen = set()
    for band in body.bands:
        label = str(band.get("band"))
        if label not in {"1", "2", "3"} or label in seen:
            fail(422, "calibration_bands", "Bands must be 1, 2, and 3, once each.")
        seen.add(label)
        try:
            cleaned.append(
                {
                    "band": label,
                    "L": float(band["L"]),
                    "a": float(band["a"]),
                    "b": float(band["b"]),
                }
            )
        except (KeyError, TypeError, ValueError):
            fail(422, "calibration_bands", "Each patch needs finite L, a, and b values.")
    for row in db.query(CalibrationProfile).filter(CalibrationProfile.is_active.is_(True)):
        row.is_active = False
    db.add(
        CalibrationProfile(
            name=body.name.strip(),
            status=body.status,
            is_active=True,
            bands_json=cleaned,
        )
    )
    audit(db, user.id, "calibration_replaced", body.status)
    db.commit()
    return {"calibration": _calibration_out(db)}


@router.get("/strips")
def list_strips(user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    photos = _visible_photos(db, user)
    return {
        "strips": [photo_out(db, row) for row in photos],
        "grouping_rule": GROUPING_RULE,
    }


@router.get("/strips/agreement")
def agreement(user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    photos = _visible_photos(db, user)
    compared = 0
    agreed = 0
    misclassified = []
    for photo in photos:
        presented = photo_out(db, photo)
        if presented["automated_band"] and presented["manual_band"]:
            compared += 1
            if presented["automated_band"] == presented["manual_band"]:
                agreed += 1
            else:
                misclassified.append(
                    {
                        "photo_id": photo.id,
                        "physical_strip_id": photo.physical_strip_id,
                        "automated_band": presented["automated_band"],
                        "manual_band": presented["manual_band"],
                    }
                )
    return {
        "experimental": True,
        "grouping_rule": GROUPING_RULE,
        "camera_to_human": {
            "status": "reported" if compared else "insufficient",
            "compared": compared,
            "agreed": agreed,
            "agreement": None if compared == 0 else agreed / compared,
        },
        "devices": _condition_pairs(db, photos, "device_label", "two devices"),
        "lighting": _condition_pairs(db, photos, "lighting_condition", "two lighting conditions"),
        "misclassified": misclassified,
        "viewer_role": user.role,
    }


@router.post("/strips/split-check")
def split_check(body: SplitIn, user: User = Depends(staff)) -> dict:
    return split_report(body.train_physical_strip_ids, body.test_physical_strip_ids)


@router.get("/strips/{photo_id}/image")
def strip_image(photo_id: str, user: User = Depends(staff), db: Session = Depends(get_db)):
    photo = db.get(StripPhoto, photo_id)
    if photo is None:
        fail(404, "strip_not_found", "That strip photograph was not found.")
    participant = db.get(Participant, photo.participant_id)
    if user.role != "administrator" and (participant is None or participant.consent_status != "granted"):
        fail(403, "forbidden", "This photograph is not available for the current consent state.")
    path = storage_path() / photo.storage_name
    if not path.exists():
        fail(404, "image_missing", "The photograph file is not in storage.")
    return FileResponse(path, media_type=photo.content_type)


@router.post("/participants")
def create_participant(
    body: ParticipantIn,
    user: User = Depends(staff),
    db: Session = Depends(get_db),
) -> dict:
    if body.consent_granted is not True:
        fail(422, "consent_required", "Enroll only a person who has consented.")
    from app.seed import _pseudonym

    participant = Participant(
        pseudonym=_pseudonym(db),
        consent_status="granted",
        consent_version="consent-2026-10",
        consented_at=datetime.now().astimezone(),
    )
    db.add(participant)
    db.flush()
    db.add(
        ParticipantIdentity(
            participant_id=participant.id,
            contact_name=body.contact_name,
            phone=body.phone,
            stall_name=body.stall_name,
            stall_area=body.stall_area,
        )
    )
    audit(db, user.id, "participant_enrolled", participant.pseudonym)
    db.commit()
    return _participant_public(db, participant)


@router.get("/participants")
def list_participants(user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    rows = db.query(Participant).order_by(Participant.created_at).all()
    return {
        "participants": [_participant_public(db, row) for row in rows],
        "identity_note": "Names, phones, and stall names are not on this list.",
        "viewer_role": user.role,
    }


@router.post("/participants/{participant_id}/questionnaire")
def save_questionnaire(
    participant_id: str,
    body: QuestionnaireIn,
    user: User = Depends(staff),
    db: Session = Depends(get_db),
) -> dict:
    participant = _participant(db, participant_id)
    answers = body.model_dump()
    existing = db.get(Questionnaire, participant.id)
    if existing:
        existing.answers_json = answers
        existing.updated_at = ensure_utc(datetime.now().astimezone())
    else:
        db.add(Questionnaire(participant_id=participant.id, answers_json=answers))
    audit(db, user.id, "questionnaire_saved", participant.pseudonym)
    db.commit()
    return {"pseudonym": participant.pseudonym, "questionnaire_present": True}


@router.get("/participants/{participant_id}/completeness")
def completeness(participant_id: str, user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    participant = _participant(db, participant_id)
    sessions = db.query(OilSession).filter(OilSession.participant_id == participant.id).all()
    strips = db.query(StripPhoto).filter(StripPhoto.participant_id == participant.id).count()
    missing_temperature = sum(1 for row in sessions if row.temperature_c is None)
    return {
        "pseudonym": participant.pseudonym,
        "consent_status": participant.consent_status,
        "session_count": len(sessions),
        "strip_count": strips,
        "sessions_missing_temperature": missing_temperature,
        "questionnaire_present": db.get(Questionnaire, participant.id) is not None,
        "repeat_observation": len(sessions) >= 2 or strips >= 2,
        "repeat_definition": "Two oil-use sessions or two strip photographs.",
        "scale_note": "The proposal target is 15–25 consenting vendors. That target is not a completed sample count.",
        "viewer_role": user.role,
    }


@router.get("/pilot-summary")
def pilot_summary(
    user: User = Depends(staff),
    db: Session = Depends(get_db),
    area: str | None = None,
) -> dict:
    query = db.query(Participant).filter(Participant.consent_status == "granted")
    if area is not None:
        ids = [
            row.participant_id
            for row in db.query(ParticipantIdentity).filter(ParticipantIdentity.stall_area == area)
        ]
        query = query.filter(Participant.id.in_(ids or [""]))
    participants = query.all()
    ids = [row.id for row in participants]
    sessions = 0 if not ids else db.query(OilSession).filter(OilSession.participant_id.in_(ids)).count()
    strips = 0 if not ids else db.query(StripPhoto).filter(StripPhoto.participant_id.in_(ids)).count()
    summary = area_summary(len(participants), sessions, strips)
    summary["area"] = area
    summary["viewer_role"] = user.role
    return summary


@router.get("/validation")
def validation(user: User = Depends(staff), db: Session = Depends(get_db)) -> dict:
    published = (
        db.query(ResearchDataset)
        .filter(ResearchDataset.evidence_source == "published_laboratory", ResearchDataset.outcome == "tpc")
        .count()
    )
    simulated = (
        db.query(ResearchDataset)
        .filter(ResearchDataset.evidence_source == "simulated", ResearchDataset.outcome == "tpc")
        .count()
    )
    evaluations = db.query(ModelEvaluation).count()
    references = db.query(LabReference).count()
    consented = db.query(Participant).filter(Participant.consent_status == "granted").count()
    photos = _visible_photos(db, user)
    compared = 0
    for photo in photos:
        presented = photo_out(db, photo)
        if presented["automated_band"] and presented["manual_band"]:
            compared += 1
    gates = [
        {
            "id": "strip_not_tpc",
            "state": "enforced",
            "detail": "Strip routes do not return a TPC value.",
        },
        {
            "id": "vendor_hours_remaining",
            "state": "disabled",
            "detail": "No route returns hours remaining for a vendor.",
        },
        {
            "id": "published_tpc_dataset",
            "state": "present" if published else "missing",
            "detail": "Import the Li (2020) TPC file as published_laboratory. A simulated file does not fill this gate.",
        },
        {
            "id": "simulated_dataset",
            "state": "present" if simulated else "absent",
            "detail": "Simulated rows are for wiring the lab only.",
        },
        {
            "id": "model_evaluation",
            "state": "present" if evaluations else "missing",
            "detail": "Run held-out-time and leave-one-temperature-out before showing scores.",
        },
        {
            "id": "local_reference_tpc",
            "state": "unavailable" if references == 0 else "recorded_but_forecast_still_disabled",
            "count": references,
            "detail": "A laboratory TPC value does not turn on vendor-specific hour estimates.",
        },
        {
            "id": "strip_agreement",
            "state": "reported" if compared else "insufficient",
            "compared": compared,
            "detail": "Camera-to-human agreement needs a manual band next to the automated band.",
        },
        {
            "id": "pilot_scale",
            "state": "target_not_a_count",
            "consented_participants": consented,
            "target": "15-25 consenting vendors, with optional repeats from 5-8. These are targets, not completed counts.",
        },
        {
            "id": "small_area_suppression",
            "state": "enforced",
            "minimum_stalls": MINIMUM_STALLS,
            "detail": "Area summaries under five stalls return suppressed true and no count.",
        },
    ]
    return {"gates": gates, "vendor_specific_forecast": "disabled"}


@router.post("/reference-measurements")
def add_reference(
    body: ReferenceIn,
    user: User = Depends(staff),
    db: Session = Depends(get_db),
) -> dict:
    participant = _participant(db, body.participant_id)
    row = LabReference(
        participant_id=participant.id,
        tpc=body.tpc,
        measured_at=ensure_utc(body.measured_at),
        lab_name=body.lab_name.strip(),
        note=body.note,
    )
    db.add(row)
    audit(db, user.id, "reference_tpc_recorded", participant.pseudonym)
    db.commit()
    return {
        "id": row.id,
        "pseudonym": participant.pseudonym,
        "tpc": row.tpc,
        "measured_at": iso(row.measured_at),
        "lab_name": row.lab_name,
        "evidence_source": "laboratory_reference",
        "vendor_specific_forecast": "disabled",
        "message": "Stored as a laboratory reference. It does not create an hours-remaining estimate.",
    }


@router.get("/exports/oil-sessions.csv")
def export_sessions(user: User = Depends(staff), db: Session = Depends(get_db)) -> Response:
    granted = _granted_ids(db)
    withdrawn = db.query(Participant).filter(Participant.consent_status == "withdrawn").count()
    rows = []
    if granted:
        for session in db.query(OilSession).filter(OilSession.participant_id.in_(granted)).all():
            participant = db.get(Participant, session.participant_id)
            rows.append(
                [
                    participant.pseudonym,
                    session.id,
                    iso(session.started_at),
                    session.oil_type,
                    session.food,
                    "" if session.temperature_c is None else session.temperature_c,
                    session.heating_minutes,
                    "vendor_observation",
                ]
            )
    audit(db, user.id, "export_sessions", str(len(rows)))
    db.commit()
    return _csv(
        "oil-sessions.csv",
        [
            "pseudonym",
            "session_id",
            "started_at",
            "oil_type",
            "food",
            "temperature_c",
            "heating_minutes",
            "evidence_source",
        ],
        rows,
        withdrawn,
    )


@router.get("/exports/strip-observations.csv")
def export_strips(user: User = Depends(staff), db: Session = Depends(get_db)) -> Response:
    granted = _granted_ids(db)
    withdrawn = db.query(Participant).filter(Participant.consent_status == "withdrawn").count()
    rows = []
    photos = [] if not granted else db.query(StripPhoto).filter(StripPhoto.participant_id.in_(granted)).all()
    for photo in photos:
        participant = db.get(Participant, photo.participant_id)
        presented = photo_out(db, photo)
        current = next((item for item in presented["classifications"] if item["is_current"]), None)
        rgb = (current or {}).get("rgb") or {}
        lab = (current or {}).get("cielab") or {}
        rows.append(
            [
                participant.pseudonym,
                photo.physical_strip_id,
                photo.id,
                iso(photo.captured_at),
                presented["current_band"],
                presented["current_source"],
                presented["automated_band"],
                presented["manual_band"],
                presented["label_status"],
                True,
                lab.get("L"),
                lab.get("a"),
                lab.get("b"),
                rgb.get("r"),
                rgb.get("g"),
                rgb.get("b"),
                photo.device_label or "",
                photo.lighting_condition or "",
            ]
        )
    audit(db, user.id, "export_strips", str(len(rows)))
    db.commit()
    return _csv(
        "strip-observations.csv",
        [
            "pseudonym",
            "physical_strip_id",
            "photo_id",
            "captured_at",
            "current_band",
            "current_source",
            "automated_band",
            "manual_band",
            "label_status",
            "experimental",
            "lab_l",
            "lab_a",
            "lab_b",
            "rgb_r",
            "rgb_g",
            "rgb_b",
            "device_label",
            "lighting_condition",
        ],
        rows,
        withdrawn,
    )


@router.get("/exports/evaluations.csv")
def export_evaluations(user: User = Depends(staff), db: Session = Depends(get_db)) -> Response:
    rows = []
    for record in db.query(ModelEvaluation).all():
        for item in record.result_json.get("baselines", []):
            rows.append(
                [
                    record.id,
                    record.dataset_id,
                    record.evidence_source,
                    item["model"],
                    item["validation"],
                    item["status"],
                    "" if item["mae"] is None else item["mae"],
                    "" if item["rmse"] is None else item["rmse"],
                    item["n_scored"],
                    "yes" if record.evidence_source == "simulated" else "no",
                ]
            )
    audit(db, user.id, "export_evaluations", str(len(rows)))
    db.commit()
    return _csv(
        "evaluations.csv",
        [
            "evaluation_id",
            "dataset_id",
            "evidence_source",
            "model",
            "validation",
            "status",
            "mae",
            "rmse",
            "n_scored",
            "simulated_not_for_reporting",
        ],
        rows,
        0,
    )


def _dataset(db: Session, dataset_id: str) -> ResearchDataset:
    row = db.get(ResearchDataset, dataset_id)
    if row is None:
        fail(404, "dataset_not_found", "That dataset was not found.")
    return row


def _dataset_out(db: Session, dataset: ResearchDataset) -> dict:
    rows = db.query(DatasetRow).filter(DatasetRow.dataset_id == dataset.id).all()
    measured = [
        {
            "temperature_c": row.temperature_c,
            "time_h": row.time_h,
            "measured_value": row.measured_value,
        }
        for row in rows
    ]
    banner = None
    if dataset.evidence_source == "simulated":
        banner = "Simulated wiring data. Not Li (2020). Do not report it as a study result."
    return {
        "id": dataset.id,
        "name": dataset.name,
        "evidence_source": dataset.evidence_source,
        "declared_source_name": dataset.declared_source_name,
        "citation": dataset.citation,
        "source_url": dataset.source_url,
        "outcome": dataset.outcome,
        "filename": dataset.filename,
        "banner": banner,
        "import_profile": dataset.profile_json,
        "descriptive_statistics": describe(measured),
        "created_at": iso(dataset.created_at),
    }


def _participant(db: Session, participant_id: str) -> Participant:
    row = db.get(Participant, participant_id)
    if row is None:
        fail(404, "participant_not_found", "That participant was not found.")
    return row


def _participant_public(db: Session, participant: Participant) -> dict:
    sessions = db.query(OilSession).filter(OilSession.participant_id == participant.id).count()
    strips = db.query(StripPhoto).filter(StripPhoto.participant_id == participant.id).count()
    return {
        "id": participant.id,
        "pseudonym": participant.pseudonym,
        "consent_status": participant.consent_status,
        "consented_at": iso(participant.consented_at),
        "withdrawn_at": iso(participant.withdrawn_at),
        "session_count": sessions,
        "strip_count": strips,
    }


def _calibration_out(db: Session) -> dict | None:
    row = db.query(CalibrationProfile).filter(CalibrationProfile.is_active.is_(True)).one_or_none()
    if row is None:
        return None
    return {
        "id": row.id,
        "name": row.name,
        "status": row.status,
        "bands": row.bands_json,
        "chemical_standard": False,
    }


def _granted_ids(db: Session) -> list[str]:
    return [row.id for row in db.query(Participant).filter(Participant.consent_status == "granted")]


def _visible_photos(db: Session, user: User) -> list[StripPhoto]:
    if user.role == "administrator":
        return db.query(StripPhoto).order_by(StripPhoto.captured_at).all()
    granted = _granted_ids(db)
    if not granted:
        return []
    return (
        db.query(StripPhoto)
        .filter(StripPhoto.participant_id.in_(granted))
        .order_by(StripPhoto.captured_at)
        .all()
    )


def _condition_pairs(db: Session, photos: list[StripPhoto], field: str, label: str) -> dict:
    groups: dict[str, list[StripPhoto]] = {}
    for photo in photos:
        groups.setdefault(photo.physical_strip_id, []).append(photo)
    pairs = 0
    agreed = 0
    for group in groups.values():
        chosen: dict[str, StripPhoto] = {}
        for photo in group:
            value = getattr(photo, field)
            if value and value not in chosen:
                chosen[value] = photo
        picked = list(chosen.values())
        if len(picked) < 2:
            continue
        first = photo_out(db, picked[0])["current_band"]
        second = photo_out(db, picked[1])["current_band"]
        if first and second:
            pairs += 1
            if first == second:
                agreed += 1
    if pairs == 0:
        return {
            "status": "insufficient",
            "pairs": 0,
            "note": f"Need the same physical strip photographed under {label}.",
        }
    return {"status": "reported", "pairs": pairs, "agreed": agreed, "agreement": agreed / pairs}


def _csv(filename: str, header: list[str], rows: list[list], withdrawn: int) -> Response:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    writer.writerows(rows)
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-MANTIKA-Excluded-Withdrawn": str(withdrawn),
        },
    )
