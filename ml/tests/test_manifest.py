import pandas as pd

from src.manifest import MANIFEST_COLUMNS, build_manifest, validate_manifest


def _make_raw_tree(tmp_path):
    for color in ("blue", "yellow", "green"):
        d = tmp_path / color
        d.mkdir()
        (d / f"{color}_01.jpg").write_bytes(b"not a real jpg but has the right extension")
    (tmp_path / "blue" / "ignore_me.txt").write_text("not an image")
    return tmp_path


def test_build_manifest_scans_color_folders(tmp_path):
    raw_dir = _make_raw_tree(tmp_path)
    df = build_manifest(raw_dir)
    assert list(df.columns) == MANIFEST_COLUMNS
    assert len(df) == 3
    assert set(df["color_label"]) == {"blue", "yellow", "green"}
    assert df["physical_strip_id"].isna().all()


def test_build_manifest_handles_empty_raw_dir(tmp_path):
    df = build_manifest(tmp_path)
    assert df.empty
    assert list(df.columns) == MANIFEST_COLUMNS


def test_validate_manifest_flags_empty():
    warnings = validate_manifest(pd.DataFrame(columns=MANIFEST_COLUMNS))
    assert any("no rows" in w for w in warnings)


def test_validate_manifest_flags_unset_physical_strip_id(tmp_path):
    raw_dir = _make_raw_tree(tmp_path)
    df = build_manifest(raw_dir)
    warnings = validate_manifest(df)
    assert any("physical_strip_id" in w for w in warnings)


def test_validate_manifest_clean_when_populated(tmp_path):
    raw_dir = _make_raw_tree(tmp_path)
    df = build_manifest(raw_dir)
    df["physical_strip_id"] = ["s1", "s2", "s3"]
    warnings = validate_manifest(df)
    assert warnings == []
