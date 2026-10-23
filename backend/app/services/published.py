"""Read-only view of the v3 model export for the research screens.

The numbers come from the files already on main. This module does not refit them
and does not turn them into a vendor hours-remaining estimate.
"""

import csv
import json
from pathlib import Path

from app.config import ROOT
from app.services.datasets import parse_csv

MODELS = ROOT.parent / "models"
NAMES = {
    "A_curve_fit": "Curve fit",
    "B_ridge_poly": "Regularized regression",
    "B2_ridge_phys": "Regularized regression, physical features",
    "C_kinetic": "Kinetic model",
    "D_ensemble": "Ensemble",
}


class PublishedRunError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def published_catalog() -> dict:
    export_path = MODELS / "model_export.json"
    long_path = MODELS / "data" / "frying_oil_long.csv"
    if not export_path.is_file() or not long_path.is_file():
        raise PublishedRunError("The model export files are not in this checkout.")
    export = json.loads(export_path.read_text(encoding="utf-8"))
    audit = parse_csv(long_path.read_bytes(), "tpc")["profile"]
    coefficients = export["models"]["A_curve_fit"]["coefficients"]
    return {
        "version": export["version"],
        "fills_screens": ["v2-WOverview", "v2-WMLLab", "v2-WDataset", "v2-WReporting"],
        "citation": export["dataset"]["citation"],
        "rows": export["dataset"]["rows"],
        "temperatures_c": export["dataset"]["temperatures_c"],
        "hours": export["dataset"]["hours"],
        "oil_type": "Not specified by the source",
        "threshold_tpc_pct": export["threshold_tpc_pct"],
        "threshold_is_philippine_law": False,
        "vendor_hours_remaining": False,
        "disclaimer": export["disclaimer"],
        "dataset_audit": {
            "file": "models/data/frying_oil_long.csv",
            "rows_used": audit["rows_used"],
            "missing_values": audit["rows_dropped_missing"],
            "duplicate_rows": audit["duplicate_keys"],
            "time_unit": "hours",
            "time_min_h": audit["time_min_h"],
            "time_max_h": audit["time_max_h"],
            "temperatures_c": audit["temperatures_c"],
            "value_min": audit["value_min"],
            "value_max": audit["value_max"],
            "ignored_columns": audit["ignored_columns"],
            "layout": audit["layout"],
        },
        "chart": {
            "x": "hours",
            "y": "tpc_pct",
            "y_max_hint": 50,
            "benchmark_tpc_pct": 25,
            "benchmark_label": "25% research benchmark · not Philippine law",
            "series": [_series(temperature, coefficients[str(temperature)]) for temperature in export["dataset"]["temperatures_c"]],
        },
        "crossings": _crossings(),
        "metrics": _held_out(),
        "leave_one_temperature_out": _loto(),
        "selected_model": {
            "key": export["selected_model"],
            "name": NAMES.get(export["selected_model"], export["selected_model"]),
            "shown_to_vendors": False,
            "note": "Selected on unseen temperatures in the v3 export. It does not unlock an hours countdown.",
        },
        "strip_ranges_not_for_vendor_ui": {
            "source": export["strip_bands"]["source"],
            "show_on_vendor_phone": False,
            "bands": [
                {
                    "paper_color": band["band"],
                    "tpc_min": band["tpc_min"],
                    "tpc_max": band["tpc_max"],
                }
                for band in export["strip_bands"]["bands"]
            ],
        },
    }


def _series(temperature: int, coefficients: list[float]) -> dict:
    points = []
    for hour in range(31):
        tpc = coefficients[0] * hour * hour + coefficients[1] * hour + coefficients[2]
        points.append({"hour": hour, "tpc": tpc})
    return {"temperature_c": temperature, "model_key": "A_curve_fit", "points": points}


def _read_csv(name: str) -> list[dict]:
    path = MODELS / "metrics" / name
    if not path.is_file():
        raise PublishedRunError(f"Missing {path.name}.")
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _held_out() -> list[dict]:
    rows = []
    for record in _read_csv("metrics_held_out_time.csv"):
        if record["split"] != "held_out_time":
            continue
        key = record["model"]
        rows.append(
            {
                "model_key": key,
                "model": NAMES.get(key, key),
                "validation": "held_out_time",
                "validation_label": "Held-out time",
                "mae": float(record["MAE"]),
                "rmse": float(record["RMSE"]),
                "proposal_baseline": key in {"A_curve_fit", "B_ridge_poly"},
            }
        )
    return rows


def _loto() -> list[dict]:
    grouped: dict[int, dict] = {}
    for record in _read_csv("metrics_loto.csv"):
        if record["model"] not in {"A_curve_fit", "B_ridge_poly"}:
            continue
        temperature = int(float(record["held_out_temp"]))
        slot = grouped.setdefault(
            temperature,
            {"temperature_c": temperature, "curve_fit_mae": None, "regularized_mae": None},
        )
        value = float(record["MAE"])
        if record["model"] == "A_curve_fit":
            slot["curve_fit_mae"] = value
            slot["curve_fit_regime"] = record["regime"]
        else:
            slot["regularized_mae"] = value
            slot["regularized_regime"] = record["regime"]
    return [grouped[temperature] for temperature in sorted(grouped)]


def _crossings() -> list[dict]:
    found = []
    for record in _read_csv("threshold_crossings.csv"):
        status_text = record["status"].strip()
        observed = (record.get("observed_h") or "").strip()
        if status_text.startswith("censored") or observed == "":
            status = "not_reached"
            hours = None
            detail = "Still under 25% at 30 h"
        else:
            status = "observed" if status_text == "observed" else status_text
            hours = float(observed)
            detail = "Observed"
        found.append(
            {
                "temperature_c": int(float(record["temp_c"])),
                "status": status,
                "observed_h": hours,
                "detail": detail,
            }
        )
    return found
