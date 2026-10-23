"""Build and validate the image manifest.

The manifest is the single source of truth linking an image file to
its color label and (once supplied) its physical strip identity. Scan
only fills what's derivable from the folder layout; the rest stays
blank for the user to fill in by hand.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from .preprocessing.roi import VALID_EXTENSIONS

MANIFEST_COLUMNS = [
    "image_id",
    "physical_strip_id",
    "image_path",
    "color_label",
    "phone_id",
    "lighting_condition",
    "capture_session",
]
COLOR_FOLDERS = ("blue", "yellow", "green")


def build_manifest(raw_dir: str | Path) -> pd.DataFrame:
    """Scan ml/data/raw/{blue,yellow,green}/ for images.

    One row per image. physical_strip_id/phone_id/lighting_condition/
    capture_session are left blank -- never inferred or invented.
    """
    raw_dir = Path(raw_dir)
    rows = []
    for color in COLOR_FOLDERS:
        color_dir = raw_dir / color
        if not color_dir.is_dir():
            continue
        for img_path in sorted(color_dir.iterdir()):
            if img_path.suffix.lower() not in VALID_EXTENSIONS:
                continue
            rows.append(
                {
                    "image_id": img_path.stem,
                    "physical_strip_id": None,
                    "image_path": str(img_path),
                    "color_label": color,
                    "phone_id": None,
                    "lighting_condition": None,
                    "capture_session": None,
                }
            )
    return pd.DataFrame(rows, columns=MANIFEST_COLUMNS)


def validate_manifest(df: pd.DataFrame) -> list[str]:
    """Return a list of human-readable warnings; empty means clean."""
    warnings = []
    missing_cols = [c for c in MANIFEST_COLUMNS if c not in df.columns]
    if missing_cols:
        warnings.append(f"Missing required columns: {missing_cols}")
        return warnings
    if df.empty:
        warnings.append("Manifest has no rows (raw/ folders are empty).")
        return warnings
    if df["physical_strip_id"].isna().all():
        warnings.append("physical_strip_id is unset for every row: group-aware splitting is disabled.")
    if df["image_path"].apply(lambda p: not Path(p).exists()).any():
        warnings.append("Some image_path entries do not exist on disk.")
    return warnings
