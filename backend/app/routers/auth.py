from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.deps import fail, get_current_user
from app.models import Participant, ParticipantIdentity, User
from app.present import iso
from app.security import hash_password, make_token, verify_password
from app.seed import _pseudonym

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class RegisterIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=255)
    password: str = Field(min_length=8, max_length=128)
    contact_name: str | None = Field(default=None, max_length=200)


class LoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str


def _token_body(db: Session, user: User) -> dict:
    settings = get_settings()
    participant = db.query(Participant).filter(Participant.user_id == user.id).one_or_none()
    return {
        "access_token": make_token(user.id, user.role, settings.secret_key, settings.token_hours),
        "token_type": "bearer",
        "role": user.role,
        "participant_id": None if participant is None else participant.id,
        "pseudonym": None if participant is None else participant.pseudonym,
    }


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)) -> dict:
    email = body.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        fail(409, "email_in_use", "An account with this email already exists.")
    settings = get_settings()
    user = User(
        email=email,
        password_hash=hash_password(body.password, settings.password_iterations),
        role="vendor",
    )
    db.add(user)
    db.flush()
    participant = Participant(user_id=user.id, pseudonym=_pseudonym(db), consent_status="pending")
    db.add(participant)
    db.flush()
    db.add(ParticipantIdentity(participant_id=participant.id, contact_name=body.contact_name))
    db.commit()
    return _token_body(db, user)


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)) -> dict:
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).one_or_none()
    settings = get_settings()
    if user is None or not verify_password(body.password, user.password_hash, settings.password_iterations):
        fail(401, "invalid_login", "The email or password is wrong.")
    return _token_body(db, user)


@router.get("/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    participant = db.query(Participant).filter(Participant.user_id == user.id).one_or_none()
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "participant_id": None if participant is None else participant.id,
        "pseudonym": None if participant is None else participant.pseudonym,
        "consent_status": None if participant is None else participant.consent_status,
        "consented_at": None if participant is None else iso(participant.consented_at),
    }
