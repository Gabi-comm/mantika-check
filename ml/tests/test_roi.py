import numpy as np

from src.preprocessing.roi import detect_strip_roi, extract_central_region, load_image, locate_color_pad


def _synthetic_strip(angle: float = 0.0) -> np.ndarray:
    """Gray background with a filled blue rectangle, optionally rotated."""
    canvas = np.full((200, 200, 3), 230, dtype=np.uint8)
    rect = np.zeros((80, 40, 3), dtype=np.uint8)
    rect[:] = (255, 0, 0)  # blue in BGR
    y0, x0 = 60, 80
    canvas[y0 : y0 + 80, x0 : x0 + 40] = rect
    if angle:
        import cv2

        matrix = cv2.getRotationMatrix2D((100, 100), angle, 1.0)
        canvas = cv2.warpAffine(canvas, matrix, (200, 200), borderValue=(230, 230, 230))
    return canvas


def test_load_image_missing_file_returns_none():
    assert load_image("ml/data/raw/blue/does_not_exist.jpg") is None


def test_load_image_rejects_unsupported_extension(tmp_path):
    bad_file = tmp_path / "strip.txt"
    bad_file.write_text("not an image")
    assert load_image(bad_file) is None


def test_detect_strip_roi_finds_region():
    img = _synthetic_strip()
    roi = detect_strip_roi(img)
    assert roi.size > 0
    assert roi.shape[0] <= img.shape[0] and roi.shape[1] <= img.shape[1]


def test_detect_strip_roi_handles_rotation():
    img = _synthetic_strip(angle=15)
    roi = detect_strip_roi(img)
    assert roi.size > 0


def test_detect_strip_roi_falls_back_on_blank_image():
    blank = np.full((100, 100, 3), 128, dtype=np.uint8)
    roi = detect_strip_roi(blank)
    assert roi.shape == blank.shape


def test_extract_central_region_shrinks_but_stays_nonempty():
    img = np.full((100, 100, 3), 100, dtype=np.uint8)
    region = extract_central_region(img, frac=0.5)
    assert region.size > 0
    assert region.shape[0] <= 60 and region.shape[1] <= 60


def test_extract_central_region_handles_empty_input():
    empty = np.zeros((0, 0, 3), dtype=np.uint8)
    region = extract_central_region(empty)
    assert region.size == 0


def test_locate_color_pad_finds_offcenter_small_patch():
    """A pad far from the geometric center, small relative to the frame --
    the exact failure mode a blind center-crop misses."""
    import cv2

    canvas = np.full((400, 400, 3), (210, 210, 210), dtype=np.uint8)  # low-saturation gray
    pad = np.full((30, 20, 3), (255, 0, 0), dtype=np.uint8)  # saturated blue, off-center
    canvas[20:50, 20:40] = pad

    region = locate_color_pad(canvas)
    hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
    assert np.median(hsv[:, :, 1]) > 100  # crop should be mostly saturated pad, not background


def test_locate_color_pad_falls_back_on_no_saturation():
    gray = np.full((100, 100, 3), 180, dtype=np.uint8)
    region = locate_color_pad(gray, frac=0.5)
    assert region.shape[0] <= 60 and region.shape[1] <= 60  # same shape as extract_central_region


def test_locate_color_pad_handles_empty_input():
    empty = np.zeros((0, 0, 3), dtype=np.uint8)
    assert locate_color_pad(empty).size == 0
