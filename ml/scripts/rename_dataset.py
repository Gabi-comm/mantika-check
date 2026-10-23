#!/usr/bin/env python
"""Rename raw strip photos into a consistent, research-friendly scheme.

blue_strip01_001.jpg, yellow_strip01_001.jpg, green_strip01_001.jpg,
reference_sheet_001.jpg -- one physical strip per color, sequential by
original filename. Idempotent: files already in canonical form are left
alone. Two-phase (temp name, then final name) so no rename can collide
with or overwrite another file.
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

import cv2

ML_DIR = Path(__file__).parent.parent
RAW_DIR = ML_DIR / "data" / "raw"
REFERENCE_DIR = ML_DIR / "data" / "reference"
MANIFEST_PATH = ML_DIR / "data" / "annotations" / "manifest.csv"
MAPPING_PATH = ML_DIR / "data" / "annotations" / "rename_map.csv"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# color -> (folder, canonical pattern, prefix template, physical_strip_id)
COLOR_FOLDERS = {
    "blue": (RAW_DIR / "blue", "blue_01"),
    "yellow": (RAW_DIR / "yellow", "yellow_01"),
    "green": (RAW_DIR / "green", "green_01"),
}


def canonical_pattern(kind: str) -> re.Pattern:
    if kind == "reference":
        return re.compile(r"^reference_sheet_(\d{3})\.(jpg|jpeg|png)$", re.IGNORECASE)
    return re.compile(rf"^{kind}_strip01_(\d{{3}})\.(jpg|jpeg|png)$", re.IGNORECASE)


def list_images(folder: Path) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS
    )


def plan_renames(folder: Path, kind: str, name_fn) -> tuple[list[dict], list[Path]]:
    """Return (mapping rows, skipped non-image files) for one folder.

    Files already in canonical form keep their existing index and are
    not touched (idempotent). Remaining files are sorted by original
    filename and assigned the lowest unused indices.
    """
    pattern = canonical_pattern(kind)
    all_entries = sorted(folder.iterdir()) if folder.is_dir() else []
    skipped = [p for p in all_entries if p.is_file() and p.suffix.lower() not in VALID_EXTENSIONS and p.name != ".gitkeep"]

    images = list_images(folder)
    already_canonical = {}
    to_rename = []
    used_indices = set()

    for img in images:
        match = pattern.match(img.name)
        if match:
            idx = int(match.group(1))
            already_canonical[img] = idx
            used_indices.add(idx)
        else:
            to_rename.append(img)

    rows = []
    for img, idx in already_canonical.items():
        rows.append({"original": img.name, "new": img.name, "status": "unchanged"})

    next_idx = 1
    for img in to_rename:
        while next_idx in used_indices:
            next_idx += 1
        used_indices.add(next_idx)
        rows.append({"original": img.name, "new": name_fn(next_idx), "status": "renamed", "_path": img, "_idx": next_idx})
        next_idx += 1

    return rows, skipped


def two_phase_rename(folder: Path, rows: list[dict]) -> None:
    pending = [r for r in rows if r["status"] == "renamed"]
    if not pending:
        return
    temp_suffix = ".rename_tmp"
    for row in pending:
        row["_path"].rename(row["_path"].with_name(row["_path"].name + temp_suffix))
    for row in pending:
        temp_path = folder / (row["original"] + temp_suffix)
        temp_path.rename(folder / row["new"])


def verify_readable(folder: Path, filenames: list[str]) -> list[str]:
    unreadable = []
    for name in filenames:
        img = cv2.imread(str(folder / name))
        if img is None or img.size == 0:
            unreadable.append(name)
    return unreadable


def main() -> None:
    mapping_rows = []
    report = {}

    for color, (folder, strip_id) in COLOR_FOLDERS.items():
        before_count = len(list_images(folder))
        rows, skipped = plan_renames(folder, color, lambda i, c=color: f"{c}_strip01_{i:03d}.jpg")
        two_phase_rename(folder, rows)
        after_count = len(list_images(folder))
        unreadable = verify_readable(folder, [r["new"] for r in rows])

        for r in rows:
            mapping_rows.append(
                {
                    "folder": color,
                    "original_filename": r["original"],
                    "new_filename": r["new"],
                    "physical_strip_id": strip_id,
                    "status": r["status"],
                }
            )
        report[color] = {
            "before": before_count,
            "after": after_count,
            "skipped_files": [p.name for p in skipped],
            "unreadable_after_rename": unreadable,
        }

    ref_rows, ref_skipped = plan_renames(REFERENCE_DIR, "reference", lambda i: f"reference_sheet_{i:03d}.jpg")
    before_ref = len(list_images(REFERENCE_DIR))
    two_phase_rename(REFERENCE_DIR, ref_rows)
    after_ref = len(list_images(REFERENCE_DIR))
    unreadable_ref = verify_readable(REFERENCE_DIR, [r["new"] for r in ref_rows])
    for r in ref_rows:
        mapping_rows.append(
            {
                "folder": "reference",
                "original_filename": r["original"],
                "new_filename": r["new"],
                "physical_strip_id": "",
                "status": r["status"],
            }
        )
    report["reference"] = {
        "before": before_ref,
        "after": after_ref,
        "skipped_files": [p.name for p in ref_skipped],
        "unreadable_after_rename": unreadable_ref,
    }

    # Preserve true original_filename lineage across reruns: once a file is
    # renamed, later runs see new==original (already canonical) and must not
    # clobber the historical mapping with that identity.
    history = {}
    if MAPPING_PATH.exists():
        with open(MAPPING_PATH, newline="") as f:
            for row in csv.DictReader(f):
                history[(row["folder"], row["new_filename"])] = row["original_filename"]
    for row in mapping_rows:
        key = (row["folder"], row["new_filename"])
        if key in history:
            row["original_filename"] = history[key]

    MAPPING_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MAPPING_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["folder", "original_filename", "new_filename", "physical_strip_id", "status"])
        writer.writeheader()
        writer.writerows(mapping_rows)

    for color, info in report.items():
        print(f"[{color}] before={info['before']} after={info['after']} skipped={info['skipped_files']} unreadable={info['unreadable_after_rename']}")
    print(f"Mapping written to {MAPPING_PATH}")


if __name__ == "__main__":
    main()
