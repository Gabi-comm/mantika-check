"""TPC baselines for the published frying dataset.

Strip photographs are not inputs. Vendor hours-remaining is not an output.
Crossings use neighboring observations only.
"""

import numpy as np

from app.limitations import LAB_LIMITATIONS, PROVENANCE_NOTE, SIMULATED_BLOCK, TPC_BENCHMARK

RIDGE_ALPHA = 1.0
HELD_OUT_FRACTION = 0.2


def simulated_tpc_rows() -> list[dict]:
    """Straight lines for wiring the lab before the Mendeley file is imported."""
    rows = []
    for temperature, slope in (
        (160, 0.35),
        (175, 0.50),
        (190, 0.70),
        (205, 0.90),
        (220, 1.10),
    ):
        for hour in range(31):
            rows.append(
                {
                    "temperature_c": float(temperature),
                    "time_h": float(hour),
                    "tpc": round(4 + slope * hour, 4),
                }
            )
    return rows


def crossings(rows: list[dict], threshold: float = TPC_BENCHMARK) -> list[dict]:
    grouped: dict[float, list[dict]] = {}
    for row in rows:
        grouped.setdefault(float(row["temperature_c"]), []).append(row)
    found = []
    for temperature in sorted(grouped):
        points = sorted(grouped[temperature], key=lambda item: item["time_h"])
        found.append(_one_crossing(temperature, points, threshold))
    return found


def evaluate_tpc(
    rows: list[dict],
    *,
    evidence_source: str,
    dataset_name: str,
    declared_source_name: str,
    dataset_id: str,
    evaluation_id: str,
) -> dict:
    clean = _dedupe(rows)
    grouped = _group(clean)
    curve_holdout, curve_fits, curve_notes, curve_skipped = _curve_held_out(grouped)
    ridge_holdout, ridge_notes, ridge_skipped = _ridge_held_out(grouped)
    loto, loto_notes = _ridge_loto(grouped)

    limitations = {
        "en": list(LAB_LIMITATIONS["en"]),
        "fil": list(LAB_LIMITATIONS["fil"]),
    }
    reporting_block = None
    if evidence_source == "simulated":
        reporting_block = SIMULATED_BLOCK
        limitations["en"].append(SIMULATED_BLOCK["en"])
        limitations["fil"].append(SIMULATED_BLOCK["fil"])
    else:
        limitations["en"].append(PROVENANCE_NOTE["en"])
        limitations["fil"].append(PROVENANCE_NOTE["fil"])

    return {
        "id": evaluation_id,
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "evidence_source": evidence_source,
        "declared_source_name": declared_source_name,
        "target": "tpc",
        "secondary_outcomes_excluded": ["acid_value", "carbonyl_value"],
        "vendor_specific_forecast": "disabled",
        "strip_photos_used": False,
        "reporting_block": reporting_block,
        "limitations": limitations,
        "method": {
            "deterministic": True,
            "held_out_time": (
                "Within each temperature, the last 20 percent of time points are held out "
                "and at least three earlier points stay in the fit."
            ),
            "leave_one_temperature_out": (
                "The pooled ridge model is retrained without one temperature and scored on that temperature. "
                "A curve fit to a single temperature is not scored this way, because it has no estimate for a temperature it never saw."
            ),
            "crossing": (
                "The 25 percent TPC mark is located only between neighboring observations. "
                "Model curves are not extended past the last hour to invent a crossing."
            ),
            "threshold_tpc": TPC_BENCHMARK,
            "threshold_meaning": "Research benchmark for this project. Not a Philippine legal limit.",
        },
        "baselines": [
            _baseline(
                "temperature_curve_fit",
                "held_out_time",
                curve_holdout,
                curve_notes,
                {"degree": "1 when the fit has fewer than 4 points, otherwise 2", "scope": "one temperature at a time"},
                curve_skipped,
            ),
            _baseline(
                "temperature_curve_fit",
                "leave_one_temperature_out",
                [],
                [
                    "Not applicable. A separate curve for each temperature cannot be scored on a temperature that was removed."
                ],
                {"scope": "one temperature at a time"},
                [],
                not_applicable=True,
            ),
            _baseline(
                "ridge_regression",
                "held_out_time",
                ridge_holdout,
                ridge_notes,
                _ridge_hyperparameters(),
                ridge_skipped,
            ),
            _baseline(
                "ridge_regression",
                "leave_one_temperature_out",
                loto,
                loto_notes,
                _ridge_hyperparameters(),
                [],
            ),
        ],
        "fit_curves": curve_fits,
        "fit_curve_usage": "display_only_not_a_score",
        "crossings": crossings(clean),
        "observed_series": [
            {
                "temperature_c": temperature,
                "evidence_source": evidence_source,
                "points": [
                    {"time_h": point["time_h"], "tpc": point["tpc"]}
                    for point in sorted(points, key=lambda item: item["time_h"])
                ],
            }
            for temperature, points in sorted(grouped.items())
        ],
    }


def _one_crossing(temperature: float, points: list[dict], threshold: float) -> dict:
    base = {
        "temperature_c": temperature,
        "threshold_tpc": threshold,
        "threshold_meaning": "Research benchmark for this project. Not a Philippine legal limit.",
    }
    if not points:
        return {
            **base,
            "status": "not_reached",
            "hours": None,
            "note": "Not reached. There are no observations at this temperature.",
        }
    if points[0]["tpc"] >= threshold:
        return {
            **base,
            "status": "observed",
            "hours": points[0]["time_h"],
            "note": (
                "The first observation is already at or above the research benchmark. "
                "The crossing may be earlier than this series. This is not a vendor disposal time."
            ),
        }
    for earlier, later in zip(points, points[1:]):
        y0, y1 = earlier["tpc"], later["tpc"]
        if y0 < threshold and y1 == threshold:
            return {
                **base,
                "status": "observed",
                "hours": later["time_h"],
                "note": "An observation lands on the research benchmark. This is not a vendor disposal time.",
            }
        if y0 < threshold < y1:
            fraction = (threshold - y0) / (y1 - y0)
            hours = earlier["time_h"] + fraction * (later["time_h"] - earlier["time_h"])
            return {
                **base,
                "status": "interpolated",
                "hours": round(float(hours), 6),
                "note": (
                    "Placed between two neighboring observations. "
                    "The line was not extended beyond them. This is not a vendor disposal time."
                ),
            }
    return {
        **base,
        "status": "not_reached",
        "hours": None,
        "note": "Not reached within the observed times. The curve was not extended past the last hour.",
    }


def _curve_held_out(grouped: dict[float, list[dict]]) -> tuple[list[dict], list[dict], list[str], list[str]]:
    predictions: list[dict] = []
    fits: list[dict] = []
    notes: list[str] = []
    skipped: list[str] = []
    for temperature, points in sorted(grouped.items()):
        hold, train = _time_split(points)
        if not hold:
            skipped.append(str(temperature))
            continue
        degree = 2 if len(train) >= 4 else 1
        train_t = np.asarray([item["time_h"] for item in train], dtype=float)
        train_y = np.asarray([item["tpc"] for item in train], dtype=float)
        try:
            coefficients = np.polyfit(train_t, train_y, degree)
        except np.linalg.LinAlgError:
            skipped.append(str(temperature))
            continue
        for item in hold:
            predicted = float(np.polyval(coefficients, item["time_h"]))
            predictions.append(_point(temperature, item, predicted))
        for item in points:
            fits.append(
                {
                    "temperature_c": temperature,
                    "time_h": item["time_h"],
                    "predicted": round(float(np.polyval(coefficients, item["time_h"])), 6),
                    "usage": "display_only_not_a_score",
                }
            )
    if skipped:
        notes.append(
            "These temperatures had too few points to hold out a tail and keep three fitting points: "
            + ", ".join(skipped)
            + "."
        )
    return predictions, fits, notes, skipped


def _ridge_held_out(grouped: dict[float, list[dict]]) -> tuple[list[dict], list[str], list[str]]:
    train: list[dict] = []
    hold: list[dict] = []
    skipped: list[str] = []
    for temperature, points in grouped.items():
        held, kept = _time_split(points)
        if not held:
            skipped.append(str(temperature))
            train.extend(points)
            continue
        train.extend(kept)
        hold.extend(held)
    notes = []
    if skipped:
        notes.append(
            "Temperatures kept entirely in the fit because a held-out tail was not available: "
            + ", ".join(skipped)
            + "."
        )
    if len(train) < 4 or not hold:
        return [], notes + ["Not enough rows to fit ridge regression and score a held-out time tail."], skipped
    predicted = _ridge_predict(train, hold)
    return [_point(item["temperature_c"], item, value) for item, value in zip(hold, predicted)], notes, skipped


def _ridge_loto(grouped: dict[float, list[dict]]) -> tuple[list[dict], list[str]]:
    if len(grouped) < 2:
        return [], ["Not applicable. Leave-one-temperature-out needs at least two temperatures."]
    predictions: list[dict] = []
    notes: list[str] = []
    for temperature, points in sorted(grouped.items()):
        train = [row for other, rows in grouped.items() if other != temperature for row in rows]
        if len(train) < 4:
            notes.append(f"{temperature}°C was not scored because the other temperatures had fewer than four rows.")
            continue
        predicted = _ridge_predict(train, points)
        predictions.extend(_point(temperature, item, value) for item, value in zip(points, predicted))
    return predictions, notes


def _ridge_predict(train: list[dict], test: list[dict]) -> np.ndarray:
    x_train = _design(train)
    y_train = np.asarray([item["tpc"] for item in train], dtype=float)
    x_test = _design(test)
    mean = x_train.mean(axis=0)
    scale = x_train.std(axis=0)
    scale = np.where(scale < 1e-12, 1.0, scale)
    centered = (x_train - mean) / scale
    y_mean = float(y_train.mean())
    y_centered = y_train - y_mean
    gram = centered.T @ centered + RIDGE_ALPHA * np.eye(centered.shape[1])
    beta = np.linalg.solve(gram, centered.T @ y_centered)
    return (x_test - mean) / scale @ beta + y_mean


def _design(rows: list[dict]) -> np.ndarray:
    time_h = np.asarray([row["time_h"] for row in rows], dtype=float)
    temperature = np.asarray([row["temperature_c"] for row in rows], dtype=float)
    return np.column_stack([time_h, temperature, time_h**2, time_h * temperature])


def _time_split(points: list[dict]) -> tuple[list[dict], list[dict]]:
    ordered = sorted(points, key=lambda item: item["time_h"])
    count = len(ordered)
    hold_count = max(1, int(round(count * HELD_OUT_FRACTION)))
    if count - hold_count < 3:
        return [], ordered
    return ordered[-hold_count:], ordered[:-hold_count]


def _point(temperature: float, item: dict, predicted: float) -> dict:
    return {
        "temperature_c": float(temperature),
        "time_h": float(item["time_h"]),
        "observed": float(item["tpc"]),
        "predicted": round(float(predicted), 6),
    }


def _baseline(
    model: str,
    validation: str,
    predictions: list[dict],
    notes: list[str],
    hyperparameters: dict,
    skipped: list[str],
    not_applicable: bool = False,
) -> dict:
    if not_applicable:
        status = "not_applicable"
        mae = None
        rmse = None
        per_temperature: list[dict] = []
        predictions = []
    elif not predictions:
        status = "insufficient_data"
        mae = None
        rmse = None
        per_temperature = []
    else:
        status = "completed"
        mae = _mae(predictions)
        rmse = _rmse(predictions)
        per_temperature = _per_temperature(predictions)
    if skipped and status == "completed":
        notes = list(notes)
    return {
        "model": model,
        "validation": validation,
        "status": status,
        "mae": mae,
        "rmse": rmse,
        "n_scored": len(predictions),
        "hyperparameters": hyperparameters,
        "notes": notes,
        "per_temperature": per_temperature,
        "predictions": predictions,
    }


def _per_temperature(predictions: list[dict]) -> list[dict]:
    grouped: dict[float, list[dict]] = {}
    for item in predictions:
        grouped.setdefault(item["temperature_c"], []).append(item)
    scores = []
    for temperature in sorted(grouped):
        group = grouped[temperature]
        scores.append(
            {
                "temperature_c": temperature,
                "n": len(group),
                "mae": _mae(group),
                "rmse": _rmse(group),
            }
        )
    return scores


def _mae(predictions: list[dict]) -> float:
    error = np.asarray([item["predicted"] - item["observed"] for item in predictions], dtype=float)
    return round(float(np.mean(np.abs(error))), 6)


def _rmse(predictions: list[dict]) -> float:
    error = np.asarray([item["predicted"] - item["observed"] for item in predictions], dtype=float)
    return round(float(np.sqrt(np.mean(error**2))), 6)


def _ridge_hyperparameters() -> dict:
    return {
        "alpha": RIDGE_ALPHA,
        "standardize_predictors": True,
        "intercept": True,
        "features": [
            "time_h",
            "temperature_c",
            "time_h_squared",
            "time_h_times_temperature_c",
        ],
        "estimator": "ridge_normal_equation",
    }


def _dedupe(rows: list[dict]) -> list[dict]:
    seen: set[tuple[float, float]] = set()
    cleaned = []
    for row in sorted(rows, key=lambda item: (item["temperature_c"], item["time_h"])):
        key = (round(float(row["temperature_c"]), 4), round(float(row["time_h"]), 4))
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(
            {
                "temperature_c": float(row["temperature_c"]),
                "time_h": float(row["time_h"]),
                "tpc": float(row["tpc"]),
            }
        )
    return cleaned


def _group(rows: list[dict]) -> dict[float, list[dict]]:
    grouped: dict[float, list[dict]] = {}
    for row in rows:
        grouped.setdefault(row["temperature_c"], []).append(row)
    return grouped
