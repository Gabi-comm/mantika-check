"""Load a strip photo and isolate the colored test-pad region.

Pipeline: load -> find the printed strip (largest quadrilateral-ish
contour) -> deskew it upright -> crop the central fraction, which is
where the color pad sits on the printed card.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def load_image(path: str | Path) -> np.ndarray | None:
    """Return a BGR image, or None if the file is missing/unreadable."""
    path = Path(path)
    if not path.exists() or path.suffix.lower() not in VALID_EXTENSIONS:
        return None
    img = cv2.imread(str(path))
    return img if img is not None and img.size > 0 else None


def detect_strip_roi(image: np.ndarray, min_area_frac: float = 0.05) -> np.ndarray:
    """Find the largest rectangular contour and return it deskewed/upright.

    Falls back to the original image if no contour clears the area
    threshold (e.g. a tightly cropped or low-contrast photo).
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image

    largest = max(contours, key=cv2.contourArea)
    img_area = image.shape[0] * image.shape[1]
    if cv2.contourArea(largest) < min_area_frac * img_area:
        return image

    rect = cv2.minAreaRect(largest)  # handles rotated strips
    return _warp_to_upright(image, rect)


def _warp_to_upright(image: np.ndarray, rect: tuple) -> np.ndarray:
    (cx, cy), (w, h), angle = rect
    if w < 1 or h < 1:
        return image
    box = cv2.boxPoints(rect)
    width, height = int(round(w)), int(round(h))
    if width < height:  # keep the strip's long side horizontal
        width, height = height, width
        angle += 90

    dst = np.array(
        [[0, height - 1], [0, 0], [width - 1, 0], [width - 1, height - 1]],
        dtype="float32",
    )
    src = _order_points(box)
    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(image, matrix, (width, height))
    return warped if warped.size > 0 else image


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Order 4 points as top-left, bottom-left, bottom-right, top-right."""
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).flatten()
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(diff)]
    bl = pts[np.argmax(diff)]
    return np.array([tl, bl, br, tr], dtype="float32")


def locate_color_pad(image: np.ndarray, frac: float = 0.4, min_area_frac: float = 0.0015) -> np.ndarray:
    """Crop to the most saturated contiguous blob -- the printed color pad.

    A blind center-fraction crop (`extract_central_region`) only works when
    the pad happens to be centered and the strip fills most of the frame.
    For a strip photographed small/off-center (common with real phone
    photos), the geometric center lands on plain card/background instead.
    Saturation picks out the pad directly, independent of strip position
    or how well `detect_strip_roi` located the card. Falls back to the
    center-fraction crop when no clear saturated blob is found (e.g. the
    gray/white test fixtures used in unit tests).
    """
    if image is None or image.size == 0:
        return image
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1]
    threshold = max(40, int(np.percentile(saturation, 85)))
    mask = (saturation >= threshold).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    img_area = image.shape[0] * image.shape[1]
    if contours:
        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        if min_area_frac * img_area <= area <= 0.9 * img_area:
            x, y, w, h = cv2.boundingRect(largest)
            mx, my = int(w * 0.1), int(h * 0.1)  # shrink inward to avoid pad-edge bleed
            x0, y0, x1, y1 = x + mx, y + my, x + w - mx, y + h - my
            if x1 > x0 and y1 > y0:
                return image[y0:y1, x0:x1]
    return extract_central_region(image, frac=frac)


def extract_central_region(strip_img: np.ndarray, frac: float = 0.4) -> np.ndarray:
    """Crop the central `frac` (by side length) of the strip image."""
    h, w = strip_img.shape[:2]
    if h == 0 or w == 0:
        return strip_img
    cy, cx = h // 2, w // 2
    half_h, half_w = max(1, int(h * frac / 2)), max(1, int(w * frac / 2))
    y0, y1 = max(0, cy - half_h), min(h, cy + half_h)
    x0, x1 = max(0, cx - half_w), min(w, cx + half_w)
    return strip_img[y0:y1, x0:x1]
