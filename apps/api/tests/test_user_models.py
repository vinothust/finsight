from datetime import datetime, timedelta

from app.models.account import Account
from app.models.associations import AccountDirector, ClusterHead, ProjectManager
from app.models.cluster import Cluster
from app.models.project import Project
from app.models.refresh_token import RefreshToken
from app.models.user import User


def test_user_can_be_linked_to_cluster_account_and_project_via_join_tables(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()

    account = Account(name="Acme Corp", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()

    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.flush()

    head = User(name="Cara Clusterhead", email="cara@finsight.dev", password_hash="x", role="cluster_head")
    director = User(name="Deval Director", email="deval@finsight.dev", password_hash="x", role="account_director")
    manager = User(name="Priya Manager", email="priya@finsight.dev", password_hash="x", role="project_manager")
    db_session.add_all([head, director, manager])
    db_session.flush()

    db_session.add_all(
        [
            ClusterHead(user_id=head.id, cluster_id=cluster.id),
            AccountDirector(user_id=director.id, account_id=account.id),
            ProjectManager(user_id=manager.id, project_id=project.id),
        ]
    )
    db_session.commit()

    assert db_session.query(ClusterHead).filter_by(user_id=head.id).first().cluster_id == cluster.id
    assert db_session.query(AccountDirector).filter_by(user_id=director.id).first().account_id == account.id
    assert db_session.query(ProjectManager).filter_by(user_id=manager.id).first().project_id == project.id


def test_refresh_token_tracks_revocation(db_session):
    user = User(name="Ada Admin", email="ada@finsight.dev", password_hash="x", role="admin")
    db_session.add(user)
    db_session.flush()

    token = RefreshToken(
        user_id=user.id,
        token_hash="hash-value",
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db_session.add(token)
    db_session.commit()

    assert token.revoked_at is None
    token.revoked_at = datetime.utcnow()
    db_session.commit()
    assert db_session.query(RefreshToken).filter_by(id=token.id).first().revoked_at is not None
