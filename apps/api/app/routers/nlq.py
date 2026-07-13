from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import RoleScope, get_role_scope
from app.services.nl2sql import run_query

router = APIRouter(prefix="/nlq", tags=["nlq"])


class NLQRequest(BaseModel):
    question: str


@router.post("")
def ask_question(
    payload: NLQRequest, db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)
):
    return run_query(db, payload.question, scope)
