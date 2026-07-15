import pytest
from fastapi import HTTPException

from app.core.security import hash_password
from app.models.associations import ClusterHead
from app.models.cluster import Cluster
from app.models.user import User
from app.services.assignments import sync_assignment


def _make_user(db_session, role="cluster_head", email="head@test.dev"):
    user = User(name="Test Head", email=email, password_hash=hash_password("pw"), role=role)
    db_session.add(user)
    db_session.flush()
    return user


def test_sync_assignment_adds_rows(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    user = _make_user(db_session)
    db_session.commit()

    sync_assignment(db_session, ClusterHead, "cluster_id", cluster.id, [user.id], "cluster_head")
    db_session.commit()

    assert db_session.query(ClusterHead).filter_by(cluster_id=cluster.id).count() == 1


def test_sync_assignment_replaces_existing_rows(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    user1 = _make_user(db_session, email="head1@test.dev")
    user2 = _make_user(db_session, email="head2@test.dev")
    db_session.commit()

    sync_assignment(db_session, ClusterHead, "cluster_id", cluster.id, [user1.id], "cluster_head")
    db_session.commit()
    sync_assignment(db_session, ClusterHead, "cluster_id", cluster.id, [user2.id], "cluster_head")
    db_session.commit()

    rows = db_session.query(ClusterHead).filter_by(cluster_id=cluster.id).all()
    assert [r.user_id for r in rows] == [user2.id]


def test_sync_assignment_empty_list_clears_assignment(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    user = _make_user(db_session)
    db_session.commit()

    sync_assignment(db_session, ClusterHead, "cluster_id", cluster.id, [user.id], "cluster_head")
    db_session.commit()
    sync_assignment(db_session, ClusterHead, "cluster_id", cluster.id, [], "cluster_head")
    db_session.commit()

    assert db_session.query(ClusterHead).filter_by(cluster_id=cluster.id).count() == 0


def test_sync_assignment_rejects_unknown_user_id(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        sync_assignment(db_session, ClusterHead, "cluster_id", cluster.id, [999], "cluster_head")
    assert exc_info.value.status_code == 400


def test_sync_assignment_rejects_role_mismatch(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    wrong_role_user = _make_user(db_session, role="project_manager", email="pm@test.dev")
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        sync_assignment(db_session, ClusterHead, "cluster_id", cluster.id, [wrong_role_user.id], "cluster_head")
    assert exc_info.value.status_code == 400
