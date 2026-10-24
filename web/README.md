# Mantika Check (web)

Frying-oil advisor for street-food vendors. Next.js app with the engine in `src/lib`.

## Run
From the repo root: `npm run dev` · `npm test` · `npm run build`

## Env (`web/.env.local`, see `.env.example`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` – accounts and sync (setup: `../supabase/README.md`)
- `HF_TOKEN`, `HF_MODEL` – optional, Hugging Face wording for the advice; without them the fixed template is used

## Where things are
- `src/lib` – engine: tpc model, safety rules, fuzzy logic, advice
- `src/vendor` – workspace data on the device + supabase sync
- `src/components`, `src/app` – ui and pages
- `tests` – engine and sync tests
- `../models` – how the tpc model was trained (notebook, data, metrics)
