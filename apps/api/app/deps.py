from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_token
from app.models.account import Account
from app.models.associations import AccountDirector, ClusterHead, ProjectManager
from app.models.project import Project
from app.models.user import User

ACCESS_TOKEN_COOKIE = "finsight_access_token"


@dataclass
class CurrentUser:
    id: int
    email: str
    name: str
    role: str
    project_ids: list[int] | None  # None = unrestricted (admin)
    department: str | None = None


def require_csrf_header(request: Request) -> None:
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and "x-requested-with" not in request.headers:
        raise HTTPException(status_code=403, detail="missing X-Requested-With header")


def _resolve_project_ids(db: Session, user: User) -> list[int] | None:
    if user.role == "admin":
        return None
    if user.role == "cluster_head":
        cluster_ids = [row.cluster_id for row in db.query(ClusterHead).filter_by(user_id=user.id).all()]
        account_ids = [i for (i,) in db.query(Account.id).filter(Account.cluster_id.in_(cluster_ids)).all()]
        return [i for (i,) in db.query(Project.id).filter(Project.account_id.in_(account_ids)).all()]
    if user.role == "account_director":
        account_ids = [row.account_id for row in db.query(AccountDirector).filter_by(user_id=user.id).all()]
        return [i for (i,) in db.query(Project.id).filter(Project.account_id.in_(account_ids)).all()]
    if user.role == "project_manager":
        return [row.project_id for row in db.query(ProjectManager).filter_by(user_id=user.id).all()]
    return []


def get_current_user(
    request: Request,
    _csrf: None = Depends(require_csrf_header),
    db: Session = Depends(get_db),
) -> CurrentUser:
    access_token = request.cookies.get(ACCESS_TOKEN_COOKIE)
    if access_token is None:
        raise HTTPException(status_code=401, detail="not authenticated")
    payload = decode_token(access_token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="invalid or expired token")

    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="user not found")

    project_ids = _resolve_project_ids(db, user)
    return CurrentUser(
        id=user.id, email=user.email, name=user.name, role=user.role, project_ids=project_ids, department=user.department
    )


def require_role(*roles: str):
    def _check(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="insufficient permissions")
        return user

    return _check
