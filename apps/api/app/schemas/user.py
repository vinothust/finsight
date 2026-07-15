from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    department: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    department: str | None = None
