import secrets
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.roles import VALID_ROLES
from app.core.security import hash_password
from app.models.refresh_token import RefreshToken
from app.models.user import User


def _user_out(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "is_active": user.is_active,
    }


def generate_temp_password() -> str:
    return secrets.token_urlsafe(9)


def list_users(
    db: Session, search: str | None, role: str | None, page: int, page_size: int
) -> tuple[list[dict], int]:
    query = db.query(User)
    if search:
        pattern = f"%{search}%"
        query = query.filter((User.name.ilike(pattern)) | (User.email.ilike(pattern)))
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    users = query.order_by(User.name).offset((page - 1) * page_size).limit(page_size).all()
    return [_user_out(u) for u in users], total


def get_user(db: Session, user_id: int) -> dict:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")
    return _user_out(user)


def create_user(db: Session, name: str, email: str, role: str, department: str | None) -> tuple[dict, str]:
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"invalid role: {role}")
    if db.query(User).filter_by(email=email).first() is not None:
        raise HTTPException(status_code=409, detail="email already in use")

    temp_password = generate_temp_password()
    user = User(
        name=name, email=email, role=role, department=department, password_hash=hash_password(temp_password)
    )
    db.add(user)
    db.commit()
    return _user_out(user), temp_password


def update_user(
    db: Session, user_id: int, name: str | None, email: str | None, role: str | None, department: str | None
) -> dict:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")
    if role is not None and role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"invalid role: {role}")
    if email is not None and email != user.email and db.query(User).filter_by(email=email).first() is not None:
        raise HTTPException(status_code=409, detail="email already in use")

    if name is not None:
        user.name = name
    if email is not None:
        user.email = email
    if role is not None:
        user.role = role
    if department is not None:
        user.department = department
    db.commit()
    return _user_out(user)


def delete_user(db: Session, user_id: int) -> None:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")
    user.is_active = False
    db.query(RefreshToken).filter_by(user_id=user_id, revoked_at=None).update({"revoked_at": datetime.utcnow()})
    db.commit()
