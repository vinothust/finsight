from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.account import Account
from app.models.program import Program

router = APIRouter(prefix="/scope-options", tags=["scope-options"])


@router.get("/accounts")
def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).order_by(Account.name).all()
    return [{"id": a.id, "name": a.name} for a in accounts]


@router.get("/programs")
def list_programs(account_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Program)
    if account_id is not None:
        query = query.filter(Program.account_id == account_id)
    programs = query.order_by(Program.name).all()
    return [{"id": p.id, "name": p.name, "account_id": p.account_id} for p in programs]
