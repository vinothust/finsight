from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import RoleScope, get_role_scope
from app.services.dashboard import revenue_margin_summary, utilization_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/revenue-margin")
def get_revenue_margin(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return revenue_margin_summary(db, scope)


@router.get("/utilization")
def get_utilization(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return utilization_summary(db, scope)
