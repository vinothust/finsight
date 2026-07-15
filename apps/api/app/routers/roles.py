from fastapi import APIRouter, Depends

from app.core.roles import ROLE_LABELS
from app.deps import get_current_user

router = APIRouter(prefix="/roles", tags=["roles"], dependencies=[Depends(get_current_user)])


@router.get("")
def list_roles():
    return {"roles": [{"value": value, "label": label} for value, label in ROLE_LABELS.items()]}
