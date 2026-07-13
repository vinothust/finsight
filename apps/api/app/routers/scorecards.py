from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import RoleScope, get_role_scope
from app.services.scorecards import program_scorecards

router = APIRouter(prefix="/scorecards", tags=["scorecards"])


@router.get("")
def get_scorecards(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return program_scorecards(db, scope)
