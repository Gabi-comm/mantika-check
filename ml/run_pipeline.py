#!/usr/bin/env python
"""CLI entry point for the Mantika Check image baseline.

Usage:
    python run_pipeline.py manifest   # scan ml/data/raw/ -> ml/data/annotations/manifest.csv
    python run_pipeline.py process    # run CV pipeline over the manifest -> ml/data/processed/results.csv
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))  # allow `python run_pipeline.py` without install

from src.classification.rules import classify_color
from src.features.color import color_stats
from src.manifest import build_manifest, validate_manifest
from src.preprocessing.roi import detect_strip_roi, load_image, locate_color_pad

ML_DIR = Path(__file__).parent


def _paths(data_dir: Path) -> dict:
    return {
        "raw": data_dir / "raw",
        "manifest": data_dir / "annotations" / "manifest.csv",
        "results": data_dir / "processed" / "results.csv",
        "debug": data_dir / "processed" / "debug",
    }


def cmd_manifest(args: argparse.Namespace) -> None:
    paths = _paths(args.data_dir)
    df = build_manifest(paths["raw"])
    paths["manifest"].parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(paths["manifest"], index=False)
    for warning in validate_manifest(df):
        print(f"[warn] {warning}")
    print(f"Wrote {len(df)} row(s) to {paths['manifest']}")


def cmd_process(args: argparse.Namespace) -> None:
    paths = _paths(args.data_dir)
    if not paths["manifest"].exists():
        print(f"[error] {paths['manifest']} not found. Run `manifest` first.")
        return
    manifest = pd.read_csv(paths["manifest"])
    rows = []
    if args.debug:
        paths["debug"].mkdir(parents=True, exist_ok=True)

    for _, record in manifest.iterrows():
        image = load_image(record["image_path"])
        result = dict(record)
        if image is None:
            result.update({"status": "invalid_or_missing", "predicted_color": "unknown"})
            rows.append(result)
            continue

        strip = detect_strip_roi(image)
        region = locate_color_pad(strip)
        stats = color_stats(region)
        predicted = classify_color(stats)
        result.update(status="ok", predicted_color=predicted, **stats)
        rows.append(result)

        if args.debug:
            overlay = strip.copy()
            cv2.putText(overlay, predicted, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.imwrite(str(paths["debug"] / f"{record['image_id']}_overlay.png"), overlay)

    paths["results"].parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(paths["results"], index=False)
    print(f"Processed {len(rows)} row(s) -> {paths['results']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=ML_DIR / "data",
        help="Root data directory (default: ml/data). Override for isolated/test runs.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("manifest", help="Scan <data-dir>/raw/ and write the manifest CSV.")

    process_parser = sub.add_parser("process", help="Run the CV pipeline over the manifest.")
    process_parser.add_argument("--debug", action="store_true", help="Save annotated overlay images.")

    args = parser.parse_args()
    {"manifest": cmd_manifest, "process": cmd_process}[args.command](args)


if __name__ == "__main__":
    main()
