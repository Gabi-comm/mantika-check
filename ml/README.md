# Mantika Check — image baseline (ml/)

Preliminary computer-vision pipeline that reads a photographed, *printed*
color-reference card (blue / yellow / green) and classifies which band it
matches. This is separate from `models/`, which fits TPC-vs-time curves
from the Mendeley frying-oil dataset — see `docs/ml-methodology.md` for
why the two must not be conflated.

## Add your photos here

```
ml/data/raw/blue/      # printed card photos matching the "blue" band
ml/data/raw/yellow/
ml/data/raw/green/
```

Supported formats: `.jpg`, `.jpeg`, `.png`. Any filename works; `image_id`
is derived from the filename stem.

## Run it

```powershell
cd ml
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt

# after adding photos to data/raw/<color>/:
.venv\Scripts\python run_pipeline.py manifest   # scan raw/ -> data/annotations/manifest.csv
.venv\Scripts\python run_pipeline.py process --debug   # -> data/processed/results.csv (+ overlays)

.venv\Scripts\python -m pytest tests/ -v
```

`manifest` prints a warning if `physical_strip_id` is unset for every row —
fill that column in by hand in `data/annotations/manifest.csv` before any
group-aware split is possible (see `src/evaluation/splits.py`).

Both commands run fine with empty `raw/` folders (0 rows, header-only CSV).

## What's implemented

- `src/preprocessing/roi.py` — load image, detect+deskew the printed strip
  (handles rotated photos via `cv2.minAreaRect`), crop the central pad.
- `src/features/color.py` — HSV + CIELAB mean/median stats.
- `src/classification/rules.py` — hue-range rule classifier (blue/green/yellow/unknown).
- `src/classification/baseline_ml.py` — optional LAB-feature logistic regression;
  refuses to train below 5 independent samples per class.
- `src/manifest.py`, `src/evaluation/splits.py` — manifest generation/validation
  and group-aware (by `physical_strip_id`) train/val/test splitting.

## Measured results (34 real photos, 2026-10-23 capture session)

Run via `python scripts/evaluate.py` after `process --debug`. 3 byte-identical
duplicate photos (same shot saved/copied twice) are excluded from the metrics
below -- kept on disk, not deleted -- so one sample isn't double-counted.

| | |
|---|---|
| Evaluation set | 31/34 images (blue_01: 12, yellow_01: 9, green_01: 10) |
| ROI (strip-card) detection succeeded | 10/31 (32%) -- most photos have the strip too small/distant for the contour step; `locate_color_pad`'s saturation-based crop recovers the pad regardless |
| In-sample accuracy | **29/31 = 93.5%** (preliminary, printed-color-only -- see caveat below) |

Confusion matrix (`data/processed/confusion_matrix.csv`):

| actual \ predicted | blue | green | yellow |
|---|---|---|---|
| blue | 11 | 0 | 0 |
| green | 0 | 9 | 2 |
| yellow | 0 | 0 | 9 |

Both errors are the same pattern: `green_strip01_005`/`006`, photographed
under warm indoor lighting, measured hue 16-17 (nominally yellow range)
instead of the true green ~75-77 seen in the other 8 green photos. This is
a white-balance/color-cast issue, not a pipeline bug -- the fix is a
calibration step (e.g. normalizing against a known-white region of the
card), not re-tuning `rules.py` thresholds to fit these 2 samples from a
single capture session, which would be overfitting noise.

**This accuracy number describes only the image pipeline's ability to read
back a printed color it was shown, from one capture session with one
physical card per color** -- it is not evidence about oil quality or TPC.
See `docs/ml-methodology.md`.

## Known limitations

- Rule-based hue thresholds are tuned on synthetic swatches, not the
  measured real photos above -- see the warm-light caveat.
- `detect_strip_roi`'s contour-based card detection only succeeds on
  ~1/3 of real photos; correctness currently depends on `locate_color_pad`'s
  saturation fallback, which is doing most of the work.
- One physical strip per color, one capture session: no cross-session,
  cross-phone, or cross-lighting generalization evidence yet, and not
  enough independent samples for group-aware splitting or ML training
  (`src/evaluation/splits.py` requires >=10 distinct `physical_strip_id`
  values; we have 3).
- See `docs/ml-methodology.md` for the full image-vs-chemistry distinction.
