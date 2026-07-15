from pydantic import BaseModel


class UserBrief(BaseModel):
    id: int
    name: str
    email: str


class AccountBrief(BaseModel):
    id: int
    name: str


class ProjectBrief(BaseModel):
    id: int
    name: str
