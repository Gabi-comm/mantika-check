"""Color-space conversion and summary statistics for a cropped region."""
from __future__ import annotations

import cv2
import numpy as np


def color_stats(region_bgr: np.ndarray) -> dict:
    """Mean/median color in HSV and CIELAB for a BGR region.

    Returns an all-NaN dict for an empty region rather than raising,
    so a bad crop doesn't kill the whole batch.
    """
    if region_bgr is None or region_bgr.size == 0:
        keys = [f"{space}_{stat}_{ch}" for space in ("hsv", "lab") for stat in ("mean", "median") for ch in range(3)]
        return {k: float("nan") for k in keys}

    hsv = cv2.cvtColor(region_bgr, cv2.COLOR_BGR2HSV).reshape(-1, 3).astype(np.float64)
    lab = cv2.cvtColor(region_bgr, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float64)

    stats = {}
    for name, arr in (("hsv", hsv), ("lab", lab)):
        for ch in range(3):
            stats[f"{name}_mean_{ch}"] = float(np.mean(arr[:, ch]))
            stats[f"{name}_median_{ch}"] = float(np.median(arr[:, ch]))
    return stats
