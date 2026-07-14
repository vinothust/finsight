from sqlalchemy.orm import Session

from app.deps import RoleScope
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.services.dashboard import _scoped_project_ids

MARGIN_GREEN = 0.25
MARGIN_YELLOW = 0.15


def _rag_for_margin(margin: float) -> str:
    if margin >= MARGIN_GREEN:
        return "green"
    if margin >= MARGIN_YELLOW:
        return "yellow"
    return "red"


def project_scorecards(db: Session, scope: RoleScope) -> list[dict]:
    project_ids = _scoped_project_ids(db, scope)
    query = db.query(Project)
    if project_ids is not None:
        query = query.filter(Project.id.in_(project_ids))

    results = []
    for project in query.all():
        records = db.query(FinancialRecord).filter_by(project_id=project.id).all()
        total_revenue = sum(float(r.revenue) for r in records)
        total_cost = sum(float(r.cost) for r in records)
        margin = (total_revenue - total_cost) / total_revenue if total_revenue else 0.0
        results.append(
            {
                "project_id": project.id,
                "project_name": project.name,
                "margin": margin,
                "rag_status": _rag_for_margin(margin),
            }
        )
    return results
