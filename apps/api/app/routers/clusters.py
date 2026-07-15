from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import require_role
from app.schemas.cluster import ClusterCreate, ClusterUpdate
from app.services import clusters as cluster_service

router = APIRouter(prefix="/clusters", tags=["clusters"], dependencies=[Depends(require_role("admin"))])


@router.get("")
def list_clusters(search: str | None = None, page: int = 1, page_size: int = 50, db: Session = Depends(get_db)):
    items, total = cluster_service.list_clusters(db, search, page, page_size)
    return {"clusters": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{cluster_id}")
def get_cluster(cluster_id: int, db: Session = Depends(get_db)):
    return {"cluster": cluster_service.get_cluster(db, cluster_id)}


@router.post("", status_code=201)
def create_cluster(payload: ClusterCreate, db: Session = Depends(get_db)):
    return {"cluster": cluster_service.create_cluster(db, payload.name, payload.description, None)}


@router.patch("/{cluster_id}")
def update_cluster(cluster_id: int, payload: ClusterUpdate, db: Session = Depends(get_db)):
    return {
        "cluster": cluster_service.update_cluster(db, cluster_id, payload.name, payload.description, payload.heads)
    }


@router.delete("/{cluster_id}")
def delete_cluster(cluster_id: int, db: Session = Depends(get_db)):
    cluster_service.delete_cluster(db, cluster_id)
    return {"success": True, "message": "cluster deleted"}
