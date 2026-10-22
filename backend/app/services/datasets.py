import csv
import io
import re

import numpy as np

EXPECTED_TEMPERATURES = {160, 175, 190, 205, 220}
VALUE_ALIASES = {
    "tpc": {"tpc", "total_polar_compounds", "total_polar_compound", "polar_compounds"},
    "acid_value": {"acid_value", "av", "acidvalue"},
    "carbonyl_value": {"carbonyl_value", "cv", "carbonyl"},
}
TEMP_ALIASES = {"temperature_c", "temperature", "temp", "temp_c", "frying_temperature"}
TIME_ALIASES = {"time_h", "time", "hours", "frying_time", "time_hours"}


class DatasetError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def norm_header(header: str) -> str:
    text = header.strip().lower().lstrip("\ufeff")
    text = text.replace("°c", "c").replace("°", "")
    text = re.sub(r"\(([^)]*)\)", r"_\1", text)
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    return text


def parse_csv(content: bytes, declared_outcome: str) -> dict:
    if declared_outcome not in VALUE_ALIASES:
        raise DatasetError(
            "outcome_invalid",
            "Import TPC, acid value, and carbonyl value as separate outcomes. They are not interchangeable.",
        )
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise DatasetError("encoding", "The file must be UTF-8 CSV.") from exc

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise DatasetError("header_missing", "The CSV needs a header row.")

    normalized = {name: norm_header(name) for name in reader.fieldnames}
    found = set(normalized.values())

    def pick(aliases: set[str]) -> str | None:
        for original, name in normalized.items():
            if name in aliases:
                return original
        return None

    temp_col = pick(TEMP_ALIASES)
    time_col = pick(TIME_ALIASES)
    if temp_col is None or time_col is None:
        raise DatasetError(
            "columns_missing",
            f"Need a temperature column and a time column in hours. Headers found: {sorted(found)}.",
        )

    present_outcomes = {
        outcome: pick(aliases) for outcome, aliases in VALUE_ALIASES.items() if pick(aliases)
    }
    value_col = present_outcomes.get(declared_outcome)
    generic = pick({"value", "measurement"})
    warning_notes: list[str] = []
    if value_col is None and generic and not present_outcomes:
        value_col = generic
        warning_notes.append(
            "The value column had a generic name. It was stored under the outcome you declared, not inferred."
        )
    if value_col is None:
        others = ", ".join(sorted(present_outcomes)) or "none"
        raise DatasetError(
            "outcome_mismatch",
            f"No {declared_outcome} column was found. Other outcomes present: {others}. "
            "Acid value and carbonyl value cannot be imported as TPC.",
        )

    ignored = [name for outcome, name in present_outcomes.items() if outcome != declared_outcome]

    rows_read = 0
    dropped_missing = 0
    used: list[dict] = []
    seen: set[tuple[float, float]] = set()
    duplicates = 0

    for raw in reader:
        if raw is None or all((value or "").strip() == "" for value in raw.values()):
            continue
        rows_read += 1
        temperature = _number(raw.get(temp_col))
        time_h = _number(raw.get(time_col))
        measured = _number(raw.get(value_col))
        if temperature is None or time_h is None or measured is None:
            dropped_missing += 1
            continue
        key = (round(temperature, 4), round(time_h, 4))
        if key in seen:
            duplicates += 1
            continue
        seen.add(key)
        used.append(
            {
                "temperature_c": temperature,
                "time_h": time_h,
                "measured_value": measured,
            }
        )

    if not used:
        raise DatasetError("no_usable_rows", "No rows had temperature, time, and the declared outcome.")

    temperatures = sorted({row["temperature_c"] for row in used})
    times = [row["time_h"] for row in used]
    values = [row["measured_value"] for row in used]
    warnings = list(warning_notes)
    unexpected = [temp for temp in temperatures if temp not in EXPECTED_TEMPERATURES]
    if unexpected:
        warnings.append(
            "Some temperatures are outside 160, 175, 190, 205, and 220°C. Confirm the unit is Celsius."
        )
    if max(times) > 30 or min(times) < 0:
        warnings.append("Li (2020) reports hours from 0 through 30. Confirm this time column is in hours.")
    if declared_outcome == "tpc" and float(np.median(values)) <= 1:
        warnings.append(
            "TPC in the published frying data is on a percent scale. These values look like fractions and were not rescaled."
        )

    operations = [
        "Normalized column headers.",
        "Coerced temperature, time, and the declared outcome to numbers.",
        "Dropped rows that were missing temperature, time, or the declared outcome.",
        "Kept the first row when temperature and time were duplicated.",
        "Did not copy acid value or carbonyl value into the TPC target.",
        "Did not convert units automatically.",
    ]
    if ignored:
        warnings.append(
            "Other chemical columns were stored only as a note. They were not used as "
            f"{declared_outcome}: {', '.join(ignored)}."
        )

    return {
        "rows": used,
        "profile": {
            "rows_read": rows_read,
            "rows_used": len(used),
            "rows_dropped_missing": dropped_missing,
            "duplicate_keys": duplicates,
            "temperatures_c": temperatures,
            "time_min_h": min(times),
            "time_max_h": max(times),
            "declared_outcome": declared_outcome,
            "ignored_columns": ignored,
            "warnings": warnings,
            "operations": operations,
            "secondary_outcomes_not_used_as_target": ["acid_value", "carbonyl_value"],
            "provenance_check": (
                "The server records the citation you typed. It does not certify the Mendeley file."
            ),
        },
    }


def describe(rows: list[dict]) -> dict:
    if not rows:
        return {"count": 0, "overall": None, "by_temperature": []}
    values = np.asarray([row["measured_value"] for row in rows], dtype=float)
    grouped: dict[float, list[dict]] = {}
    for row in rows:
        grouped.setdefault(row["temperature_c"], []).append(row)
    by_temperature = []
    for temperature in sorted(grouped):
        group = grouped[temperature]
        group_values = np.asarray([item["measured_value"] for item in group], dtype=float)
        times = [item["time_h"] for item in group]
        by_temperature.append(
            {
                "temperature_c": temperature,
                "n": int(group_values.size),
                "mean": _stat(group_values, "mean"),
                "min": float(group_values.min()),
                "max": float(group_values.max()),
                "time_min_h": min(times),
                "time_max_h": max(times),
            }
        )
    return {
        "count": int(values.size),
        "overall": {
            "mean": _stat(values, "mean"),
            "std": _stat(values, "std"),
            "min": float(values.min()),
            "max": float(values.max()),
        },
        "by_temperature": by_temperature,
    }


def _number(value: str | None) -> float | None:
    if value is None:
        return None
    text = value.strip().replace("%", "")
    if text == "":
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    if not np.isfinite(number):
        return None
    return number


def _stat(values: np.ndarray, kind: str) -> float | None:
    if values.size == 0:
        return None
    if kind == "mean":
        return float(values.mean())
    if values.size < 2:
        return None
    return float(values.std(ddof=1))
