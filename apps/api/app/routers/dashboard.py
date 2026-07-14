from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import CurrentUser, get_current_user
from app.services.dashboard import revenue_margin_summary, utilization_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/revenue-margin")
def get_revenue_margin(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return revenue_margin_summary(db, user)


@router.get("/utilization")
def get_utilization(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return utilization_summary(db, user)
