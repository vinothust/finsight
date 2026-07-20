from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# apps/api/.env - resolved relative to this file, not the process cwd, so it's
# found regardless of where uvicorn is launched from (e.g. `--app-dir apps/api`
# from the repo root does not chdir, so a relative ".env" would silently miss).
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore", protected_namespaces=())

    database_url: str = "postgresql+psycopg://finsight:finsight@localhost:5432/finsight"
    gcp_project: str = ""
    gcp_location: str = "us-central1"
    # Seed defaults for the llm_settings DB row on first bootstrap only -
    # once that row exists, the Settings UI/API is authoritative and these
    # env values are no longer read.
    model_simple: str = "gemini-2.5-flash-lite"
    model_complex: str = "gemini-2.5-flash"
    model_fallback: str = "gemini-2.5-pro"

    jwt_secret_key: str = "dev-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Vite auto-increments the dev server port when 5173 is already taken by another
    # running instance (common when multiple dev servers are left open) - cover the
    # typical fallback range so login doesn't break depending on which port it lands on.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ]


settings = Settings()
