from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def new_id() -> str:
    return str(uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), unique=True, nullable=True)
    pseudonym: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    consent_status: Mapped[str] = mapped_column(String(32), default="pending")
    consent_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ParticipantIdentity(Base):
    """Names and stall details. Kept out of exports and researcher lists."""

    __tablename__ = "participant_identities"

    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"), primary_key=True)
    contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    stall_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    stall_area: Mapped[str | None] = mapped_column(String(200), nullable=True)


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"), primary_key=True)
    answers_json: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class OilSession(Base):
    __tablename__ = "oil_sessions"
    __table_args__ = (UniqueConstraint("participant_id", "client_mutation_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"), index=True)
    client_mutation_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    oil_type: Mapped[str] = mapped_column(String(120))
    food: Mapped[str] = mapped_column(String(120))
    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    heating_minutes: Mapped[float] = mapped_column(Float)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class OilEvent(Base):
    __tablename__ = "oil_events"
    __table_args__ = (UniqueConstraint("participant_id", "client_mutation_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("oil_sessions.id"), index=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(32))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    client_mutation_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class StripPhoto(Base):
    __tablename__ = "strip_photos"
    __table_args__ = (UniqueConstraint("participant_id", "client_mutation_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(ForeignKey("oil_sessions.id"), nullable=True)
    physical_strip_id: Mapped[str] = mapped_column(String(36), index=True)
    client_mutation_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    storage_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    device_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    lighting_condition: Mapped[str | None] = mapped_column(String(120), nullable=True)
    color_card_present: Mapped[bool] = mapped_column(Boolean, default=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sync_status: Mapped[str] = mapped_column(String(32), default="analyzed")
    retake_reasons: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class StripClassification(Base):
    __tablename__ = "strip_classifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    photo_id: Mapped[str] = mapped_column(ForeignKey("strip_photos.id"), index=True)
    source: Mapped[str] = mapped_column(String(32))
    band: Mapped[str | None] = mapped_column(String(16), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    label_status: Mapped[str] = mapped_column(String(32))
    calibration_status: Mapped[str] = mapped_column(String(64))
    experimental: Mapped[bool] = mapped_column(Boolean, default=True)
    rgb_r: Mapped[float | None] = mapped_column(Float, nullable=True)
    rgb_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    rgb_b: Mapped[float | None] = mapped_column(Float, nullable=True)
    lab_l: Mapped[float | None] = mapped_column(Float, nullable=True)
    lab_a: Mapped[float | None] = mapped_column(Float, nullable=True)
    lab_b: Mapped[float | None] = mapped_column(Float, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CalibrationProfile(Base):
    __tablename__ = "calibration_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(64))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    bands_json: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ResearchDataset(Base):
    __tablename__ = "research_datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(200))
    evidence_source: Mapped[str] = mapped_column(String(64))
    declared_source_name: Mapped[str] = mapped_column(String(200))
    citation: Mapped[str] = mapped_column(Text)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str] = mapped_column(String(32))
    filename: Mapped[str] = mapped_column(String(255))
    profile_json: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class DatasetRow(Base):
    __tablename__ = "dataset_rows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    dataset_id: Mapped[str] = mapped_column(ForeignKey("research_datasets.id"), index=True)
    temperature_c: Mapped[float] = mapped_column(Float)
    time_h: Mapped[float] = mapped_column(Float)
    measured_value: Mapped[float] = mapped_column(Float)
    row_index: Mapped[int] = mapped_column(Integer)


class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    dataset_id: Mapped[str] = mapped_column(ForeignKey("research_datasets.id"), index=True)
    evidence_source: Mapped[str] = mapped_column(String(64))
    result_json: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class LabReference(Base):
    __tablename__ = "lab_references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"), index=True)
    tpc: Mapped[float] = mapped_column(Float)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    lab_name: Mapped[str] = mapped_column(String(200))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class UsabilitySession(Base):
    """Anonymous task timing and SUS. Not linked to a stall identity."""

    __tablename__ = "usability_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    consented: Mapped[bool] = mapped_column(Boolean, default=False)
    practice: Mapped[bool] = mapped_column(Boolean, default=True)
    sus: Mapped[float] = mapped_column(Float)
    tasks_json: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(80))
    target: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
