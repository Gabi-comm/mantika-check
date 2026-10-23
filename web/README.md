# MANTIKA CHECK web (Next.js)

Next.js 16 App Router frontend for the MANTIKA CHECK vendor workspace and public site.
The previous Vite app in `../app` is kept as a migration reference and rollback.

## Run locally

```bash
cd web
npm install
npm run dev        # http://localhost:3000
# production check
npm run typecheck && npm run lint && npm run build && npm start
```

## Structure

- `src/app/(site)/` public pages: `/`, `/features`, `/methodology`, `/about`
- `src/app/app/` vendor workspace: dashboard, setup, log, check, top-up, replace, history, settings, about, experimental color analyzer
- `src/vendor/` UI-owned domain layer: `types.ts` (engine contract mirror), `copy.ts` (all English copy), `seed.ts` (deterministic demo scenarios), `adapter.ts` (status/advice adapter, demo heuristic), `store.ts` (localStorage), `useOilStatus.ts` (single data hook)
- `src/components/` UI primitives, vendor components, site components
- `src/features/color/` experimental color analyzer (isolated from the status)

## Engine integration

Implement `StatusAdapter` from `src/vendor/adapter.ts` against the engine and set `ACTIVE_ADAPTER`.
Screens read only `useOilStatus()`. When the engine's shared types exist, import them in place of the
"engine contract" block in `src/vendor/types.ts`.

The demo heuristic uses placeholder weights. It never produces TPC values or remaining-hour forecasts.
