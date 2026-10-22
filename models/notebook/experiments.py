"""Diagnostics + candidate improvements for the TPC models (run locally)."""
import numpy as np, pandas as pd
from scipy.optimize import curve_fit
from sklearn.linear_model import Ridge

raw = pd.read_csv('../data/total_polar_compoents.csv')
raw['hour'] = np.arange(len(raw))
df = raw.melt(id_vars='hour', var_name='c', value_name='tpc')
df['temp_c'] = df.c.str[4:].astype(int); df = df.drop(columns='c')
TEMPS = sorted(df.temp_c.unique()); R = 8.314; TREF = 463.15
rmse = lambda a, b: float(np.sqrt(np.mean((np.asarray(a) - np.asarray(b)) ** 2)))

def arr(tc, lnA, Ea):
    return np.exp(lnA - Ea / R * (1 / (tc + 273.15) - 1 / TREF))

# ---- C: baseline kinetic
def kin(X, c0, lnA, Ea, n):
    h, tc = X; return c0 + arr(tc, lnA, Ea) * h ** n
def fit_kin(d):
    return curve_fit(kin, (d.hour.values * 1., d.temp_c.values * 1.), d.tpc.values,
                     p0=[11, -.5, 6e4, 1], bounds=([0, -10, 0, .3], [30, 5, 3e5, 3]), maxfev=20000)[0]

# ---- C2: kinetic with T-dependent exponent n(T) = n0 + n1*(T-190)/30
def kin2(X, c0, lnA, Ea, n0, n1):
    h, tc = X; return c0 + arr(tc, lnA, Ea) * h ** (n0 + n1 * (tc - 190) / 30)
def fit_kin2(d):
    return curve_fit(kin2, (d.hour.values * 1., d.temp_c.values * 1.), d.tpc.values,
                     p0=[11, -.5, 6e4, 1, 0], bounds=([0, -10, 0, .3, -1], [30, 5, 3e5, 3, 1]), maxfev=20000)[0]

# ---- C3: linear+quadratic Arrhenius (two rate constants)  tpc = c0 + k1(T) h + k2(T) h^2
def kin3(X, c0, lnA1, Ea1, lnA2, Ea2):
    h, tc = X; return c0 + arr(tc, lnA1, Ea1) * h + arr(tc, lnA2, Ea2) * h ** 2
def fit_kin3(d):
    return curve_fit(kin3, (d.hour.values * 1., d.temp_c.values * 1.), d.tpc.values,
                     p0=[11, -.7, 6e4, -6, 8e4], bounds=([0, -12, 0, -15, 0], [30, 5, 3e5, 5, 4e5]), maxfev=40000)[0]

# ---- B2: Ridge on physics features  [h, h^2] * exp(-b/T) family, b grid-searched
def feats(d, b):
    w = np.exp(-b * (1 / (d.temp_c.values + 273.15) - 1 / TREF))
    h = d.hour.values * 1.
    return np.c_[h * w, h ** 2 * w, h, w]
def fit_ridge_phys(d, alpha=1e-3):
    best = None
    for b in np.linspace(1000, 12000, 45):           # b = Ea/R
        # inner leave-one-temperature-out to pick b (no peeking at outer test temp)
        errs = []
        for t in d.temp_c.unique():
            tr, te = d[d.temp_c != t], d[d.temp_c == t]
            m = Ridge(alpha=alpha).fit(feats(tr, b), tr.tpc)
            errs.append(rmse(te.tpc, m.predict(feats(te, b))))
        s = np.mean(errs)
        if best is None or s < best[0]: best = (s, b)
    b = best[1]
    return b, Ridge(alpha=alpha).fit(feats(d, b), d.tpc)

MODELS = {
    'C_kinetic':      (fit_kin,  lambda p, d: kin((d.hour * 1., d.temp_c * 1.), *p)),
    'C2_kinetic_nT':  (fit_kin2, lambda p, d: kin2((d.hour * 1., d.temp_c * 1.), *p)),
    'C3_kinetic_2k':  (fit_kin3, lambda p, d: kin3((d.hour * 1., d.temp_c * 1.), *p)),
    'B2_ridge_phys':  (fit_ridge_phys, lambda p, d: p[1].predict(feats(d, p[0]))),
}

print('=== 1. Residual bias of baseline C (fit on all data), mean residual per temperature')
p = fit_kin(df); res = df.tpc - MODELS['C_kinetic'][1](p, df)
print(df.assign(r=res).groupby('temp_c').r.agg(['mean', 'std']).round(2).T)
print('initial TPC by temp:', df[df.hour == 0].set_index('temp_c').tpc.to_dict())

print('\n=== 2. LOTO RMSE per held-out temperature')
loto = {}
for name, (fit, pred) in MODELS.items():
    loto[name] = {t: rmse(df[df.temp_c == t].tpc, pred(fit(df[df.temp_c != t]), df[df.temp_c == t])) for t in TEMPS}
L = pd.DataFrame(loto).T; L['mean'] = L.mean(1); print(L.round(2))

print('\n=== 3. Rolling-origin forecast (train hours < origin, ALL temps; predict next 6 h)')
ro = {}
for name, (fit, pred) in MODELS.items():
    errs = []
    for o in [12, 15, 18, 21, 24]:
        tr, te = df[df.hour < o], df[(df.hour >= o) & (df.hour < o + 6)]
        errs.append(rmse(te.tpc, pred(fit(tr), te)))
    ro[name] = errs
RO = pd.DataFrame(ro, index=[12, 15, 18, 21, 24]).T; RO['mean'] = RO.mean(1); print(RO.round(2))

print('\n=== 4. Anchored forecast: know TPC at hour o (e.g. a strip/lab reading) -> forecast +6 h, LOTO')
for name in ['C_kinetic', 'C3_kinetic_2k']:
    fit, pred = MODELS[name]
    plain, anch = [], []
    for t in TEMPS:
        p = fit(df[df.temp_c != t]); s = df[df.temp_c == t].set_index('hour').tpc
        for o in [6, 12, 18, 24]:
            hh = np.arange(o + 1, min(o + 7, 31)); d0 = pd.DataFrame({'hour': [o], 'temp_c': t})
            dd = pd.DataFrame({'hour': hh, 'temp_c': t})
            base = pred(p, dd).values
            shift = s[o] - pred(p, d0).values[0]       # offset correction from the observed reading
            plain.append(rmse(s[hh], base)); anch.append(rmse(s[hh], base + shift))
    print(f'{name:15s} unanchored RMSE {np.mean(plain):.2f}   anchored RMSE {np.mean(anch):.2f}')

print('\n=== 5. 90% interval coverage (LOTO residual quantile, evaluated per held-out temp)')
for name, (fit, pred) in MODELS.items():
    cov = []
    for t in TEMPS:
        # band width from the OTHER folds only (honest), then check coverage on t
        others = [u for u in TEMPS if u != t]
        r = np.concatenate([np.abs(df[df.temp_c == u].tpc - pred(fit(df[df.temp_c != u]), df[df.temp_c == u])) for u in others])
        q = np.quantile(r, .9); te = df[df.temp_c == t]
        cov.append(np.mean(np.abs(te.tpc - pred(fit(df[df.temp_c != t]), te)) <= q))
    print(f'{name:15s} coverage by temp {dict(zip(TEMPS, np.round(cov, 2)))}  mean {np.mean(cov):.2f}')

print('\n=== 6. 25% threshold crossing error (LOTO, hours) for observed crossings')
def cross(h, v, thr=25):
    i = np.argmax(v >= thr)
    return None if v[i] < thr else h[i - 1] + (thr - v[i - 1]) * (h[i] - h[i - 1]) / (v[i] - v[i - 1])
fine = np.linspace(0, 30, 3001)
obs = {t: cross(df[df.temp_c == t].hour.values * 1., df[df.temp_c == t].tpc.values) for t in TEMPS}
for name, (fit, pred) in MODELS.items():
    e = []
    for t in [190, 205, 220]:
        v = pred(fit(df[df.temp_c != t]), pd.DataFrame({'hour': fine, 'temp_c': t}))
        c = cross(fine, np.asarray(v)); e.append(abs(c - obs[t]) if c else np.nan)
    print(f'{name:15s} |error| h {np.round(e, 2)}  mean {np.nanmean(e):.2f}')

print('\n=== 7. Fitted parameters on all data')
for name in ['C_kinetic', 'C2_kinetic_nT', 'C3_kinetic_2k']:
    print(name, np.round(MODELS[name][0](df), 4))
b, _ = fit_ridge_phys(df); print('B2 Ea/R =', round(b), '-> Ea ~', round(b * R / 1000, 1), 'kJ/mol')
