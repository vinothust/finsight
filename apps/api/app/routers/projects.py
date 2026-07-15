from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import require_role
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services import projects as project_service

router = APIRouter(prefix="/projects", tags=["projects"], dependencies=[Depends(require_role("admin"))])


@router.get("")
def list_projects(
    account_id: int | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    items, total = project_service.list_projects(db, account_id, search, page, page_size)
    return {"projects": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    return {"project": project_service.get_project(db, project_id)}


@router.post("", status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    return {
        "project": project_service.create_project(db, payload.name, payload.account_id, payload.status, payload.managers)
    }


@router.patch("/{project_id}")
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    return {
        "project": project_service.update_project(
            db, project_id, payload.name, payload.account_id, payload.status, payload.managers
        )
    }


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project_service.delete_project(db, project_id)
    return {"success": True, "message": "project deleted"}
