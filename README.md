# Mantika Check

A frying-oil advisor for street-food vendors, built for PJDSC 2026.

Vendors log how long and how hot they fried, what they cooked, top-ups and what the oil looks like. Mantika Check estimates how worn the oil is, warns them the moment a warning sign shows up, and tells them whether to keep using, filter, top up or replace it. Ollie, the oil-drop mascot, changes with the oil's status.

**Live:** https://mantika-check.vercel.app

## How it decides

The engine is neuro-symbolic and runs in the browser (`web/src/lib`):

1. **Data-driven estimate**: an Arrhenius kinetic model predicts total polar compounds (TPC) from frying hours and heat. It was trained on published laboratory frying data (Li, 2020). See [`models/`](models/README.md).
2. **Hard safety rules**: visible warning signs (smoke, foam, dark and murky, thick oil) or an estimated TPC above 25% override everything and say "replace now".
3. **Fuzzy rules**: a Mamdani fuzzy system weighs the TPC estimate, how much breaded food was fried and how stable the oil type is, and picks one of four statuses: Continue Monitoring, Monitor Closely, Replacement Recommended, Replace Oil.
4. **Advice wording**: an optional Hugging Face model rewrites the advice text. It only words the decision and never changes it. Without a token, fixed templates are used.

The statuses are estimates from logged usage and observations, not lab measurements. The model has not been validated at real stalls yet.

## Features

- Dashboard with oil status, forecast and usage charts
- Session logging, quick visual checks, top-ups and batch replacement
- History of every batch and event
- Accounts with email or Google sign-in. Records sync to Supabase; without an account everything stays on the device.
- Help drawer and a guided tour
- Experimental colour analyzer: compares a region of an oil photo with printed reference swatches
- Mobile-first, with dark and light themes

## Run it

Needs Node 20.9 or newer.

```bash
npm run install:web   # first time
npm run dev           # http://localhost:3000
npm test
npm run build
```

Run these from the repo root. They forward to `web/`.

Copy `web/.env.example` to `web/.env.local` and fill in:

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | accounts and sync ([setup steps](supabase/README.md)) |
| `HF_TOKEN`, `HF_MODEL` | optional, Hugging Face advice wording |

The app works without any of these; it just stays on-device with template advice.

## Repo layout

| Path | What's there |
|---|---|
| `web/` | Next.js app: engine in `src/lib`, workspace data and sync in `src/vendor`, UI in `src/components` and `src/app`, tests in `tests/` |
| `models/` | TPC model training: notebook, data, metrics, figures, and `model_export.json` that the app loads |
| `supabase/` | database migration (tables, RLS) and setup guide |
| `demo-video/` | desktop and mobile demo recordings |

## Built with

Next.js 16, React 19, Tailwind CSS 4, TypeScript, Supabase, Vitest, and the Hugging Face inference router.

## Data and references

- Li, Y. (2020). *Frying oil data* [Data set]. Mendeley Data. https://doi.org/10.17632/4k7b395yxx.1
- 25% TPC is used as a research benchmark (Thailand MOPH No. 283, 2004; India FSSAI), not a Philippine legal limit.
- Test-strip bands from Yongyod & Kerdsin (2025).
