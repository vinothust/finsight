from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.account import Account
from app.models.project import Project

router = APIRouter(prefix="/scope-options", tags=["scope-options"])


@router.get("/accounts")
def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).order_by(Account.name).all()
    return [{"id": a.id, "name": a.name} for a in accounts]


@router.get("/projects")
def list_projects(account_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if account_id is not None:
        query = query.filter(Project.account_id == account_id)
    projects = query.order_by(Project.name).all()
    return [{"id": p.id, "name": p.name, "account_id": p.account_id} for p in projects]
