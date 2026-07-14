import secrets
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(subject), "exp": expire, "type": "access", "jti": secrets.token_hex(8)},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(subject: int) -> tuple[str, datetime]:
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    token = jwt.encode(
        {"sub": str(subject), "exp": expire, "type": "refresh", "jti": secrets.token_hex(8)},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token, expire


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
