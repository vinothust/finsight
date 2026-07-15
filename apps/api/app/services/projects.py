from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.associations import ProjectManager
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.user import User
from app.models.utilization_record import UtilizationRecord
from app.services.assignments import sync_assignment


def _project_detail(db: Session, project: Project) -> dict:
    manager_ids = [row.user_id for row in db.query(ProjectManager).filter_by(project_id=project.id).all()]
    managers = db.query(User).filter(User.id.in_(manager_ids)).all() if manager_ids else []
    return {
        "id": project.id,
        "name": project.name,
        "account_id": project.account_id,
        "status": project.status,
        "managers": [{"id": u.id, "name": u.name, "email": u.email} for u in managers],
    }


def list_projects(
    db: Session, account_id: int | None, search: str | None, page: int, page_size: int
) -> tuple[list[dict], int]:
    query = db.query(Project)
    if account_id is not None:
        query = query.filter(Project.account_id == account_id)
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
    total = query.count()
    projects = query.order_by(Project.name).offset((page - 1) * page_size).limit(page_size).all()
    items = [{"id": p.id, "name": p.name, "account_id": p.account_id, "status": p.status} for p in projects]
    return items, total


def get_project(db: Session, project_id: int) -> dict:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    return _project_detail(db, project)


def create_project(
    db: Session, name: str, account_id: int, status: str | None, managers: list[int] | None
) -> dict:
    if db.get(Account, account_id) is None:
        raise HTTPException(status_code=404, detail="account not found")
    project = Project(name=name, account_id=account_id)
    if status is not None:
        project.status = status
    db.add(project)
    db.flush()
    if managers:
        sync_assignment(db, ProjectManager, "project_id", project.id, managers, "project_manager")
    db.commit()
    return _project_detail(db, project)


def update_project(
    db: Session,
    project_id: int,
    name: str | None,
    account_id: int | None,
    status: str | None,
    managers: list[int] | None,
) -> dict:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    if account_id is not None:
        if db.get(Account, account_id) is None:
            raise HTTPException(status_code=404, detail="account not found")
        project.account_id = account_id
    if name is not None:
        project.name = name
    if status is not None:
        project.status = status
    if managers is not None:
        sync_assignment(db, ProjectManager, "project_id", project.id, managers, "project_manager")
    db.commit()
    return _project_detail(db, project)


def delete_project(db: Session, project_id: int) -> None:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    has_financial = db.query(FinancialRecord).filter_by(project_id=project_id).count() > 0
    has_utilization = db.query(UtilizationRecord).filter_by(project_id=project_id).count() > 0
    if has_financial or has_utilization:
        raise HTTPException(status_code=409, detail="project has financial/utilization records; remove them first")
    db.query(ProjectManager).filter_by(project_id=project_id).delete()
    db.delete(project)
    db.commit()
