from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", protected_namespaces=())

    database_url: str = "postgresql+psycopg://finsight:finsight@localhost:5432/finsight"
    gcp_project: str = ""
    gcp_location: str = "us-central1"
    # Seed defaults for the llm_settings DB row on first bootstrap only -
    # once that row exists, the Settings UI/API is authoritative and these
    # env values are no longer read.
    model_simple: str = "gemini-2.5-flash-lite"
    model_complex: str = "gemini-2.5-flash"
    model_fallback: str = "gemini-2.5-pro"


settings = Settings()
