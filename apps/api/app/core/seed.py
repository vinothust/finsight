from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.account import Account
from app.models.associations import AccountDirector, ClusterHead, ProjectManager
from app.models.cluster import Cluster
from app.models.project import Project
from app.models.user import User

DEV_PASSWORD = "DevPassword123!"

SEED_USERS = [
    {"name": "Ada Admin", "email": "admin@finsight.dev", "role": "admin"},
    {"name": "Cara Clusterhead", "email": "clusterhead@finsight.dev", "role": "cluster_head"},
    {"name": "Deval Director", "email": "director@finsight.dev", "role": "account_director"},
    {"name": "Priya Manager", "email": "pm@finsight.dev", "role": "project_manager"},
]


def run_seed(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    cluster = Cluster(name="North America", description="Seed cluster")
    db.add(cluster)
    db.flush()

    account = Account(name="Acme Corp", cluster_id=cluster.id)
    db.add(account)
    db.flush()

    project = Project(name="Modernization", account_id=account.id)
    db.add(project)
    db.flush()

    users: dict[str, User] = {}
    for spec in SEED_USERS:
        user = User(name=spec["name"], email=spec["email"], password_hash=hash_password(DEV_PASSWORD), role=spec["role"])
        db.add(user)
        db.flush()
        users[spec["role"]] = user

    db.add(ClusterHead(user_id=users["cluster_head"].id, cluster_id=cluster.id))
    db.add(AccountDirector(user_id=users["account_director"].id, account_id=account.id))
    db.add(ProjectManager(user_id=users["project_manager"].id, project_id=project.id))
    db.commit()


if __name__ == "__main__":
    session = SessionLocal()
    try:
        run_seed(session)
    finally:
        session.close()
