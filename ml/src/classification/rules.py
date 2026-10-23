"""Rule-based blue/yellow/green classification from HSV hue.

OpenCV hue is 0-179. Ranges below are wide on purpose: this is a
preliminary sanity check on printed card colors, not a validated
chemical reading. See docs/ml-methodology.md for the caveat.
"""
from __future__ import annotations

import math

LABELS = ("blue", "green", "yellow")

# (label, hue_low, hue_high)
HUE_RANGES = (
    ("yellow", 15, 40),
    ("green", 40, 85),
    ("blue", 85, 135),
)
MIN_SATURATION = 25  # below this, the pixel is near-gray: unclassifiable


def classify_color(stats: dict) -> str:
    """Classify using median HSV hue/saturation from `color_stats`."""
    hue = stats.get("hsv_median_0", float("nan"))
    sat = stats.get("hsv_median_1", float("nan"))
    if math.isnan(hue) or math.isnan(sat) or sat < MIN_SATURATION:
        return "unknown"
    for label, low, high in HUE_RANGES:
        if low <= hue < high:
            return label
    return "unknown"
