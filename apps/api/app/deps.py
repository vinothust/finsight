from dataclasses import dataclass

from fastapi import Header

VALID_ROLES = {"pm", "account_director", "area_director"}


@dataclass
class RoleScope:
    role: str
    scope_id: int | None = None


def get_role_scope(
    x_role: str = Header(default="area_director", alias="X-Role"),
    x_scope_id: int | None = Header(default=None, alias="X-Scope-Id"),
) -> RoleScope:
    role = x_role.lower()
    if role not in VALID_ROLES:
        role = "area_director"
    return RoleScope(role=role, scope_id=x_scope_id)
