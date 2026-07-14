from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import CurrentUser, get_current_user
from app.services.nl2sql import run_query

router = APIRouter(prefix="/nlq", tags=["nlq"])


class NLQRequest(BaseModel):
    question: str


@router.post("")
def ask_question(
    payload: NLQRequest, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    return run_query(db, payload.question, user)
