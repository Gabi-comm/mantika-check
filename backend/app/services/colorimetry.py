import io

import numpy as np
from PIL import Image, ImageOps

# Placeholder patches so the pipeline can run before a real color card is measured.
# They are not a chemical standard.
SCHEMATIC_BANDS = [
    {"band": "1", "L": 85.0, "a": 2.0, "b": 55.0},
    {"band": "2", "L": 62.0, "a": 18.0, "b": 48.0},
    {"band": "3", "L": 32.0, "a": 12.0, "b": 18.0},
]


def srgb_to_lab(r: float, g: float, b: float) -> tuple[float, float, float]:
    def linearize(channel: float) -> float:
        value = channel / 255.0
        if value <= 0.04045:
            return value / 12.92
        return ((value + 0.055) / 1.055) ** 2.4

    red, green, blue = linearize(r), linearize(g), linearize(b)
    x = red * 0.4124564 + green * 0.3575761 + blue * 0.1804375
    y = red * 0.2126729 + green * 0.7151522 + blue * 0.0721750
    z = red * 0.0193339 + green * 0.1191920 + blue * 0.9503041
    xn, yn, zn = 0.95047, 1.0, 1.08883

    def f(t: float) -> float:
        if t > 0.008856:
            return t ** (1 / 3)
        return 7.787 * t + 16 / 116

    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def _distance(left: tuple[float, float, float], right: tuple[float, float, float]) -> float:
    return float(np.sqrt(sum((a - b) ** 2 for a, b in zip(left, right))))


def analyze_image(
    image_bytes: bytes,
    centroids: list[dict] | None,
    calibration_status: str,
    color_card_present: bool,
) -> dict:
    try:
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(image_bytes)))
        image = image.convert("RGB")
    except Exception as exc:
        raise ValueError("image_unreadable") from exc

    image.thumbnail((1600, 1600))
    width, height = image.size
    crop = image.crop((int(width * 0.25), int(height * 0.25), int(width * 0.75), int(height * 0.75)))
    pixels = np.asarray(crop, dtype=np.float64)
    if pixels.size == 0:
        raise ValueError("image_unreadable")

    mean = pixels.reshape(-1, 3).mean(axis=0)
    red, green, blue = (float(mean[0]), float(mean[1]), float(mean[2]))
    lab_l, lab_a, lab_b = srgb_to_lab(red, green, blue)
    gray = pixels.mean(axis=2)
    gradient_y, gradient_x = np.gradient(gray)
    sharpness = float(np.var(gradient_x) + np.var(gradient_y))
    # Spatial change in lightness. Channel differences inside one flat colour are not blur.
    spread = float(gray.std())
    luma = float(gray.mean())

    reasons: list[str] = []
    if min(width, height) < 64:
        reasons.append("image_too_small")
    if spread > 30 and sharpness < 8:
        reasons.append("blur_suspected")
    if luma < 20:
        reasons.append("too_dark")
    elif luma > 240:
        reasons.append("too_bright")

    band = None
    if not centroids:
        calibration_status = "unavailable"
        reasons.append("calibration_missing")
    else:
        here = (lab_l, lab_a, lab_b)
        ranked = sorted(
            centroids,
            key=lambda item: _distance(here, (item["L"], item["a"], item["b"])),
        )
        band = str(ranked[0]["band"])
        if len(ranked) > 1:
            gap = _distance(here, (ranked[1]["L"], ranked[1]["a"], ranked[1]["b"])) - _distance(
                here, (ranked[0]["L"], ranked[0]["a"], ranked[0]["b"])
            )
            if gap < 8:
                reasons.append("patches_hard_to_separate")

    if not color_card_present:
        reasons.append("color_card_not_confirmed")

    if band is None or not color_card_present:
        label_status = "incomplete"
    elif reasons:
        label_status = "needs_review"
    else:
        label_status = "experimental"

    return {
        "band": band,
        "label_status": label_status,
        "calibration_status": calibration_status,
        "experimental": True,
        "rgb": {"r": round(red, 2), "g": round(green, 2), "b": round(blue, 2)},
        "cielab": {"L": round(lab_l, 2), "a": round(lab_a, 2), "b": round(lab_b, 2)},
        "retake_reasons": reasons,
        "quality_checks": "heuristic",
        "is_tpc": False,
    }
