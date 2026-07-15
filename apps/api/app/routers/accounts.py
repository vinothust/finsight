from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import require_role
from app.schemas.account import AccountCreate, AccountUpdate
from app.services import accounts as account_service

router = APIRouter(prefix="/accounts", tags=["accounts"], dependencies=[Depends(require_role("admin"))])


@router.get("")
def list_accounts(
    cluster_id: int | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    items, total = account_service.list_accounts(db, cluster_id, search, page, page_size)
    return {"accounts": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{account_id}")
def get_account(account_id: int, db: Session = Depends(get_db)):
    return {"account": account_service.get_account(db, account_id)}


@router.post("", status_code=201)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    return {"account": account_service.create_account(db, payload.name, payload.cluster_id, payload.directors)}


@router.patch("/{account_id}")
def update_account(account_id: int, payload: AccountUpdate, db: Session = Depends(get_db)):
    return {
        "account": account_service.update_account(
            db, account_id, payload.name, payload.cluster_id, payload.directors
        )
    }


@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account_service.delete_account(db, account_id)
    return {"success": True, "message": "account deleted"}
