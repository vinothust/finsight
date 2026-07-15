from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.associations import AccountDirector
from app.models.cluster import Cluster
from app.models.project import Project
from app.models.user import User
from app.services.assignments import sync_assignment


def _account_detail(db: Session, account: Account) -> dict:
    projects = db.query(Project).filter_by(account_id=account.id).order_by(Project.name).all()
    director_ids = [row.user_id for row in db.query(AccountDirector).filter_by(account_id=account.id).all()]
    directors = db.query(User).filter(User.id.in_(director_ids)).all() if director_ids else []
    return {
        "id": account.id,
        "name": account.name,
        "cluster_id": account.cluster_id,
        "projects": [{"id": p.id, "name": p.name} for p in projects],
        "directors": [{"id": u.id, "name": u.name, "email": u.email} for u in directors],
    }


def list_accounts(
    db: Session, cluster_id: int | None, search: str | None, page: int, page_size: int
) -> tuple[list[dict], int]:
    query = db.query(Account)
    if cluster_id is not None:
        query = query.filter(Account.cluster_id == cluster_id)
    if search:
        query = query.filter(Account.name.ilike(f"%{search}%"))
    total = query.count()
    accounts = query.order_by(Account.name).offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for account in accounts:
        project_count = db.query(Project).filter_by(account_id=account.id).count()
        items.append(
            {"id": account.id, "name": account.name, "cluster_id": account.cluster_id, "project_count": project_count}
        )
    return items, total


def get_account(db: Session, account_id: int) -> dict:
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="account not found")
    return _account_detail(db, account)


def create_account(db: Session, name: str, cluster_id: int, directors: list[int] | None) -> dict:
    if db.get(Cluster, cluster_id) is None:
        raise HTTPException(status_code=404, detail="cluster not found")
    account = Account(name=name, cluster_id=cluster_id)
    db.add(account)
    db.flush()
    if directors:
        sync_assignment(db, AccountDirector, "account_id", account.id, directors, "account_director")
    db.commit()
    return _account_detail(db, account)


def update_account(
    db: Session, account_id: int, name: str | None, cluster_id: int | None, directors: list[int] | None
) -> dict:
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="account not found")
    if cluster_id is not None:
        if db.get(Cluster, cluster_id) is None:
            raise HTTPException(status_code=404, detail="cluster not found")
        account.cluster_id = cluster_id
    if name is not None:
        account.name = name
    if directors is not None:
        sync_assignment(db, AccountDirector, "account_id", account.id, directors, "account_director")
    db.commit()
    return _account_detail(db, account)


def delete_account(db: Session, account_id: int) -> None:
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="account not found")
    if db.query(Project).filter_by(account_id=account_id).count() > 0:
        raise HTTPException(status_code=409, detail="account has projects; remove them first")
    db.query(AccountDirector).filter_by(account_id=account_id).delete()
    db.delete(account)
    db.commit()
