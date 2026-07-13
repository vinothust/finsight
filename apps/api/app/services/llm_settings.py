from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.llm_settings import SETTINGS_ROW_ID, LLMSettings


def get_or_create_llm_settings(db: Session) -> LLMSettings:
    row = db.get(LLMSettings, SETTINGS_ROW_ID)
    if row is None:
        row = LLMSettings(
            id=SETTINGS_ROW_ID,
            gcp_project=settings.gcp_project,
            gcp_location=settings.gcp_location,
            model_simple=settings.model_simple,
            model_complex=settings.model_complex,
            model_fallback=settings.model_fallback,
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
