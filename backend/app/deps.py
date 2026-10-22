from collections.abc import Callable

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import AuditLog, Participant, User
from app.security import read_token

bearer = HTTPBearer(auto_error=False)


def fail(status: int, code: str, message: str) -> None:
    raise HTTPException(status_code=status, detail={"code": code, "message": message})


def audit(db: Session, actor_id: str | None, action: str, target: str | None) -> None:
    db.add(AuditLog(actor_id=actor_id, action=action, target=target or "unspecified"))


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        fail(401, "unauthorized", "Sign in required.")
    payload = read_token(credentials.credentials, get_settings().secret_key)
    if payload is None:
        fail(401, "unauthorized", "Sign in required.")
    user = db.get(User, payload["sub"])
    if user is None:
        fail(401, "unauthorized", "Sign in required.")
    return user


def require(*roles: str) -> Callable:
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            fail(403, "forbidden", "This action is not available for this role.")
        return user

    return checker


def vendor_participant(db: Session, user: User, *, write: bool) -> Participant:
    participant = db.query(Participant).filter(Participant.user_id == user.id).one_or_none()
    if participant is None:
        fail(409, "participant_missing", "This account has no research participant record.")
    if write and participant.consent_status != "granted":
        fail(403, "consent_required", "Grant consent before recording observations.")
    return participant


def ensure_owned_session(db: Session, participant: Participant, session_id: str):
    from app.models import OilSession

    row = db.get(OilSession, session_id)
    if row is None or row.participant_id != participant.id:
        fail(404, "session_not_found", "That oil-use session was not found for this account.")
    return row
