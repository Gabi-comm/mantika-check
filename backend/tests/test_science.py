from pathlib import Path

import pytest

from app.services.colorimetry import srgb_to_lab
from app.services.datasets import DatasetError, parse_csv
from app.services.forecasting import crossings, evaluate_tpc, simulated_tpc_rows
from app.services.privacy import area_summary, split_report

SAMPLES = Path(__file__).resolve().parents[1] / "samples"


def _baseline(payload, model, validation):
    for item in payload["baselines"]:
        if item["model"] == model and item["validation"] == validation:
            return item
    raise AssertionError(f"missing {model} {validation}")


def _crossing(payload, temperature):
    for item in payload:
        if item["temperature_c"] == temperature:
            return item
    raise AssertionError(temperature)


def test_lab_white_and_black_are_in_range():
    light, a_white, b_white = srgb_to_lab(255, 255, 255)
    dark, _, _ = srgb_to_lab(0, 0, 0)
    assert light > 95
    assert abs(a_white) < 2
    assert abs(b_white) < 2
    assert dark < 5


def test_crossing_does_not_extrapolate():
    rows = [
        {"temperature_c": 175, "time_h": 0, "tpc": 10},
        {"temperature_c": 175, "time_h": 10, "tpc": 15},
        {"temperature_c": 175, "time_h": 20, "tpc": 20},
    ]
    found = crossings(rows)[0]
    assert found["status"] == "not_reached"
    assert found["hours"] is None
    assert "not extended" in found["note"].lower() or "not reached" in found["note"].lower()


def test_crossing_interpolates_only_between_neighbors():
    rows = [
        {"temperature_c": 190, "time_h": 0, "tpc": 15},
        {"temperature_c": 190, "time_h": 10, "tpc": 35},
    ]
    found = crossings(rows)[0]
    assert found["status"] == "interpolated"
    assert found["hours"] == pytest.approx(5.0)


def test_simulated_curves_keep_the_research_rules():
    payload = evaluate_tpc(
        simulated_tpc_rows(),
        evidence_source="simulated",
        dataset_name="SIMULATED",
        declared_source_name="lines",
        dataset_id="sim",
        evaluation_id="eval",
    )
    assert payload["target"] == "tpc"
    assert payload["vendor_specific_forecast"] == "disabled"
    assert payload["strip_photos_used"] is False
    assert payload["reporting_block"]["en"].startswith("These rows are simulated")
    assert "hours_remaining" not in payload

    curve = _baseline(payload, "temperature_curve_fit", "held_out_time")
    assert curve["status"] == "completed"
    assert curve["mae"] < 0.05
    assert curve["n_scored"] == len(curve["predictions"])

    blocked = _baseline(payload, "temperature_curve_fit", "leave_one_temperature_out")
    assert blocked["status"] == "not_applicable"
    assert blocked["mae"] is None

    ridge = _baseline(payload, "ridge_regression", "held_out_time")
    loto = _baseline(payload, "ridge_regression", "leave_one_temperature_out")
    assert ridge["status"] == "completed"
    assert loto["status"] == "completed"
    assert loto["mae"] < 5

    low = _crossing(payload["crossings"], 160)
    high = _crossing(payload["crossings"], 220)
    exact = _crossing(payload["crossings"], 190)
    assert low["status"] == "not_reached"
    assert low["hours"] is None
    assert high["status"] == "interpolated"
    assert 19 < high["hours"] < 20
    assert exact["status"] == "observed"
    assert exact["hours"] == 30


def test_acid_value_is_not_accepted_as_tpc():
    content = (SAMPLES / "acid_value_only_do_not_import_as_tpc.csv").read_bytes()
    with pytest.raises(DatasetError) as caught:
        parse_csv(content, "tpc")
    assert caught.value.code == "outcome_mismatch"


def test_repository_tpc_files_import_with_their_real_headers():
    root = Path(__file__).resolve().parents[2]
    long_form = parse_csv((root / "models" / "data" / "frying_oil_long.csv").read_bytes(), "tpc")
    wide = parse_csv((root / "models" / "data" / "total_polar_compoents.csv").read_bytes(), "tpc")
    assert long_form["profile"]["rows_used"] == 155
    assert wide["profile"]["rows_used"] == 155
    assert wide["profile"]["time_min_h"] == 0
    assert wide["profile"]["time_max_h"] == 30
    assert long_form["rows"][0]["measured_value"] == wide["rows"][0]["measured_value"]
    with pytest.raises(DatasetError) as caught:
        parse_csv((root / "models" / "data" / "total_polar_compoents.csv").read_bytes(), "acid_value")
    assert caught.value.code == "outcome_mismatch"


def test_long_headers_keep_tpc_and_ignore_acid_value():
    content = (SAMPLES / "simulated_not_li2020.csv").read_bytes()
    parsed = parse_csv(content, "tpc")
    values = [row["measured_value"] for row in parsed["rows"]]
    assert values[0] == 4
    assert 0.2 not in values
    assert parsed["profile"]["ignored_columns"]
    assert "acid value" in " ".join(parsed["profile"]["operations"]).lower() or any(
        "acid" in column.lower() for column in parsed["profile"]["ignored_columns"]
    )


def test_small_groups_are_suppressed_without_a_count():
    hidden = area_summary(4, 20, 9)
    assert hidden["suppressed"] is True
    assert "stalls" not in hidden
    assert "sessions" not in hidden

    shown = area_summary(5, 20, 9)
    assert shown["suppressed"] is False
    assert shown["stalls"] == 5


def test_same_strip_cannot_sit_in_both_splits():
    report = split_report(["strip-a", "strip-b"], ["strip-b", "strip-c"])
    assert report["ok"] is False
    assert report["leaks"] == ["strip-b"]
