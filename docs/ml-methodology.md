# ML methodology — image baseline vs. TPC regression

Mantika Check has two separate, non-interchangeable ML components. Keep
them separate; do not let results from one imply validity for the other.

## 1. Image baseline (`ml/`) — what this repo adds now

Classifies a *photograph of a printed color card* into blue/yellow/green
bands using classical CV (HSV/LAB color stats, rule thresholds, optional
logistic-regression baseline on CIELAB features).

**This measures printed-ink color under phone-camera conditions. It does
not measure oil chemistry.** Printed color, unlike a real chemical test
strip, does not react to total polar compounds (TPC), free fatty acids,
or any oil property — it's a fixed reference swatch. The baseline exists
to validate the image pipeline (detection, deskew, color extraction)
before a validated chemical strip is ever introduced.

### Current limitations

- No validated ground truth: labels are "which printed folder this photo
  was manually sorted into," not a chemically verified TPC/oil-quality value.
- Small, uncontrolled sample: one physical strip per color, one capture
  session (2026-10-23), lighting/phone/distance not systematically varied
  or recorded. `physical_strip_id` is filled in (`blue_01`/`yellow_01`/
  `green_01`, one per color), but 3 distinct strips is far below the
  >=10 `src/evaluation/splits.py` requires for a meaningful group-aware
  split — no ML baseline should be trained or reported on this data yet.
- Measured in-sample accuracy is 93.5% (29/31, 3 known duplicate photos
  excluded) — see `ml/README.md` for the confusion matrix. The 2 errors
  are both the same warm-lighting color-cast pattern on green photos, not
  random noise, and not something to fix by re-tuning thresholds on 2
  samples from one session.
- `detect_strip_roi`'s contour-based card detection (find the printed card,
  deskew it) only succeeds on ~1/3 of real photos — most phone photos have
  the card too small/distant relative to the frame. Correctness currently
  depends on `locate_color_pad`, which finds the color pad directly via
  saturation and is robust to the card-detection step failing; this masks
  rather than fixes the card-detection weakness.

### Future: chemical-strip validation

A future phase replaces the printed card with a real chemical test strip
(oxidation/TPC-sensitive dye) and validates its color-to-TPC mapping
against titration or the Mendeley-trained regression in `models/`. Only
at that point does "strip color -> oil quality" become a defensible claim.

## 2. TPC regression (`models/`)

Fits TPC-vs-frying-time curves (Arrhenius kinetic model, selected) from
the Mendeley *Frying oil data* (Li, 2020), temperature range 160-220°C,
0-30h, potato-chip frying only. See `models/README.md`. Valid only within
that regime; 25% TPC is a research threshold, not a Philippine legal limit.

## Why these can't be combined yet

The image baseline has no chemical ground truth; the TPC regression has
no visual/strip-color data. Bridging them requires the chemical-strip
validation step above — printed-card color recognition is a necessary
but not sufficient precursor.
