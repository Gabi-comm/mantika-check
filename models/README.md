# Mantika Check — TPC forecasting models (v3)

Trained on Li, Y. (2020). *Frying oil data* [Data set]. Mendeley Data. https://doi.org/10.17632/4k7b395yxx.1
Kaggle run: https://www.kaggle.com/code/gabrieljohnsolomon/mantika-check-tpc-forecasting (version 3, private)

## Files
| Path | What it is |
|---|---|
| `model_export.json` | **The trained models.** Coefficients for A, B, B2, C and D, metrics, threshold crossings, data audit. The Next.js app loads this; no Python needed at runtime. |
| `metrics/` | Held-out-time, rolling-origin, leave-one-temperature-out, anchored-forecast and threshold-error results; `threshold_sensitivity.csv` (20/24/25/27% crossings) and `blue_band_exit.csv` (when oil leaves the strip's blue band) |
| `figures/` | EDA curves, actual-vs-predicted, final fitted curves |
| `data/` | Original Mendeley CSVs (SHA-256 verified) + cleaned long-format table |
| `notebook/` | `mantika_tpc_forecasting.ipynb` (the Kaggle notebook), `build_notebook.py` (source that generates it), `experiments.py` (diagnostics) |

## Models
| Key | Model | Use |
|---|---|---|
| `A_curve_fit` | Quadratic per temperature | Proposal baseline (curve fit) |
| `B_ridge_poly` | Polynomial Ridge | Proposal baseline (regularized regression) |
| `B2_ridge_phys` | Arrhenius-feature Ridge | Improved regularized regression |
| `C_kinetic` | Arrhenius kinetic model, 4 parameters | **Selected** (best on unseen temperatures) |
| `D_ensemble` | Mean of B2 and C | Comparison |

Valid only for 160–220 °C and 0–30 h of controlled potato-chip frying. Research-only: not a vendor oil-life countdown.
25% TPC is a research benchmark (e.g. Thailand MOPH No. 283, 2004; India FSSAI), not a Philippine legal limit.
European limits range from about 24% to 27%, so crossings are also reported at 24% and 27%.
Strip bands (Yongyod & Kerdsin, 2025): blue ≤ 20% safe to use, green 21–24% approaching degradation, yellow ≥ 25% do not use.
These are included in `model_export.json` under `strip_bands`.

## Reproduce
Upload `notebook/mantika_tpc_forecasting.ipynb` to Kaggle with Internet on and Save & Run All, or run it locally
with numpy, pandas, scipy, scikit-learn and matplotlib (it reads `data/` if present, otherwise downloads from Mendeley).
