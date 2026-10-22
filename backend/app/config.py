from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT / ".env"), extra="ignore")

    database_url: str = "sqlite:///./mantika.db"
    secret_key: str = "dev-only-change-me"
    storage_dir: str = "storage"
    seed_demo: bool = True
    seed_simulated: bool = True
    token_hours: int = 12
    password_iterations: int = 200_000
    cors_origins: str = (
        "http://localhost:5173,http://localhost:3000,"
        "http://127.0.0.1:5173,http://127.0.0.1:3000"
    )

    def origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def resolve_sqlite(url: str) -> str:
    prefix = "sqlite:///./"
    if url.startswith(prefix):
        path = (ROOT / url[len(prefix) :]).resolve()
        return "sqlite:///" + path.as_posix()
    return url


def storage_path() -> Path:
    raw = Path(get_settings().storage_dir)
    if not raw.is_absolute():
        raw = ROOT / raw
    raw.mkdir(parents=True, exist_ok=True)
    return raw
