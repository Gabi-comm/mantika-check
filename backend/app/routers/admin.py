from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.config import storage_path
from app.db import get_db
from app.deps import audit, fail, require
from app.models import (
    AuditLog,
    LabReference,
    OilEvent,
    OilSession,
    Participant,
    ParticipantIdentity,
    Questionnaire,
    StripClassification,
    StripPhoto,
    User,
)
from app.present import ensure_utc, iso
from app.seed import _pseudonym

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class RoleIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: str


@router.get("/users")
def list_users(user: User = Depends(require("administrator")), db: Session = Depends(get_db)) -> dict:
    rows = db.query(User).order_by(User.created_at).all()
    return {
        "users": [
            {
                "id": row.id,
                "email": row.email,
                "role": row.role,
                "created_at": iso(row.created_at),
            }
            for row in rows
        ],
        "viewer_role": user.role,
    }


@router.patch("/users/{user_id}")
def change_role(
    user_id: str,
    body: RoleIn,
    user: User = Depends(require("administrator")),
    db: Session = Depends(get_db),
) -> dict:
    if body.role not in {"vendor", "researcher", "administrator"}:
        fail(422, "role", "Use vendor, researcher, or administrator.")
    target = db.get(User, user_id)
    if target is None:
        fail(404, "user_not_found", "That account was not found.")
    if target.role == "administrator" and body.role != "administrator":
        admins = db.query(User).filter(User.role == "administrator").count()
        if admins <= 1:
            fail(409, "last_administrator", "Keep at least one administrator.")
    target.role = body.role
    audit(db, user.id, "role_changed", f"{target.email}:{body.role}")
    db.commit()
    return {"id": target.id, "email": target.email, "role": target.role}


@router.get("/participants/{participant_id}/identity")
def identity(
    participant_id: str,
    user: User = Depends(require("administrator")),
    db: Session = Depends(get_db),
) -> dict:
    participant = db.get(Participant, participant_id)
    if participant is None:
        fail(404, "participant_not_found", "That participant was not found.")
    row = db.get(ParticipantIdentity, participant.id)
    audit(db, user.id, "identity_viewed", participant.pseudonym)
    db.commit()
    return {
        "participant_id": participant.id,
        "pseudonym": participant.pseudonym,
        "contact_name": None if row is None else row.contact_name,
        "phone": None if row is None else row.phone,
        "stall_name": None if row is None else row.stall_name,
        "stall_area": None if row is None else row.stall_area,
    }


@router.post("/participants/{participant_id}/delete-research-data")
def delete_research_data(
    participant_id: str,
    user: User = Depends(require("administrator")),
    db: Session = Depends(get_db),
) -> dict:
    participant = db.get(Participant, participant_id)
    if participant is None:
        fail(404, "participant_not_found", "That participant was not found.")
    old_pseudonym = participant.pseudonym
    photos = db.query(StripPhoto).filter(StripPhoto.participant_id == participant.id).all()
    photo_ids = [row.id for row in photos]
    if photo_ids:
        db.query(StripClassification).filter(StripClassification.photo_id.in_(photo_ids)).delete(
            synchronize_session=False
        )
    for photo in photos:
        path = storage_path() / photo.storage_name
        if path.exists():
            path.unlink()
        db.delete(photo)
    db.query(OilEvent).filter(OilEvent.participant_id == participant.id).delete(synchronize_session=False)
    db.query(OilSession).filter(OilSession.participant_id == participant.id).delete(synchronize_session=False)
    db.query(LabReference).filter(LabReference.participant_id == participant.id).delete(synchronize_session=False)
    questionnaire = db.get(Questionnaire, participant.id)
    if questionnaire:
        db.delete(questionnaire)
    identity_row = db.get(ParticipantIdentity, participant.id)
    if identity_row:
        db.delete(identity_row)
    linked_user = participant.user_id
    db.delete(participant)
    db.flush()
    replacement_id = None
    if linked_user:
        replacement = Participant(
            user_id=linked_user,
            pseudonym=_pseudonym(db),
            consent_status="pending",
        )
        db.add(replacement)
        db.flush()
        db.add(ParticipantIdentity(participant_id=replacement.id))
        replacement_id = replacement.id
    audit(db, user.id, "research_data_deleted", old_pseudonym)
    db.commit()
    return {
        "deleted_pseudonym": old_pseudonym,
        "deleted_at": iso(ensure_utc(datetime.now().astimezone())),
        "replacement_participant_id": replacement_id,
        "consent_status": "pending" if replacement_id else None,
    }


@router.get("/audit")
def audit_log(user: User = Depends(require("administrator")), db: Session = Depends(get_db)) -> dict:
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return {
        "entries": [
            {
                "id": row.id,
                "actor_id": row.actor_id,
                "action": row.action,
                "target": row.target,
                "created_at": iso(row.created_at),
            }
            for row in rows
        ],
        "viewer_role": user.role,
    }
