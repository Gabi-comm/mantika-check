#!/usr/bin/env python
"""Confusion matrix + ROI-detection stats over the real dataset.

Excludes the three known byte-identical duplicate photos from accuracy
metrics (listed in DUPLICATE_IMAGE_IDS) without touching any image file.
Preliminary/in-sample only: this measures printed-ink color recognition,
not oil chemistry. See docs/ml-methodology.md.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))
from src.preprocessing.roi import detect_strip_roi, load_image

ML_DIR = Path(__file__).parent.parent
RESULTS_PATH = ML_DIR / "data" / "processed" / "results.csv"
CONFUSION_PATH = ML_DIR / "data" / "processed" / "confusion_matrix.csv"

# Byte-identical duplicate photos (same physical strip photographed/copied
# twice) -- kept on disk, excluded here so one sample isn't double-counted.
DUPLICATE_IMAGE_IDS = {"blue_strip01_008", "blue_strip01_013", "yellow_strip01_008"}


def main() -> None:
    df = pd.read_csv(RESULTS_PATH)
    eval_df = df[~df["image_id"].isin(DUPLICATE_IMAGE_IDS)].copy()

    roi_found = 0
    for path in eval_df["image_path"]:
        image = load_image(path)
        if image is None:
            continue
        roi = detect_strip_roi(image)
        if roi.shape != image.shape:  # a different shape means a contour was found & warped
            roi_found += 1

    cm = pd.crosstab(eval_df["color_label"], eval_df["predicted_color"], rownames=["actual"], colnames=["predicted"])
    cm.to_csv(CONFUSION_PATH)

    accuracy = (eval_df["color_label"] == eval_df["predicted_color"]).mean()
    print(f"Excluded as duplicates: {sorted(DUPLICATE_IMAGE_IDS)}")
    print(f"Evaluation set: {len(eval_df)}/{len(df)} images")
    print(f"ROI (strip) detection succeeded: {roi_found}/{len(eval_df)}")
    print(f"In-sample accuracy (preliminary, printed-color-only): {accuracy:.3f}")
    print()
    print(cm)
    print(f"\nConfusion matrix written to {CONFUSION_PATH}")


if __name__ == "__main__":
    main()
