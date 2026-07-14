from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import CurrentUser, get_current_user
from app.services.insights import generate_narrative

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("")
def get_insight(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return {"narrative": generate_narrative(db, user)}
