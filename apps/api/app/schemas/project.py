from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    account_id: int
    status: str | None = None
    managers: list[int] | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    account_id: int | None = None
    status: str | None = None
    managers: list[int] | None = None
