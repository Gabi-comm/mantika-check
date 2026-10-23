import numpy as np
import pytest

from src.classification.baseline_ml import enough_samples_to_train, predict, train


def test_enough_samples_to_train_false_when_sparse():
    assert enough_samples_to_train(["blue", "yellow"]) is False
    assert enough_samples_to_train([]) is False


def test_enough_samples_to_train_true_when_balanced():
    labels = ["blue"] * 5 + ["yellow"] * 5
    assert enough_samples_to_train(labels) is True


def test_train_raises_on_insufficient_samples():
    X = np.random.rand(3, 6)
    with pytest.raises(ValueError):
        train(X, ["blue", "yellow", "green"])


def test_train_and_predict_round_trip():
    rng = np.random.default_rng(0)
    X_blue = rng.normal(loc=0, scale=0.1, size=(6, 6))
    X_yellow = rng.normal(loc=5, scale=0.1, size=(6, 6))
    X = np.vstack([X_blue, X_yellow])
    y = ["blue"] * 6 + ["yellow"] * 6
    model = train(X, y)
    preds = predict(model, X)
    assert set(preds) <= {"blue", "yellow"}
    assert len(preds) == len(y)
