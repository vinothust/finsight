from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import RoleScope, get_role_scope
from app.services.insights import generate_narrative

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("")
def get_insight(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return {"narrative": generate_narrative(db, scope)}
