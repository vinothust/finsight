from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.llm_settings import (
    DEFAULT_MODEL_COMPLEX,
    DEFAULT_MODEL_FALLBACK,
    DEFAULT_MODEL_SIMPLE,
    SETTINGS_ROW_ID,
    LLMSettings,
)


def get_or_create_llm_settings(db: Session) -> LLMSettings:
    row = db.get(LLMSettings, SETTINGS_ROW_ID)
    if row is None:
        row = LLMSettings(
            id=SETTINGS_ROW_ID,
            gcp_project=settings.gcp_project,
            gcp_location=settings.gcp_location,
            model_simple=DEFAULT_MODEL_SIMPLE,
            model_complex=DEFAULT_MODEL_COMPLEX,
            model_fallback=DEFAULT_MODEL_FALLBACK,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def update_llm_settings(db: Session, **fields) -> LLMSettings:
    row = get_or_create_llm_settings(db)
    for key, value in fields.items():
        if value is not None:
            setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row
