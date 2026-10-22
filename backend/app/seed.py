from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import (
    CalibrationProfile,
    Participant,
    ParticipantIdentity,
    ResearchDataset,
    DatasetRow,
    User,
)
from app.security import hash_password
from app.services.colorimetry import SCHEMATIC_BANDS
from app.services.forecasting import simulated_tpc_rows

DEMO_USERS = (
    ("vendor@mantika.local", "vendor-demo", "vendor", "Demo Vendor"),
    ("researcher@mantika.local", "researcher-demo", "researcher", None),
    ("admin@mantika.local", "admin-demo", "administrator", None),
)


def seed(db: Session, settings) -> None:
    if db.query(CalibrationProfile).filter(CalibrationProfile.is_active.is_(True)).first() is None:
        db.add(
            CalibrationProfile(
                name="Schematic placeholder",
                status="schematic_placeholder",
                is_active=True,
                bands_json=SCHEMATIC_BANDS,
            )
        )

    if settings.seed_demo:
        for email, password, role, contact in DEMO_USERS:
            if db.query(User).filter(User.email == email).first():
                continue
            user = User(email=email, password_hash=hash_password(password, settings.password_iterations), role=role)
            db.add(user)
            db.flush()
            if role == "vendor":
                participant = Participant(
                    user_id=user.id,
                    pseudonym=_pseudonym(db),
                    consent_status="granted",
                    consent_version="consent-2026-10",
                    consented_at=datetime.now(timezone.utc),
                )
                db.add(participant)
                db.flush()
                db.add(
                    ParticipantIdentity(
                        participant_id=participant.id,
                        contact_name=contact,
                        stall_area="Demo area",
                        stall_name="Demo stall",
                    )
                )

    if settings.seed_simulated:
        name = "SIMULATED placeholder — not Li (2020)"
        if db.query(ResearchDataset).filter(ResearchDataset.name == name).first() is None:
            dataset = ResearchDataset(
                name=name,
                evidence_source="simulated",
                declared_source_name="Simulated straight lines",
                citation="Invented rows so the forecasting screens can be built before the Mendeley file is imported.",
                source_url=None,
                outcome="tpc",
                filename="simulated_tpc_rows",
                profile_json={
                    "warnings": ["Simulated wiring data. Not Li (2020)."],
                    "operations": ["Generated straight lines at five temperatures from hour 0 through hour 30."],
                    "declared_outcome": "tpc",
                    "secondary_outcomes_not_used_as_target": ["acid_value", "carbonyl_value"],
                },
            )
            db.add(dataset)
            db.flush()
            for index, row in enumerate(simulated_tpc_rows()):
                db.add(
                    DatasetRow(
                        dataset_id=dataset.id,
                        temperature_c=row["temperature_c"],
                        time_h=row["time_h"],
                        measured_value=row["tpc"],
                        row_index=index,
                    )
                )


def _pseudonym(db: Session) -> str:
    for _ in range(10):
        code = "MC-" + uuid4().hex[:6].upper()
        if db.query(Participant).filter(Participant.pseudonym == code).first() is None:
            return code
    return "MC-" + uuid4().hex[:10].upper()
