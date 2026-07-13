from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.llm_settings import LLMSettingsOut, LLMSettingsUpdate
from app.services.llm_settings import get_or_create_llm_settings, update_llm_settings

router = APIRouter(prefix="/llm-settings", tags=["llm-settings"])


@router.get("", response_model=LLMSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return get_or_create_llm_settings(db)


@router.put("", response_model=LLMSettingsOut)
def put_settings(payload: LLMSettingsUpdate, db: Session = Depends(get_db)):
    return update_llm_settings(db, **payload.model_dump())
