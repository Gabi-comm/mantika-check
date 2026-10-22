"""Builds mantika_tpc_forecasting.ipynb from the cells below.

Run: python build_notebook.py  (needs nbformat)
"""
from pathlib import Path

import nbformat as nbf

cells = []


def md(src):
    cells.append(nbf.v4.new_markdown_cell(src.strip()))


def code(src):
    cells.append(nbf.v4.new_code_cell(src.strip()))


md("""
# Mantika Check — Experimental TPC Forecasting (Module 2) · v3

Research-only models of frying-oil degradation trained on the public **Li (2020) Frying oil data**
(Mendeley Data, DOI [10.17632/4k7b395yxx.1](https://doi.org/10.17632/4k7b395yxx.1)).

**What this notebook does**
1. Loads and audits the total polar compounds (TPC) dataset (+ acid / carbonyl value as secondary outcomes).
2. Trains five models on identical training data in every split:
   - **A. Temperature-specific curve fit** (quadratic in time per temperature; coefficients interpolated across temperature).
   - **B. Regularized polynomial regression** (v1 reference: polynomial features of time × temperature → Ridge).
   - **B2. Physics-feature Ridge** (Arrhenius-weighted time features → Ridge; activation term tuned by nested leave-one-temperature-out).
   - **C. Kinetic (Arrhenius) model** — 4 physical parameters.
   - **D. Ensemble** — mean of B2 and C.
3. Validates with **held-out time**, **rolling-origin forecasting** (origins 12–24 h, 6 h horizon) and **leave-one-temperature-out** (MAE / RMSE).
4. Tests an **anchored forecast**: given one measured TPC value, forecast the next 6 h.
5. Estimates **25% TPC threshold crossings** and reports the crossing-time error in hours, with a
   **24 / 27% sensitivity check** and the **20% blue-band exit** time used by the strip reader.
6. Exports `model_export.json` for the Next.js app (pure-TypeScript inference, no Python server).

> ⚠️ These models describe potato-chip frying under controlled lab conditions (160–220 °C, 0–30 h).
> They are **not** validated predictors of an individual vendor's remaining oil life, and 25% TPC is a
> foreign-practice research benchmark, not a Philippine legal limit.

**Where the thresholds come from**
- **25% TPC** — Thailand: oil used for frying food for sale should not exceed 25% polar compounds (Ministry of Public Health
  Notification No. 283, B.E. 2547/2004, as cited in Yongyod & Kerdsin, 2025). India's FSSAI also bars used oil above 25%.
  European limits range from about 24% to 27% depending on the country, hence the 24 / 27% sensitivity check.
- **Philippines** — we found no Philippine regulation setting a TPC limit, so 25% is used only as a research benchmark.
- **Strip bands** (Yongyod & Kerdsin, 2025, test-kit colour interpretation): **blue ≤ 20%** safe to use,
  **green 21–24%** approaching degradation, **yellow ≥ 25%** do not use.

Yongyod, R., & Kerdsin, A. (2025). Modified test kit for detecting polar compounds and evaluating their distribution in
reused frying oil. *Foods, 14*(9), 1572. https://doi.org/10.3390/foods14091572
""")

code("""
import hashlib, json, os, urllib.request
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.interpolate import interp1d
from scipy.optimize import curve_fit
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import GridSearchCV, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
import sklearn

SEED = 42
np.random.seed(SEED)
THRESHOLD = 25.0          # % TPC research benchmark (Thailand MOPH No. 283, 2004; India FSSAI)
SENSITIVITY_THRESHOLDS = [24.0, 25.0, 27.0]   # range of European limits
BLUE_BAND_MAX = 20.0      # strip test-kit blue band upper bound (Yongyod & Kerdsin, 2025)
STRIP_BANDS = [           # continuous TPC between 20 and 21 is treated as green
    {'band': 'blue', 'tpc_min': None, 'tpc_max': 20.0, 'label': 'Safe to use'},
    {'band': 'green', 'tpc_min': 20.0, 'tpc_max': 25.0, 'label': 'Approaching degradation'},
    {'band': 'yellow', 'tpc_min': 25.0, 'tpc_max': None, 'label': 'Do not use'},
]
HOLDOUT_FROM_HOUR = 24    # held-out-time split: train 0-23 h, test 24-30 h
ROLLING_ORIGINS = [12, 15, 18, 21, 24]
HORIZON = 6               # hours forecast ahead in rolling-origin and anchored evaluation
ANCHOR_HOURS = [6, 12, 18, 24]

OUT = Path('/kaggle/working') if Path('/kaggle/working').exists() else Path('outputs')
(OUT / 'figures').mkdir(parents=True, exist_ok=True)
plt.rcParams.update({'figure.dpi': 110, 'axes.grid': True, 'grid.alpha': .3})
print('sklearn', sklearn.__version__, '| outputs ->', OUT.resolve())
""")

md("## 1. Data acquisition\nLooks for the CSVs in a Kaggle input dataset first, then `./data`, otherwise downloads them from Mendeley and verifies SHA-256 hashes.")

code("""
MENDELEY = 'https://data.mendeley.com/public-files/datasets/4k7b395yxx/files/{}/file_downloaded'
FILES = {
    'total_polar_compoents.csv': ('0b8cb4ca-09b1-4ad5-85bd-e9fc84497b47',
                                  'ae74cc32b752d5da181b44d43923fa4138c5d3b9e4874c9ba9c702dab7904fc0'),
    'acid_value.csv':            ('e76d3e54-29d2-4b39-851a-68c44ad20cee',
                                  '18aa576cfa58e798650135b97f53c030d94a1a1917cdad316807b5e96aa67b1f'),
    'carbonyl_value.csv':        ('7c9ce011-1c4f-4c16-9749-c75b0d53d8b8',
                                  'e3dfd89b521961ae5d2604e12c3b3852993d3f2039d80c7cc094acb77a02dfc1'),
}

def sha256(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def locate(name):
    for root in [Path('/kaggle/input'), Path('data'), Path('../data')]:
        if root.exists():
            hits = list(root.rglob(name))
            if hits:
                return hits[0]
    dest = OUT / 'data' / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    print('downloading', name)
    # Mendeley returns 403 for Python's default user-agent
    req = urllib.request.Request(MENDELEY.format(FILES[name][0]), headers={'User-Agent': 'Mozilla/5.0 (mantika-check notebook)'})
    dest.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return dest

paths = {}
for name, (_, expected) in FILES.items():
    p = locate(name)
    got = sha256(p)
    assert got == expected, f'{name}: hash mismatch {got}'
    paths[name] = p
    print(f'{name:28s} OK  {p}')
""")

code("""
def to_long(path, value_name):
    wide = pd.read_csv(path)
    wide['hour'] = np.arange(len(wide))          # rows are hourly samples 0..30 h (per dataset description)
    long = wide.melt(id_vars='hour', var_name='col', value_name=value_name)
    long['temp_c'] = long['col'].str.replace('Tem_', '').astype(int)
    return long.drop(columns='col')

tpc = to_long(paths['total_polar_compoents.csv'], 'tpc')
acid = to_long(paths['acid_value.csv'], 'acid_value')
carb = to_long(paths['carbonyl_value.csv'], 'carbonyl_value')
df = tpc.merge(acid, on=['hour', 'temp_c']).merge(carb, on=['hour', 'temp_c'])
df = df[['temp_c', 'hour', 'tpc', 'acid_value', 'carbonyl_value']].sort_values(['temp_c', 'hour']).reset_index(drop=True)
df.to_csv(OUT / 'frying_oil_long.csv', index=False)
TEMPS = [int(t) for t in sorted(df.temp_c.unique())]
df.head()
""")

md("## 2. Data audit")

code("""
audit = {
    'rows': len(df),
    'temperatures_c': TEMPS,
    'hours': [int(df.hour.min()), int(df.hour.max())],
    'samples_per_temperature': df.groupby('temp_c').size().to_dict(),
    'missing_values': int(df.isna().sum().sum()),
    'duplicate_rows': int(df.duplicated().sum()),
    'duplicate_(temp,hour)_keys': int(df.duplicated(['temp_c', 'hour']).sum()),
    'tpc_range_pct': [float(df.tpc.min()), float(df.tpc.max())],
}
# Non-monotonic steps: TPC should rise with frying time; drops indicate measurement noise.
d = df.sort_values(['temp_c', 'hour']).groupby('temp_c').tpc.diff()
audit['tpc_decreasing_steps'] = int((d < 0).sum())
audit['largest_tpc_drop'] = round(float(d.min()), 2)
for k, v in audit.items():
    print(f'{k:30s} {v}')
display(df.groupby('temp_c')[['tpc', 'acid_value', 'carbonyl_value']].agg(['min', 'max']).round(2))
""")

md("""
**Notes / limitations**
- 31 hourly samples × 5 temperatures = 155 observations; one frying series per temperature, so points within a series are **not independent** (no replicate runs).
- Small negative TPC steps are measurement noise (largest drop shown above) — kept, not smoothed.
- Hour-0 TPC is about 11–12%, higher than the roughly 0–8% usually reported for unused refined oils (India's FSSAI caps fresh
  oil at 15%). The dataset does not say whether hour 0 was sampled before or after initial heating; models learn the starting
  level from the data rather than assuming a fresh-oil value.
- Single oil (type not stated in the dataset), single food (potato chips), constant temperature, no fresh-oil top-ups → strong domain shift vs. street-food vendors.
""")

code("""
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
for ax, col, label in zip(axes, ['tpc', 'acid_value', 'carbonyl_value'],
                          ['Total polar compounds (%)', 'Acid value (mg KOH/g)', 'Carbonyl value']):
    for t in TEMPS:
        s = df[df.temp_c == t]
        ax.plot(s.hour, s[col], 'o-', ms=3, label=f'{t} °C')
    ax.set_xlabel('Frying time (h)'); ax.set_title(label)
axes[0].axhline(THRESHOLD, ls='--', c='crimson', lw=1, label='25% TPC benchmark')
axes[0].legend(fontsize=8)
plt.tight_layout(); plt.savefig(OUT / 'figures/eda_degradation_curves.png'); plt.show()

print('Correlation with TPC (all temperatures pooled):')
print(df[['tpc', 'acid_value', 'carbonyl_value']].corr(method='spearman').round(3)['tpc'])
""")

md("""
## 3. Models

All models predict TPC (%) from frying time *t* (h) and temperature *T* (°C), and every model receives the
**identical training rows** in every split. `n_params` is listed so complexity is compared fairly; model A has
three parameters *per observed temperature* and needs coefficient interpolation for any temperature it has not seen.
""")

code("""
R = 8.314  # J/(mol K)
T_REF = 190 + 273.15

def arrhenius_weight(temp_c, ea_over_r):
    return np.exp(-ea_over_r * (1 / (np.asarray(temp_c, float) + 273.15) - 1 / T_REF))


# ---------- A. Temperature-specific quadratic curve fit ----------
class CurveFitBaseline:
    name = 'A_curve_fit'
    unseen_temp = 'interpolated coefficients'

    def fit(self, d):
        self.coef = {t: np.polyfit(g.hour, g.tpc, 2) for t, g in d.groupby('temp_c')}
        temps = np.array(sorted(self.coef))
        C = np.array([self.coef[t] for t in temps])
        # coefficients vary smoothly with temperature; linear interp (and linear extrapolation outside range)
        self.interp = interp1d(temps, C, axis=0, kind='linear', fill_value='extrapolate') if len(temps) > 1 else None
        self.n_params = 3 * len(temps)
        return self

    def predict(self, d):
        out = np.empty(len(d))
        for i, (t, h) in enumerate(zip(d.temp_c, d.hour)):
            c = self.coef[t] if t in self.coef else self.interp(t)
            out[i] = np.polyval(c, h)
        return out


# ---------- B. Regularized polynomial regression (v1 reference) ----------
class RidgeModel:
    name = 'B_ridge_poly'
    unseen_temp = 'polynomial in T'

    def fit(self, d):
        X, y, g = d[['hour', 'temp_c']].values.astype(float), d.tpc.values, d.temp_c.values
        pipe = Pipeline([('poly', PolynomialFeatures(include_bias=False)),
                         ('scale', StandardScaler()),
                         ('ridge', Ridge())])
        grid = {'poly__degree': [1, 2, 3], 'ridge__alpha': np.logspace(-4, 2, 13)}
        # tune with GroupKFold over temperature so the CV score reflects generalization to unseen temperatures
        self.search = GridSearchCV(pipe, grid, cv=GroupKFold(n_splits=len(np.unique(g))),
                                   scoring='neg_root_mean_squared_error').fit(X, y, groups=g)
        self.pipe = self.search.best_estimator_
        self.n_params = self.pipe.named_steps['ridge'].coef_.size + 1
        return self

    def predict(self, d):
        return self.pipe.predict(d[['hour', 'temp_c']].values.astype(float))


# ---------- B2. Physics-feature Ridge ----------
# features: h*w, h^2*w, h, w   with w = exp(-Ea/R (1/T - 1/T_ref)); Ea/R and alpha tuned by nested LOTO
def phys_features(d, ea_over_r):
    w = arrhenius_weight(d.temp_c.values, ea_over_r)
    h = d.hour.values.astype(float)
    return np.c_[h * w, h ** 2 * w, h, w]

class RidgePhysModel:
    name = 'B2_ridge_phys'
    unseen_temp = 'Arrhenius features'
    EA_OVER_R_GRID = np.linspace(1000, 12000, 23)
    ALPHA_GRID = [1e-3, 1e-2, 1e-1, 1.0]

    @staticmethod
    def _pipe(alpha):
        return Pipeline([('scale', StandardScaler()), ('ridge', Ridge(alpha=alpha))])

    def fit(self, d):
        temps = d.temp_c.unique()
        best = None
        for b in self.EA_OVER_R_GRID:
            for a in self.ALPHA_GRID:
                errs = []
                for t in temps:   # inner leave-one-temperature-out on the training rows only
                    tr, te = d[d.temp_c != t], d[d.temp_c == t]
                    m = self._pipe(a).fit(phys_features(tr, b), tr.tpc)
                    errs.append(np.sqrt(np.mean((te.tpc - m.predict(phys_features(te, b))) ** 2)))
                if best is None or np.mean(errs) < best[0]:
                    best = (np.mean(errs), b, a)
        _, self.ea_over_r, self.alpha = best
        self.pipe = self._pipe(self.alpha).fit(phys_features(d, self.ea_over_r), d.tpc)
        self.n_params = 4 + 1 + 1   # 4 coefs + intercept + Ea/R
        return self

    def predict(self, d):
        return self.pipe.predict(phys_features(d, self.ea_over_r))


# ---------- C. Kinetic / Arrhenius model ----------
def kinetic(X, c0, lnA, Ea, n):
    h, tc = X
    k = np.exp(lnA - Ea / R * (1 / (tc + 273.15) - 1 / T_REF))
    return c0 + k * np.power(h, n)

class KineticModel:
    name = 'C_kinetic'
    unseen_temp = 'Arrhenius rate'

    def fit(self, d):
        X = (d.hour.values.astype(float), d.temp_c.values.astype(float))
        self.params, self.cov = curve_fit(kinetic, X, d.tpc.values, p0=[11, -0.5, 6e4, 1.0],
                                          bounds=([0, -10, 0, 0.3], [30, 5, 3e5, 3]), maxfev=20000)
        self.n_params = 4
        return self

    def predict(self, d):
        return kinetic((d.hour.values.astype(float), d.temp_c.values.astype(float)), *self.params)


# ---------- D. Ensemble: mean of B2 and C ----------
class EnsembleModel:
    name = 'D_ensemble'
    unseen_temp = 'Arrhenius (B2 + C)'
    MEMBERS = [RidgePhysModel, KineticModel]

    def fit(self, d):
        self.members = [M().fit(d) for M in self.MEMBERS]
        self.n_params = sum(m.n_params for m in self.members)
        return self

    def predict(self, d):
        return np.mean([m.predict(d) for m in self.members], axis=0)


MODELS = [CurveFitBaseline, RidgeModel, RidgePhysModel, KineticModel, EnsembleModel]
NAMES = [M.name for M in MODELS]

def metrics(y, p):
    return {'MAE': mean_absolute_error(y, p), 'RMSE': float(np.sqrt(mean_squared_error(y, p)))}
""")

md("## 4. Validation 1 — held-out time (train 0–23 h, forecast 24–30 h)")

code("""
train = df[df.hour < HOLDOUT_FROM_HOUR]
test = df[df.hour >= HOLDOUT_FROM_HOUR].copy()

rows, holdout_preds = [], {}
for M in MODELS:
    m = M().fit(train)
    p = m.predict(test)
    holdout_preds[M.name] = p
    rows.append({'model': M.name, 'split': 'held_out_time', **metrics(test.tpc, p)})
    for t in TEMPS:
        mask = (test.temp_c == t).values
        rows.append({'model': M.name, 'split': f'held_out_time@{t}C', **metrics(test.tpc[mask], p[mask])})
holdout = pd.DataFrame(rows)
display(holdout[holdout.split == 'held_out_time'].round(3))
display(holdout.pivot(index='split', columns='model', values='MAE').round(2))
""")

md("""
## 5. Validation 2 — rolling-origin forecasting
For each origin *o* ∈ {12, 15, 18, 21, 24} h, every model trains on hours < *o* (all temperatures) and forecasts
hours *o* … *o*+5. Averaging over five origins is less sensitive to one lucky or unlucky cut-off than the single split above.
""")

code("""
rows = []
for o in ROLLING_ORIGINS:
    tr, te = df[df.hour < o], df[(df.hour >= o) & (df.hour < o + HORIZON)]
    for M in MODELS:
        rows.append({'model': M.name, 'origin_h': o, **metrics(te.tpc, M().fit(tr).predict(te))})
rolling = pd.DataFrame(rows)
display(rolling.pivot(index='model', columns='origin_h', values='RMSE').assign(mean=lambda x: x.mean(axis=1)).round(2))
""")

md("## 6. Validation 3 — leave-one-temperature-out\n160 °C and 220 °C held out = **extrapolation** beyond the training temperature range; 175–205 °C = interpolation.")

code("""
rows, loto_preds, loto_fits = [], {n: np.empty(len(df)) for n in NAMES}, {}
for t in TEMPS:
    tr, te = df[df.temp_c != t], df[df.temp_c == t]
    for M in MODELS:
        m = M().fit(tr)
        loto_fits[(M.name, t)] = m          # reused by the anchored forecast and threshold sections
        p = m.predict(te)
        loto_preds[M.name][te.index] = p
        rows.append({'model': M.name, 'held_out_temp': t,
                     'regime': 'extrapolation' if t in (min(TEMPS), max(TEMPS)) else 'interpolation',
                     **metrics(te.tpc, p)})
loto = pd.DataFrame(rows)
display(loto.pivot(index='held_out_temp', columns='model', values='RMSE').round(2))
display(loto.groupby(['model', 'regime'])[['MAE', 'RMSE']].mean().round(3))
""")

code("""
fig, axes = plt.subplots(2, len(MODELS), figsize=(4.2 * len(MODELS), 8.5), sharex='row', sharey='row')
lo, hi = df.tpc.min() - 1, df.tpc.max() + 1
for j, name in enumerate(NAMES):
    ax = axes[0, j]
    ax.scatter(test.tpc, holdout_preds[name], c=test.temp_c, cmap='plasma', s=18)
    ax.plot([lo, hi], [lo, hi], 'k--', lw=1); ax.set_title(f'{name}\\nheld-out time (24–30 h)', fontsize=10)
    ax.set_xlabel('Actual TPC (%)'); ax.set_ylabel('Predicted TPC (%)')
    ax = axes[1, j]
    sc = ax.scatter(df.tpc, loto_preds[name], c=df.temp_c, cmap='plasma', s=12)
    ax.plot([lo, hi], [lo, hi], 'k--', lw=1); ax.set_title(f'{name}\\nleave-one-temperature-out', fontsize=10)
    ax.set_xlabel('Actual TPC (%)'); ax.set_ylabel('Predicted TPC (%)')
fig.colorbar(sc, ax=axes, label='Temperature (°C)', shrink=.6)
plt.savefig(OUT / 'figures/actual_vs_predicted.png', bbox_inches='tight'); plt.show()
""")

md("""
## 7. Anchored forecast — one measured TPC reading
Scenario: the oil's TPC is measured once at hour *o* (e.g. a reference TPC meter or lab test). The model's curve is
shifted to pass through that reading, then forecasts hours *o*+1 … *o*+6. Evaluated with leave-one-temperature-out
fits (the model never saw that temperature), anchors at 6, 12, 18 and 24 h.

> This needs a **numeric** TPC reading; the three-band test strip does not provide one, so for vendors this remains
> future work that depends on local reference-TPC validation.
""")

code("""
rows = []
for t in TEMPS:
    s = df[df.temp_c == t].set_index('hour').tpc
    for o in ANCHOR_HOURS:
        hh = np.arange(o + 1, min(o + HORIZON, 30) + 1)
        future = pd.DataFrame({'temp_c': t, 'hour': hh})
        for name in NAMES:
            m = loto_fits[(name, t)]
            base = m.predict(future)
            shift = s[o] - m.predict(pd.DataFrame({'temp_c': [t], 'hour': [o]}))[0]
            rows.append({'model': name, 'temp_c': t, 'anchor_h': o,
                         'RMSE_unanchored': metrics(s[hh], base)['RMSE'],
                         'RMSE_anchored': metrics(s[hh], base + shift)['RMSE']})
anchored = pd.DataFrame(rows)
anchored_summary = anchored.groupby('model')[['RMSE_unanchored', 'RMSE_anchored']].mean()
anchored_summary['improvement_x'] = anchored_summary.RMSE_unanchored / anchored_summary.RMSE_anchored
display(anchored_summary.round(2))
""")

md("## 8. Final fit on all data + prediction intervals\nInterval half-width = 90th percentile of absolute **leave-one-temperature-out** residuals (an empirical, conformal-style band).")

code("""
final = {M.name: M().fit(df) for M in MODELS}
loto_rmse = loto.groupby('model').RMSE.mean()
best_name = loto_rmse.idxmin()
print('LOTO mean RMSE by model:'); print(loto_rmse.round(3)); print('selected for app:', best_name)

interval = {name: float(np.quantile(np.abs(df.tpc - loto_preds[name]), 0.90)) for name in NAMES}
print('90% interval half-widths (TPC points):', {k: round(v, 2) for k, v in interval.items()})

rid = final['B_ridge_poly']
print('Ridge (poly) best params:', rid.search.best_params_, '| GroupKFold RMSE:', round(-rid.search.best_score_, 3))
rp = final['B2_ridge_phys']
print(f'Ridge (phys): Ea/R={rp.ea_over_r:.0f} K -> Ea={rp.ea_over_r * R / 1000:.1f} kJ/mol, alpha={rp.alpha}')
c0, lnA, Ea, n = final['C_kinetic'].params
print(f'Kinetic: TPC0={c0:.2f}%  k(190°C)={np.exp(lnA):.3f}  Ea={Ea/1000:.1f} kJ/mol  n={n:.2f}')

display(pd.DataFrame({
    'n_params (all data)': {k: m.n_params for k, m in final.items()},
    'unseen temperature via': {M.name: M.unseen_temp for M in MODELS},
    'held-out time RMSE': holdout[holdout.split == 'held_out_time'].set_index('model').RMSE,
    'rolling-origin RMSE': rolling.groupby('model').RMSE.mean(),
    'LOTO RMSE': loto_rmse,
    'anchored RMSE': anchored_summary.RMSE_anchored,
}).loc[NAMES].round(2))
""")

code("""
grid = pd.DataFrame([(t, h) for t in TEMPS for h in np.linspace(0, 30, 121)], columns=['temp_c', 'hour'])
fig, axes = plt.subplots(1, len(MODELS), figsize=(4.2 * len(MODELS), 4.5), sharey=True)
colors = dict(zip(TEMPS, plt.cm.plasma(np.linspace(0, .85, len(TEMPS)))))
for ax, (name, m) in zip(axes, final.items()):
    g = grid.assign(pred=m.predict(grid))
    for t in TEMPS:
        s, o = g[g.temp_c == t], df[df.temp_c == t]
        ax.plot(s.hour, s.pred, c=colors[t], lw=2, label=f'{t} °C')
        ax.fill_between(s.hour, s.pred - interval[name], s.pred + interval[name], color=colors[t], alpha=.08)
        ax.scatter(o.hour, o.tpc, color=colors[t], s=10)
    ax.axhline(THRESHOLD, ls='--', c='crimson', lw=1)
    ax.set_title(name); ax.set_xlabel('Frying time (h)')
axes[0].set_ylabel('TPC (%)'); axes[0].legend(fontsize=8)
plt.tight_layout(); plt.savefig(OUT / 'figures/final_fits.png'); plt.show()
""")

md("""
## 9. 25% TPC threshold crossings
Observed crossing = linear interpolation between the two bracketing hourly samples (first upward crossing).
Series that never reach 25% within 30 h are **right-censored** (`> 30 h`, not estimated). Predicted crossings come
from the leave-one-temperature-out fits. The headline metric is the **absolute crossing-time error in hours** on
observed crossings; a **false crossing** is a model predicting < 30 h for a censored series.
""")

code("""
def crossing_hour(hours, values, thr=THRESHOLD):
    hours, values = np.asarray(hours, float), np.asarray(values, float)
    idx = np.where(values >= thr)[0]
    if len(idx) == 0:
        return None
    i = idx[0]
    if i == 0:
        return float(hours[0])
    h0, h1, v0, v1 = hours[i - 1], hours[i], values[i - 1], values[i]
    return float(h0 + (thr - v0) * (h1 - h0) / (v1 - v0))

fine = np.linspace(0, 30, 3001)
rows = []
for t in TEMPS:
    o = df[df.temp_c == t]
    row = {'temp_c': t, 'observed_h': crossing_hour(o.hour, o.tpc)}
    for name in NAMES:
        row[f'{name}_loto_h'] = crossing_hour(fine, loto_fits[(name, t)].predict(pd.DataFrame({'temp_c': t, 'hour': fine})))
    rows.append(row)
thr_df = pd.DataFrame(rows)
thr_df['status'] = np.where(thr_df.observed_h.isna(), 'censored (>30 h)', 'observed')
display(thr_df.round(2))

obs = thr_df[thr_df.status == 'observed']
cen = thr_df[thr_df.status != 'observed']
thr_err = pd.DataFrame({
    'mean_abs_error_h': {n: float(np.nanmean(np.abs(obs[f'{n}_loto_h'] - obs.observed_h))) for n in NAMES},
    'max_abs_error_h': {n: float(np.nanmax(np.abs(obs[f'{n}_loto_h'] - obs.observed_h))) for n in NAMES},
    'false_crossings': {n: int(cen[f'{n}_loto_h'].notna().sum()) for n in NAMES},
})
display(thr_err.round(2))
""")

md("""
### 9b. Threshold sensitivity (24 / 25 / 27%) and strip blue-band exit (20%)
Discard limits differ by country (about 24–27%), so crossings are recomputed at each limit. The **20%** crossing is when oil
leaves the strip's blue ("safe to use") band. Predicted crossings again come from leave-one-temperature-out fits.
""")

code("""
def crossing_table(thr):
    rows = []
    for t in TEMPS:
        o = df[df.temp_c == t]
        row = {'threshold_pct': thr, 'temp_c': t, 'observed_h': crossing_hour(o.hour, o.tpc, thr)}
        for name in NAMES:
            row[f'{name}_loto_h'] = crossing_hour(
                fine, loto_fits[(name, t)].predict(pd.DataFrame({'temp_c': t, 'hour': fine})), thr)
        rows.append(row)
    return pd.DataFrame(rows)

def crossing_errors(tab):
    obs, cen = tab[tab.observed_h.notna()], tab[tab.observed_h.isna()]
    return {n: {'mean_abs_error_h': float(np.nanmean(np.abs(obs[f'{n}_loto_h'] - obs.observed_h))) if len(obs) else None,
                'n_observed': int(len(obs)),
                'false_crossings': int(cen[f'{n}_loto_h'].notna().sum())} for n in NAMES}

sens_tab = pd.concat([crossing_table(thr) for thr in SENSITIVITY_THRESHOLDS + [BLUE_BAND_MAX]], ignore_index=True)
print('Observed crossing hour (NaN = not reached within 30 h):')
display(sens_tab.pivot(index='temp_c', columns='threshold_pct', values='observed_h').round(2))

sens_err = {thr: crossing_errors(sens_tab[sens_tab.threshold_pct == thr]) for thr in SENSITIVITY_THRESHOLDS + [BLUE_BAND_MAX]}
print('Mean |crossing-time error| in hours (leave-one-temperature-out):')
display(pd.DataFrame({thr: {n: e['mean_abs_error_h'] for n, e in v.items()} for thr, v in sens_err.items()}).round(2))
print('False crossings (model predicts < 30 h for a series that never crossed):')
display(pd.DataFrame({thr: {n: e['false_crossings'] for n, e in v.items()} for thr, v in sens_err.items()}))

blue = sens_tab[sens_tab.threshold_pct == BLUE_BAND_MAX][['temp_c', 'observed_h', f'{best_name}_loto_h']].rename(
    columns={'observed_h': 'observed_blue_exit_h', f'{best_name}_loto_h': f'{best_name}_loto_blue_exit_h'})
blue['selected_model_all_data_h'] = [crossing_hour(fine, final[best_name].predict(pd.DataFrame({'temp_c': t, 'hour': fine})),
                                                   BLUE_BAND_MAX) for t in blue.temp_c]
print(f'Blue band (≤{BLUE_BAND_MAX:.0f}% TPC) exit time — observed vs {best_name}:')
display(blue.round(2))
""")

md("## 10. Export for the Next.js app")

code("""
poly = rid.pipe.named_steps['poly']; scaler = rid.pipe.named_steps['scale']; ridge = rid.pipe.named_steps['ridge']
rp_scaler = rp.pipe.named_steps['scale']; rp_ridge = rp.pipe.named_steps['ridge']
curve = final['A_curve_fit']

def nan_to_none(x):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), 3)

def kinetic_json(m):
    return {'type': 'arrhenius_power',
            'note': 'tpc = c0 + exp(lnA - Ea/R*(1/(T+273.15) - 1/T_ref)) * h^n',
            'params': dict(zip(['c0', 'lnA', 'Ea_J_per_mol', 'n'], map(float, m.params))),
            'R': R, 'T_ref_K': T_REF}

def ridge_phys_json(m):
    return {'type': 'physics_ridge',
            'note': 'w = exp(-EaR*(1/(T+273.15) - 1/T_ref)); x = [h*w, h^2*w, h, w]; tpc = ((x - mean)/scale) . coef + intercept',
            'ea_over_r_K': float(m.ea_over_r), 'alpha': float(m.alpha), 'T_ref_K': T_REF,
            'scaler_mean': m.pipe.named_steps['scale'].mean_.tolist(),
            'scaler_scale': m.pipe.named_steps['scale'].scale_.tolist(),
            'coef': m.pipe.named_steps['ridge'].coef_.tolist(),
            'intercept': float(m.pipe.named_steps['ridge'].intercept_)}

export = {
    'version': 3,
    'dataset': {'citation': 'Li, Y. (2020). Frying oil data [Data set]. Mendeley Data. https://doi.org/10.17632/4k7b395yxx.1',
                'rows': len(df), 'temperatures_c': TEMPS, 'hours': [0, 30]},
    'valid_domain': {'temp_c': [min(TEMPS), max(TEMPS)], 'hour': [0, 30]},
    'threshold_tpc_pct': THRESHOLD,
    'threshold_sources': [
        'Thailand Ministry of Public Health Notification No. 283 (2004): <= 25% polar compounds in oil used to fry food for sale',
        'India FSSAI: used cooking oil above 25% TPC must not be used',
        'European national limits range from about 24% to 27%',
        'No Philippine TPC limit was found; 25% is a research benchmark only',
    ],
    'sensitivity_thresholds_pct': SENSITIVITY_THRESHOLDS,
    'strip_bands': {
        'source': ('Yongyod, R., & Kerdsin, A. (2025). Modified test kit for detecting polar compounds and evaluating their '
                   'distribution in reused frying oil. Foods, 14(9), 1572. https://doi.org/10.3390/foods14091572'),
        'bands': STRIP_BANDS,
    },
    'selected_model': best_name,
    'disclaimer': ('Research-only. Trained on controlled potato-chip frying data; not a validated predictor of a '
                   "vendor's remaining oil life. 25% TPC is a research benchmark, not a Philippine legal limit."),
    'anchoring': {'note': ('Optional: given a measured numeric TPC y_o at hour h_o, forecast = f(h, T) + (y_o - f(h_o, T)). '
                           'Requires a numeric TPC reading (not a strip band).'),
                  'horizon_h_evaluated': HORIZON},
    'models': {
        'A_curve_fit': {
            'type': 'per_temperature_quadratic',
            'note': 'tpc = c[0]*h^2 + c[1]*h + c[2]; linearly interpolate coefficients between temperatures',
            'coefficients': {str(int(t)): [float(v) for v in c] for t, c in curve.coef.items()},
        },
        'B_ridge_poly': {
            'type': 'poly_ridge',
            'inputs': ['hour', 'temp_c'],
            'powers': poly.powers_.tolist(),      # each feature = hour^p0 * temp_c^p1
            'scaler_mean': scaler.mean_.tolist(),
            'scaler_scale': scaler.scale_.tolist(),
            'coef': ridge.coef_.tolist(),
            'intercept': float(ridge.intercept_),
            'best_params': {k: (float(v) if isinstance(v, (float, np.floating)) else int(v))
                            for k, v in rid.search.best_params_.items()},
        },
        'B2_ridge_phys': ridge_phys_json(rp),
        'C_kinetic': kinetic_json(final['C_kinetic']),
        'D_ensemble': {
            'type': 'mean',
            'members': ['B2_ridge_phys', 'C_kinetic'],
            'note': 'tpc = mean(B2_ridge_phys(h, T), C_kinetic(h, T)); members fitted jointly on all data, identical to the standalone entries',
        },
    },
    'interval_halfwidth_90': interval,
    'metrics': {
        'held_out_time': holdout[holdout.split == 'held_out_time'].set_index('model')[['MAE', 'RMSE']].round(4).to_dict('index'),
        'rolling_origin_mean': rolling.groupby('model')[['MAE', 'RMSE']].mean().round(4).to_dict('index'),
        'loto_mean': loto.groupby('model')[['MAE', 'RMSE']].mean().round(4).to_dict('index'),
        'loto_by_temp': loto.round(4).to_dict('records'),
        'anchored': anchored_summary.round(4).to_dict('index'),
        'threshold_error_h': thr_err.round(3).to_dict('index'),
        'threshold_sensitivity_error_h': {str(thr): {n: {k: (nan_to_none(v) if isinstance(v, float) else v) for k, v in e.items()}
                                                     for n, e in errs.items()} for thr, errs in sens_err.items()},
    },
    'threshold_crossings': [{k: (v if k in ('status', 'temp_c') else nan_to_none(v)) for k, v in r.items()}
                            for r in thr_df.to_dict('records')],
    'threshold_sensitivity_crossings': [{k: (int(v) if k == 'temp_c' else nan_to_none(v)) for k, v in r.items()}
                                        for r in sens_tab.to_dict('records')],
    'blue_band_exit': [{k: (int(v) if k == 'temp_c' else nan_to_none(v)) for k, v in r.items()}
                       for r in blue.to_dict('records')],
    'audit': {k: (v if not isinstance(v, dict) else {str(a): int(b) for a, b in v.items()}) for k, v in audit.items()},
}

# sanity checks: re-implement the forward passes from the exported numbers (what the TS code will do)
def ridge_from_json(h, t, e=export['models']['B_ridge_poly']):
    f = np.array([h ** p0 * t ** p1 for p0, p1 in e['powers']])
    z = (f - np.array(e['scaler_mean'])) / np.array(e['scaler_scale'])
    return float(z @ np.array(e['coef']) + e['intercept'])

def ridge_phys_from_json(h, t, e=export['models']['B2_ridge_phys']):
    w = np.exp(-e['ea_over_r_K'] * (1 / (t + 273.15) - 1 / e['T_ref_K']))
    x = np.array([h * w, h ** 2 * w, h, w])
    return float(((x - np.array(e['scaler_mean'])) / np.array(e['scaler_scale'])) @ np.array(e['coef']) + e['intercept'])

def kinetic_from_json(h, t, e=export['models']['C_kinetic']):
    p = e['params']
    return p['c0'] + np.exp(p['lnA'] - p['Ea_J_per_mol'] / e['R'] * (1 / (t + 273.15) - 1 / e['T_ref_K'])) * h ** p['n']

chk = df.sample(10, random_state=SEED)
assert np.allclose([ridge_from_json(h, t) for h, t in zip(chk.hour, chk.temp_c)], rid.predict(chk), atol=1e-6)
assert np.allclose([ridge_phys_from_json(h, t) for h, t in zip(chk.hour, chk.temp_c)], rp.predict(chk), atol=1e-6)
assert np.allclose([kinetic_from_json(h, t) for h, t in zip(chk.hour, chk.temp_c)], final['C_kinetic'].predict(chk), atol=1e-6)
# the ensemble's members are fitted on all data exactly like the standalone B2 and C models
assert np.allclose(final['D_ensemble'].predict(chk),
                   [(ridge_phys_from_json(h, t) + kinetic_from_json(h, t)) / 2 for h, t in zip(chk.hour, chk.temp_c)], atol=1e-6)

with open(OUT / 'model_export.json', 'w') as f:
    json.dump(export, f, indent=2, allow_nan=False)   # NaN is not valid JSON for the browser
holdout.to_csv(OUT / 'metrics_held_out_time.csv', index=False)
rolling.to_csv(OUT / 'metrics_rolling_origin.csv', index=False)
loto.to_csv(OUT / 'metrics_loto.csv', index=False)
anchored.to_csv(OUT / 'metrics_anchored.csv', index=False)
thr_df.to_csv(OUT / 'threshold_crossings.csv', index=False)
thr_err.to_csv(OUT / 'threshold_error.csv')
sens_tab.to_csv(OUT / 'threshold_sensitivity.csv', index=False)
blue.to_csv(OUT / 'blue_band_exit.csv', index=False)
print('wrote', sorted(p.name for p in OUT.iterdir()))
""")

md("""
## 11. Findings & limitations (fill from the outputs above)
- **Model comparison:** use the summary table in section 8 — every model was trained on identical rows in each split; A needs one quadratic per observed temperature and interpolated coefficients for unseen ones.
- **Unseen temperatures:** interpolation (175–205 °C) vs. extrapolation (160, 220 °C) errors differ — report both.
- **Run-to-run variation:** residuals stay biased for some temperatures (e.g. 190 °C above, 175 °C below) whatever the model shape; with one run per temperature this cannot be separated from temperature effects. Extra flexibility does not remove it.
- **Anchoring:** one numeric TPC reading removes most of that offset; this motivates reference-TPC measurements in the local pilot, not strip bands alone.
- **Threshold:** 25% TPC is crossed within 30 h only at 190/205/220 °C; 160/175 °C are censored, so no time-to-threshold is claimed there.
- **Sensitivity:** compare section 9b across 24 / 25 / 27% — conclusions should not hinge on one country's limit.
- **Strip link:** the 20% blue-band exit time connects the forecast to the test-kit colours; it is still lab-data only.
- **Generalization:** one oil, one food, constant temperature, no top-ups, one run per temperature → results describe this lab dataset only. Vendor-facing countdowns stay disabled until local longitudinal reference-TPC data exist.
""")

nb = nbf.v4.new_notebook(cells=cells, metadata={
    'kernelspec': {'name': 'python3', 'display_name': 'Python 3', 'language': 'python'},
    'language_info': {'name': 'python'},
})
out = Path(__file__).with_name('mantika_tpc_forecasting.ipynb')
nbf.write(nb, out)
print('wrote', out)
