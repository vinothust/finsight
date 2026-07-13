from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://finsight:finsight@localhost:5432/finsight"
    gcp_project: str = ""
    gcp_location: str = "us-central1"


settings = Settings()
