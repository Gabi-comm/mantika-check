# MANTIKA CHECK

Stall-side prototype and research API for reading frying-oil test strips, kept separate from published TPC models. Team INNOV, PJDSC 2026.

The design screens are on [`design/mantika-check-refined-ui`](https://github.com/Gabi-comm/mantika-check/tree/design/mantika-check-refined-ui). This branch is the API and the runnable prototype.

## Run

From `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

- Vendor phone: http://127.0.0.1:8000/demo/
- Study tasks: http://127.0.0.1:8000/demo/?study=1
- Research desk: http://127.0.0.1:8000/demo/research.html
- API docs: http://127.0.0.1:8000/docs

The phone sample is stall V-07 and does not need an account. Readings stay in the browser until the API is used.

Demo accounts on a fresh database:

| Email | Password | Role |
| --- | --- | --- |
| vendor@mantika.local | vendor-demo | vendor |
| researcher@mantika.local | researcher-demo | researcher |
| admin@mantika.local | admin-demo | administrator |

Set `SECRET_KEY` before anyone real uses it. The database defaults to SQLite at `backend/mantika.db`. Set `DATABASE_URL` for PostgreSQL. Photos are stored in `backend/storage`.

## Tests

```powershell
.\.venv\Scripts\python -m pytest
```

## Limits

A strip photo is a colour reading, not a laboratory TPC measurement. The phone does not show hours remaining or a safety verdict. The 25% TPC line is a research benchmark, not Philippine law. Acid value and carbonyl value are imported as their own files, not as TPC.
