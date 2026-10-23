"""Group-aware train/val/test splitting.

A single physical strip photographed multiple times must land
entirely in one split -- otherwise the model "sees" the test set
during training through near-duplicate images.
"""
from __future__ import annotations

import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

MIN_DISTINCT_GROUPS = 10  # below this, a 70/20/10 split is not meaningful


def can_split(df: pd.DataFrame, group_col: str = "physical_strip_id") -> bool:
    return group_col in df.columns and df[group_col].nunique(dropna=True) >= MIN_DISTINCT_GROUPS


def group_aware_split(
    df: pd.DataFrame,
    group_col: str = "physical_strip_id",
    train_frac: float = 0.7,
    val_frac: float = 0.2,
    random_state: int = 42,
) -> dict[str, pd.DataFrame]:
    """Split by group_col. Raises if there aren't enough distinct groups
    to make a 70/20/10-style split meaningful -- never silently forces
    a split on too few independent samples.
    """
    if not can_split(df, group_col):
        raise ValueError(
            f"Need >= {MIN_DISTINCT_GROUPS} distinct '{group_col}' values for a group-aware split; "
            f"got {df[group_col].nunique(dropna=True) if group_col in df.columns else 0}."
        )
    test_frac = 1 - train_frac - val_frac
    groups = df[group_col]

    splitter1 = GroupShuffleSplit(n_splits=1, test_size=test_frac, random_state=random_state)
    train_val_idx, test_idx = next(splitter1.split(df, groups=groups))

    train_val_df = df.iloc[train_val_idx]
    splitter2 = GroupShuffleSplit(n_splits=1, test_size=val_frac / (train_frac + val_frac), random_state=random_state)
    train_idx, val_idx = next(splitter2.split(train_val_df, groups=train_val_df[group_col]))

    return {
        "train": train_val_df.iloc[train_idx],
        "val": train_val_df.iloc[val_idx],
        "test": df.iloc[test_idx],
    }
