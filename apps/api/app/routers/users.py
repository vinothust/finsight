from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import require_role
from app.schemas.user import UserCreate, UserUpdate
from app.services import users as user_service

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_role("admin"))])


@router.get("")
def list_users(
    search: str | None = None,
    role: str | None = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    items, total = user_service.list_users(db, search, role, page, page_size)
    return {"users": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    return {"user": user_service.get_user(db, user_id)}


@router.post("", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user, temp_password = user_service.create_user(db, payload.name, payload.email, payload.role, payload.department)
    return {"user": user, "temp_password": temp_password}


@router.patch("/{user_id}")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    return {
        "user": user_service.update_user(db, user_id, payload.name, payload.email, payload.role, payload.department)
    }


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user_service.delete_user(db, user_id)
    return {"success": True, "message": "user deactivated"}
