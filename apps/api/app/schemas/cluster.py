from pydantic import BaseModel


class ClusterCreate(BaseModel):
    name: str
    description: str | None = None


class ClusterUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    heads: list[int] | None = None
