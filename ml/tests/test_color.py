import numpy as np

from src.classification.rules import classify_color
from src.features.color import color_stats


def _solid_bgr(color_bgr: tuple[int, int, int]) -> np.ndarray:
    return np.full((20, 20, 3), color_bgr, dtype=np.uint8)


def test_color_stats_on_solid_region():
    region = _solid_bgr((255, 0, 0))  # pure blue
    stats = color_stats(region)
    assert stats["hsv_mean_0"] == stats["hsv_median_0"]
    assert not any(np.isnan(v) for v in stats.values())


def test_color_stats_empty_region_returns_nan():
    stats = color_stats(np.zeros((0, 0, 3), dtype=np.uint8))
    assert all(np.isnan(v) for v in stats.values())


def test_classify_color_blue():
    stats = color_stats(_solid_bgr((255, 0, 0)))
    assert classify_color(stats) == "blue"


def test_classify_color_yellow():
    stats = color_stats(_solid_bgr((0, 255, 255)))  # yellow in BGR
    assert classify_color(stats) == "yellow"


def test_classify_color_green():
    stats = color_stats(_solid_bgr((0, 255, 0)))
    assert classify_color(stats) == "green"


def test_classify_color_gray_is_unknown():
    stats = color_stats(_solid_bgr((128, 128, 128)))
    assert classify_color(stats) == "unknown"
