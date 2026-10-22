from fastapi import APIRouter, File, UploadFile

from app.deps import fail
from app.services.colorimetry import SCHEMATIC_BANDS, analyze_image

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
