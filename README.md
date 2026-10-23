# MANTIKA CHECK

Vendor prototype and research API for Team INNOV. The phone demo does not need accounts. The research desk shows the Li (2020) model run and the usability protocol.

## Vendor demo

From `backend` in PowerShell:

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

- Vendor phone: http://127.0.0.1:8000/demo/
- Usability tasks and SUS: http://127.0.0.1:8000/demo/index.html?study=1
- Research desk: http://127.0.0.1:8000/demo/research.html

The sample stall is V-07. Readings stay in the browser. A strip photo is checked for colour on the phone, and on the server when this API is running. Neither result is a TPC measurement or an hours-remaining estimate.

## API

Shared backend for the vendor record and the research lab. The screens can change. These routes are the contract they both use.

The old single-page style study was removed so the project starts from the data and the scientific limits, not from a visual theme.

## Why the backend can start first

Build the records and the rules, then let the web and mobile screens call them.

- Vendor oil logs, strip photos, and manual band corrections live in one set of tables.
- The Li (2020) TPC models live in another. A strip photo is never an input to a TPC model, and a model never returns hours left for a stall.
- English and Filipino consent text, guide steps, and limitation sentences come from the API. The interface renders them.
- `client_mutation_id` is already accepted on logs and photos, so an offline queue can be added later without changing the contract.
- OpenAPI is the handoff. The web app can be generated against `http://127.0.0.1:8000/docs` while layout is still moving.

`GET /api/v1/meta` lists the flags the interface must not contradict, and maps each screen on `design/mantika-check-refined-ui` to the route that fills it. Two services stay separate: `strip_color` and `tpc_forecast`.

The design branch can call these without copying numbers into the HTML:

- `GET /api/v1/lab/published-run` fills the overview, ML laboratory, dataset audit, and reporting tables from model export v3. The same payload is at `GET /api/v1/demo/published-run` before login exists.
- `POST /api/v1/lab/datasets` accepts `models/data/frying_oil_long.csv` (`hour`) and the wide sheet `models/data/total_polar_compoents.csv`.
- `POST /api/v1/demo/usability` stores task success, completion time, and the SUS score. `GET /api/v1/lab/usability` withholds the mean until 5 consented vendors.

## Run

From `backend` in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Interactive contract: http://127.0.0.1:8000/docs
- Machine-readable contract: http://127.0.0.1:8000/openapi.json

Tests:

```powershell
.\.venv\Scripts\python -m pytest
```

The default database is SQLite at `backend/mantika.db`. Set `DATABASE_URL` to a PostgreSQL URL when you move off one laptop. Photograph files go in `backend/storage`.

Local demo accounts, created on an empty database:

| Email | Password | Role |
| --- | --- | --- |
| vendor@mantika.local | vendor-demo | vendor |
| researcher@mantika.local | researcher-demo | researcher |
| admin@mantika.local | admin-demo | administrator |

Change `SECRET_KEY` before any real participant uses it. Public registration creates a vendor only. Researcher and administrator accounts are created by an administrator.

A simulated TPC dataset is loaded so the forecasting screens have something to plot. It is labeled simulated. It is not Li (2020). The validation gate stays missing until a real TPC file is imported as `published_laboratory`.

## What a screen calls

Vendor, after consent:

- `POST /api/v1/vendor/sessions` and `POST /api/v1/vendor/sessions/{id}/events`
- `POST /api/v1/vendor/strips` with the photograph, then `POST /api/v1/vendor/strips/{id}/correction` if the band is wrong
- `GET /api/v1/vendor/dashboard` and `GET /api/v1/vendor/history`
- `GET /api/v1/vendor/guide` and `GET /api/v1/vendor/consent-statement`

Research:

- `POST /api/v1/lab/datasets` imports one outcome per file: `tpc`, `acid_value`, or `carbonyl_value`
- `POST /api/v1/lab/forecast/evaluate` returns both baselines, MAE, RMSE, and crossings
- `GET /api/v1/lab/strips/agreement` and `POST /api/v1/lab/strips/split-check`
- `GET /api/v1/lab/validation`, `GET /api/v1/lab/pilot-summary`, and the CSV exports

A vendor token cannot call the lab routes. Names and stall details are on the administrator identity route only. An area summary with fewer than five consented participants returns `suppressed: true` and no count.

## Forecasting data

Li et al. (2020) published three CSV files — TPC, acid value, and carbonyl value — for potato-chip frying at 160, 175, 190, 205, and 220°C from hour 0 through hour 30. Data DOI: [10.17632/4k7b395yxx](https://doi.org/10.17632/4k7b395yxx). The paper's methods describe soybean oil and no fresh-oil replenishment.

Import those files separately. Acid value and carbonyl value are rejected if you label them as TPC. The importer expects a long table with temperature, time in hours, and the outcome. If a downloaded file is a wide matrix, reshape it first. Do not rename another column to TPC.

This project reports a crossing at 25% TPC only when two neighboring observations support it. Otherwise the status is `not_reached`. That 25% mark is the project's research benchmark, not a Philippine legal limit. The paper also discusses 27% TPC from a Chinese hygienic standard. Neither number is shown as a disposal order for a stall.

The ridge baseline is the normal-equation ridge estimator. Every evaluation returns the penalty and the feature list so the fit can be repeated. Scores use held-out points only.

## Scientific locks already enforced

- Strip results include `is_tpc: false` and `experimental: true`.
- There is no hours-remaining field. Sending one on a lab request is rejected.
- A laboratory reference TPC can be stored. It still does not enable a vendor forecast.
- Photographs of the same physical strip share `physical_strip_id`. The split check refuses a train/test cut that breaks the group.
- Withdrawn participants leave the research CSV. An administrator can delete the stored research rows.
