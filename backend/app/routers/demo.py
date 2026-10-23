from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import fail
from app.models import UsabilitySession
from app.services.colorimetry import SCHEMATIC_BANDS, analyze_image
from app.services.published import PublishedRunError, published_catalog
from app.services.usability import UsabilityError, UsabilityIn, record_session, summary

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])


@router.post("/analyze")
async def analyze_strip(file: UploadFile = File(...)) -> dict:
    """Stateless colour reading for the vendor prototype. No account is required."""
    payload = await file.read()
    if not payload:
        fail(422, "image_missing", "Attach a strip photograph.")
    if len(payload) > 8 * 1024 * 1024:
        fail(422, "image_too_large", "Photographs must be 8 MB or smaller.")
    try:
        reading = analyze_image(payload, SCHEMATIC_BANDS, "schematic_placeholder", True)
    except ValueError:
        fail(422, "image_unreadable", "The file could not be read as an image.")
    reading["where"] = "research_server"
    reading["vendor_specific_forecast"] = "disabled"
    reading["separation"] = "This classification is from image colour. It is not a TPC forecast."
    return reading


@router.get("/published-run")
def published_run() -> dict:
    """Same research payload as the lab route, for the prototype desk before login exists."""
    try:
        return published_catalog()
    except PublishedRunError as exc:
        fail(503, "published_run_missing", exc.message)


@router.get("/usability")
def usability(db: Session = Depends(get_db)) -> dict:
    return summary(db.query(UsabilitySession).all())


@router.post("/usability")
def save_usability(body: UsabilityIn, db: Session = Depends(get_db)) -> dict:
    try:
        record_session(db, body.model_dump())
    except UsabilityError as exc:
        fail(422, exc.code, exc.message)
    return summary(db.query(UsabilitySession).all())
