from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.associations import ClusterHead
from app.models.cluster import Cluster
from app.models.user import User
from app.services.assignments import sync_assignment


def _cluster_detail(db: Session, cluster: Cluster) -> dict:
    accounts = db.query(Account).filter_by(cluster_id=cluster.id).order_by(Account.name).all()
    head_ids = [row.user_id for row in db.query(ClusterHead).filter_by(cluster_id=cluster.id).all()]
    heads = db.query(User).filter(User.id.in_(head_ids)).all() if head_ids else []
    return {
        "id": cluster.id,
        "name": cluster.name,
        "description": cluster.description,
        "accounts": [{"id": a.id, "name": a.name} for a in accounts],
        "heads": [{"id": u.id, "name": u.name, "email": u.email} for u in heads],
    }


def list_clusters(db: Session, search: str | None, page: int, page_size: int) -> tuple[list[dict], int]:
    query = db.query(Cluster)
    if search:
        query = query.filter(Cluster.name.ilike(f"%{search}%"))
    total = query.count()
    clusters = query.order_by(Cluster.name).offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for cluster in clusters:
        account_count = db.query(Account).filter_by(cluster_id=cluster.id).count()
        items.append(
            {"id": cluster.id, "name": cluster.name, "description": cluster.description, "account_count": account_count}
        )
    return items, total


def get_cluster(db: Session, cluster_id: int) -> dict:
    cluster = db.get(Cluster, cluster_id)
    if cluster is None:
        raise HTTPException(status_code=404, detail="cluster not found")
    return _cluster_detail(db, cluster)


def create_cluster(db: Session, name: str, description: str | None, heads: list[int] | None) -> dict:
    cluster = Cluster(name=name, description=description)
    db.add(cluster)
    db.flush()
    if heads:
        sync_assignment(db, ClusterHead, "cluster_id", cluster.id, heads, "cluster_head")
    db.commit()
    return _cluster_detail(db, cluster)


def update_cluster(
    db: Session, cluster_id: int, name: str | None, description: str | None, heads: list[int] | None
) -> dict:
    cluster = db.get(Cluster, cluster_id)
    if cluster is None:
        raise HTTPException(status_code=404, detail="cluster not found")
    if name is not None:
        cluster.name = name
    if description is not None:
        cluster.description = description
    if heads is not None:
        sync_assignment(db, ClusterHead, "cluster_id", cluster.id, heads, "cluster_head")
    db.commit()
    return _cluster_detail(db, cluster)


def delete_cluster(db: Session, cluster_id: int) -> None:
    cluster = db.get(Cluster, cluster_id)
    if cluster is None:
        raise HTTPException(status_code=404, detail="cluster not found")
    if db.query(Account).filter_by(cluster_id=cluster_id).count() > 0:
        raise HTTPException(status_code=409, detail="cluster has accounts; remove them first")
    db.query(ClusterHead).filter_by(cluster_id=cluster_id).delete()
    db.delete(cluster)
    db.commit()
