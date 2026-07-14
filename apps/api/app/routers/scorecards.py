from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import CurrentUser, get_current_user
from app.services.scorecards import project_scorecards

router = APIRouter(prefix="/scorecards", tags=["scorecards"])


@router.get("")
def get_scorecards(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return project_scorecards(db, user)
