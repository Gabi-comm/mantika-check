import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + (tmp_path / "test.db").as_posix())
    monkeypatch.setenv("STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")
    monkeypatch.setenv("SEED_DEMO", "true")
    monkeypatch.setenv("SEED_SIMULATED", "false")
    monkeypatch.setenv("PASSWORD_ITERATIONS", "1000")

    from app.config import get_settings
    from app.db import shutdown_db

    get_settings.cache_clear()
    shutdown_db()
    from app.main import create_app

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    shutdown_db()


def login(client, email, password="vendor-demo"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def walk_keys(value, found=None):
    found = set() if found is None else found
    if isinstance(value, dict):
        found.update(value.keys())
        for item in value.values():
            walk_keys(item, found)
    elif isinstance(value, list):
        for item in value:
            walk_keys(item, found)
    return found
