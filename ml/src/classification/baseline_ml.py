"""Optional classical-ML baseline over CIELAB features.

Only meaningful once there are enough independent (distinct
physical_strip_id) labeled samples. Call `enough_samples_to_train`
before `train`; the pipeline will not fabricate a model otherwise.
"""
from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression

LAB_FEATURE_COLS = ["lab_mean_0", "lab_mean_1", "lab_mean_2", "lab_median_0", "lab_median_1", "lab_median_2"]
MIN_SAMPLES_PER_CLASS = 5


def enough_samples_to_train(labels: list[str]) -> bool:
    if not labels:
        return False
    counts = {label: labels.count(label) for label in set(labels)}
    return len(counts) >= 2 and min(counts.values()) >= MIN_SAMPLES_PER_CLASS


def train(features: np.ndarray, labels: list[str]) -> LogisticRegression:
    if not enough_samples_to_train(labels):
        raise ValueError("Not enough independent labeled samples to train a baseline model.")
    model = LogisticRegression(max_iter=1000)
    model.fit(features, labels)
    return model


def predict(model: LogisticRegression, features: np.ndarray) -> list[str]:
    return list(model.predict(features))
