from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings, resolve_sqlite, storage_path
from app.models import Base

engine = None
SessionLocal = None


def init_db() -> None:
    global engine, SessionLocal
    if engine is not None:
        return
    settings = get_settings()
    storage_path()
    url = resolve_sqlite(settings.database_url)
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(engine)

    from app.seed import seed

    db = SessionLocal()
    try:
        seed(db, settings)
        db.commit()
    finally:
        db.close()


def shutdown_db() -> None:
    global engine, SessionLocal
    if engine is not None:
        engine.dispose()
    engine = None
    SessionLocal = None
    get_settings.cache_clear()


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
