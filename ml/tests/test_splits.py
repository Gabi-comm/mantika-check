import pandas as pd
import pytest

from src.evaluation.splits import can_split, group_aware_split


def _manifest_with_groups(n_groups: int, photos_per_group: int = 2) -> pd.DataFrame:
    rows = []
    for g in range(n_groups):
        for p in range(photos_per_group):
            rows.append({"physical_strip_id": f"strip_{g}", "image_id": f"strip_{g}_{p}"})
    return pd.DataFrame(rows)


def test_can_split_false_with_too_few_groups():
    df = _manifest_with_groups(3)
    assert can_split(df) is False


def test_can_split_true_with_enough_groups():
    df = _manifest_with_groups(12)
    assert can_split(df) is True


def test_group_aware_split_raises_on_insufficient_groups():
    df = _manifest_with_groups(3)
    with pytest.raises(ValueError):
        group_aware_split(df)


def test_group_aware_split_keeps_groups_intact():
    df = _manifest_with_groups(20, photos_per_group=3)
    splits = group_aware_split(df)
    train_groups = set(splits["train"]["physical_strip_id"])
    val_groups = set(splits["val"]["physical_strip_id"])
    test_groups = set(splits["test"]["physical_strip_id"])

    assert train_groups.isdisjoint(val_groups)
    assert train_groups.isdisjoint(test_groups)
    assert val_groups.isdisjoint(test_groups)
    assert len(train_groups) + len(val_groups) + len(test_groups) == 20
