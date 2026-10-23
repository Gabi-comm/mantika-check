import subprocess
import sys
from pathlib import Path

ML_DIR = Path(__file__).parent.parent


def _run(data_dir, *args):
    return subprocess.run(
        [sys.executable, "run_pipeline.py", "--data-dir", str(data_dir), *args],
        cwd=ML_DIR,
        capture_output=True,
        text=True,
    )


def test_manifest_command_runs_clean_on_empty_raw_dirs(tmp_path):
    result = _run(tmp_path, "manifest")
    assert result.returncode == 0
    assert "Wrote 0 row" in result.stdout
    assert (tmp_path / "annotations" / "manifest.csv").exists()


def test_process_command_runs_after_manifest(tmp_path):
    _run(tmp_path, "manifest")
    result = _run(tmp_path, "process")
    assert result.returncode == 0
    assert "Processed" in result.stdout
    assert (tmp_path / "processed" / "results.csv").exists()


def test_process_command_errors_without_manifest(tmp_path):
    result = _run(tmp_path, "process")
    assert result.returncode == 0  # the CLI prints an [error] line and returns, not a crash
    assert "[error]" in result.stdout
