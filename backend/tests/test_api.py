import io

from PIL import Image

from tests.conftest import login, walk_keys


def _png(color):
    buffer = io.BytesIO()
    Image.new("RGB", (120, 80), color).save(buffer, format="PNG")
    return buffer.getvalue()


def _tiny_csv():
    return (
        "temperature_c,time_h,tpc,acid_value\n"
        "160,0,5,100\n"
        "160,5,7,100\n"
        "160,10,9,100\n"
        "160,15,11,100\n"
        "220,0,5,100\n"
        "220,5,12,100\n"
        "220,10,20,100\n"
        "220,15,30,100\n"
    ).encode()


def test_demo_analyze_needs_no_account(client):
    response = client.post(
        "/api/v1/demo/analyze",
        files={"file": ("pad.png", _png((180, 140, 40)), "image/png")},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["is_tpc"] is False
    assert body["experimental"] is True
    assert body["vendor_specific_forecast"] == "disabled"
    assert "hours_remaining" not in walk_keys(body)


def test_meta_locks_the_scientific_flags(client):
    body = client.get("/api/v1/meta").json()
    assert body["flags"]["vendor_hours_remaining"] is False
    assert body["flags"]["strip_photograph_is_tpc"] is False
    assert body["services_are_separate"] == ["strip_color", "tpc_forecast"]


def test_vendor_log_is_idempotent_and_has_no_forecast(client):
    headers = login(client, "vendor@mantika.local")
    payload = {
        "oil_type": "Palm olein",
        "food": "Banana cue",
        "temperature_c": 180,
        "heating_minutes": 45,
        "started_at": "2026-10-23T08:00:00+08:00",
        "client_mutation_id": "phone-session-1",
    }
    first = client.post("/api/v1/vendor/sessions", headers=headers, json=payload)
    second = client.post("/api/v1/vendor/sessions", headers=headers, json=payload)
    assert first.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    listed = client.get("/api/v1/vendor/sessions", headers=headers).json()
    assert len(listed["sessions"]) == 1

    denied = client.post("/api/v1/lab/forecast/evaluate", headers=headers, json={"dataset_id": "none"})
    assert denied.status_code == 403
    assert denied.json()["detail"]["code"] == "forbidden"

    board = client.get("/api/v1/vendor/dashboard", headers=headers).json()
    names = walk_keys(board)
    assert "tpc" not in names
    assert "hours_remaining" not in names
    assert board["accumulated_frying_minutes"] == 45
    assert board["vendor_specific_forecast"] == "disabled"


def test_strip_reading_stays_experimental_and_keeps_the_manual_band(client):
    headers = login(client, "vendor@mantika.local")
    created = client.post(
        "/api/v1/vendor/strips",
        headers=headers,
        data={"color_card_present": "true", "physical_strip_id": "physical-1"},
        files={"file": ("pad.png", _png((120, 70, 30)), "image/png")},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["is_tpc"] is False
    assert body["experimental"] is True
    assert body["label_status"] == "experimental"
    assert body["current_band"] in {"1", "2", "3"}
    assert body["separation"]
    assert "tpc" not in walk_keys(body)

    corrected = client.post(
        f"/api/v1/vendor/strips/{body['id']}/correction",
        headers=headers,
        json={"band": "1", "note": "Looks lighter than the automatic band."},
    ).json()
    assert corrected["manual_band"] == "1"
    assert corrected["current_source"] == "manual"
    assert corrected["automated_band"] == body["automated_band"]
    assert corrected["experimental"] is True

    hidden = client.get(f"/api/v1/vendor/strips/{body['id']}/image")
    assert hidden.status_code == 401


def test_withdrawn_vendor_cannot_add_and_drops_out_of_the_export(client):
    vendor = login(client, "vendor@mantika.local")
    researcher = login(client, "researcher@mantika.local", "researcher-demo")
    created = client.post(
        "/api/v1/vendor/sessions",
        headers=vendor,
        json={
            "oil_type": "Unique Palm Olein",
            "food": "Fish ball",
            "heating_minutes": 20,
            "started_at": "2026-10-23T09:00:00Z",
        },
    )
    assert created.status_code == 200
    withdrawn = client.post("/api/v1/vendor/consent/withdraw", headers=vendor)
    assert withdrawn.status_code == 200
    blocked = client.post(
        "/api/v1/vendor/sessions",
        headers=vendor,
        json={
            "oil_type": "Should not save",
            "food": "Kwek kwek",
            "heating_minutes": 10,
            "started_at": "2026-10-23T10:00:00Z",
        },
    )
    assert blocked.status_code == 403
    assert blocked.json()["detail"]["code"] == "consent_required"

    exported = client.get("/api/v1/lab/exports/oil-sessions.csv", headers=researcher)
    assert exported.status_code == 200
    assert "Unique Palm Olein" not in exported.text
    assert "vendor@mantika.local" not in exported.text
    assert int(exported.headers["X-MANTIKA-Excluded-Withdrawn"]) >= 1


def test_forecast_uses_tpc_only_and_refuses_vendor_fields(client):
    researcher = login(client, "researcher@mantika.local", "researcher-demo")
    extra = client.post(
        "/api/v1/lab/forecast/evaluate",
        headers=researcher,
        json={"dataset_id": "missing", "hours_remaining": 3},
    )
    assert extra.status_code == 422

    imported = client.post(
        "/api/v1/lab/datasets",
        headers=researcher,
        data={
            "name": "Fixture TPC",
            "evidence_source": "published_laboratory",
            "declared_source_name": "Unit fixture",
            "citation": "Fixture rows for the API test, not the Mendeley release.",
            "outcome": "tpc",
        },
        files={"file": ("tiny.csv", _tiny_csv(), "text/csv")},
    )
    assert imported.status_code == 200, imported.text
    profile = imported.json()["import_profile"]
    assert any("acid" in column.lower() for column in profile["ignored_columns"])

    acid = client.post(
        "/api/v1/lab/datasets",
        headers=researcher,
        data={
            "name": "Acid mislabeled",
            "evidence_source": "published_laboratory",
            "declared_source_name": "Unit fixture",
            "citation": "This file is acid value and must be rejected as TPC.",
            "outcome": "tpc",
        },
        files={
            "file": (
                "acid.csv",
                b"temperature_c,time_h,acid_value\n160,0,1\n160,1,1.2\n",
                "text/csv",
            )
        },
    )
    assert acid.status_code == 422
    assert acid.json()["detail"]["code"] == "outcome_mismatch"

    evaluated = client.post(
        "/api/v1/lab/forecast/evaluate",
        headers=researcher,
        json={"dataset_id": imported.json()["id"]},
    )
    assert evaluated.status_code == 200, evaluated.text
    body = evaluated.json()
    assert body["vendor_specific_forecast"] == "disabled"
    assert body["strip_photos_used"] is False
    assert body["target"] == "tpc"
    low = next(item for item in body["crossings"] if item["temperature_c"] == 160)
    high = next(item for item in body["crossings"] if item["temperature_c"] == 220)
    assert low["status"] == "not_reached"
    assert low["hours"] is None
    assert high["status"] == "interpolated"
    assert "hours_remaining" not in walk_keys(body)
    predicted = [
        point["predicted"]
        for baseline in body["baselines"]
        for point in baseline["predictions"]
    ]
    assert predicted
    assert max(predicted) < 80


def test_privacy_boundaries(client):
    researcher = login(client, "researcher@mantika.local", "researcher-demo")
    admin = login(client, "admin@mantika.local", "admin-demo")
    listed = client.get("/api/v1/lab/participants", headers=researcher)
    assert listed.status_code == 200
    assert "Demo Vendor" not in listed.text
    assert "vendor@mantika.local" not in listed.text

    participant_id = listed.json()["participants"][0]["id"]
    hidden = client.get(f"/api/v1/admin/participants/{participant_id}/identity", headers=researcher)
    assert hidden.status_code == 403
    visible = client.get(f"/api/v1/admin/participants/{participant_id}/identity", headers=admin)
    assert visible.status_code == 200
    assert visible.json()["contact_name"] == "Demo Vendor"

    summary = client.get("/api/v1/lab/pilot-summary", headers=researcher).json()
    assert summary["suppressed"] is True
    assert "stalls" not in summary

    for index in range(4):
        created = client.post(
            "/api/v1/lab/participants",
            headers=researcher,
            json={"consent_granted": True, "contact_name": f"Hidden {index}", "stall_area": "North"},
        )
        assert created.status_code == 200, created.text
        assert "contact_name" not in created.json()

    opened = client.get("/api/v1/lab/pilot-summary", headers=researcher).json()
    assert opened["suppressed"] is False
    assert opened["stalls"] == 5
    assert "Hidden" not in str(opened)

    reference = client.post(
        "/api/v1/lab/reference-measurements",
        headers=researcher,
        json={
            "participant_id": participant_id,
            "tpc": 18.5,
            "measured_at": "2026-10-23T00:00:00Z",
            "lab_name": "Partner lab",
            "hours_remaining": 4,
        },
    )
    assert reference.status_code == 422
    stored = client.post(
        "/api/v1/lab/reference-measurements",
        headers=researcher,
        json={
            "participant_id": participant_id,
            "tpc": 18.5,
            "measured_at": "2026-10-23T00:00:00Z",
            "lab_name": "Partner lab",
        },
    )
    assert stored.status_code == 200
    assert stored.json()["vendor_specific_forecast"] == "disabled"
    assert "hours_remaining" not in stored.json()
