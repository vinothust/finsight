from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

DEFAULT_MODEL_SIMPLE = "gemini-2.5-flash-lite"
DEFAULT_MODEL_COMPLEX = "gemini-2.5-flash"
DEFAULT_MODEL_FALLBACK = "gemini-2.5-pro"
DEFAULT_LOCATION = "us-central1"

SETTINGS_ROW_ID = 1


class LLMSettings(Base):
    __tablename__ = "llm_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=SETTINGS_ROW_ID)
    gcp_project: Mapped[str] = mapped_column(String(200), default="")
    gcp_location: Mapped[str] = mapped_column(String(100), default=DEFAULT_LOCATION)
    model_simple: Mapped[str] = mapped_column(String(100), default=DEFAULT_MODEL_SIMPLE)
    model_complex: Mapped[str] = mapped_column(String(100), default=DEFAULT_MODEL_COMPLEX)
    model_fallback: Mapped[str] = mapped_column(String(100), default=DEFAULT_MODEL_FALLBACK)
