from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.services.pnl_export import FINANCIAL_TEMPLATE_COLUMNS, UTILIZATION_TEMPLATE_COLUMNS, build_template

router = APIRouter(prefix="/templates", tags=["templates"], dependencies=[Depends(get_current_user)])


@router.get("/pnl")
def get_pnl_template():
    return build_template(FINANCIAL_TEMPLATE_COLUMNS, "pnl_template.xlsx")


@router.get("/utilization")
def get_utilization_template():
    return build_template(UTILIZATION_TEMPLATE_COLUMNS, "utilization_template.xlsx")
