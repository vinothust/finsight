import hashlib
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.deps import ACCESS_TOKEN_COOKIE, CurrentUser, get_current_user, require_csrf_header
from app.models.refresh_token import RefreshToken
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_TOKEN_COOKIE = "finsight_refresh_token"


class LoginRequest(BaseModel):
    email: str
    password: str


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _user_out(user: User | CurrentUser) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "department": user.department}


def _set_auth_cookies(response: Response, user_id: int, db: Session) -> None:
    access_token = create_access_token(user_id)
    refresh_token, expires_at = create_refresh_token(user_id)
    db.add(RefreshToken(user_id=user_id, token_hash=_hash_token(refresh_token), expires_at=expires_at))
    db.commit()
    response.set_cookie(ACCESS_TOKEN_COOKIE, access_token, httponly=True, secure=True, samesite="lax")
    response.set_cookie(REFRESH_TOKEN_COOKIE, refresh_token, httponly=True, secure=True, samesite="lax")


@router.post("/login", dependencies=[Depends(require_csrf_header)])
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=payload.email).first()
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid email or password")
    _set_auth_cookies(response, user.id, db)
    return {"user": _user_out(user)}


@router.post("/refresh", dependencies=[Depends(require_csrf_header)])
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if token is None:
        raise HTTPException(status_code=401, detail="missing refresh token")
    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="invalid refresh token")

    stored = db.query(RefreshToken).filter_by(token_hash=_hash_token(token)).first()
    if stored is None or stored.revoked_at is not None or stored.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="refresh token expired or revoked")

    stored.revoked_at = datetime.utcnow()
    db.commit()
    _set_auth_cookies(response, stored.user_id, db)
    return {"success": True}


@router.post("/logout", dependencies=[Depends(require_csrf_header)])
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if token is not None:
        stored = db.query(RefreshToken).filter_by(token_hash=_hash_token(token)).first()
        if stored is not None:
            stored.revoked_at = datetime.utcnow()
            db.commit()
    response.delete_cookie(ACCESS_TOKEN_COOKIE)
    response.delete_cookie(REFRESH_TOKEN_COOKIE)
    return {"success": True, "message": "logged out"}


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    return {"user": _user_out(user)}
