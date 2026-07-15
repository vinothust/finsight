from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    cluster_id: int
    directors: list[int] | None = None


class AccountUpdate(BaseModel):
    name: str | None = None
    cluster_id: int | None = None
    directors: list[int] | None = None
