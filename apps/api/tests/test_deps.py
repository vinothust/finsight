import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.core.security import create_access_token, hash_password
from app.deps import ACCESS_TOKEN_COOKIE, get_current_user, require_csrf_header, require_role
from app.models.account import Account
from app.models.associations import AccountDirector, ClusterHead, ProjectManager
from app.models.cluster import Cluster
from app.models.project import Project
from app.models.user import User


def _make_request(method: str = "GET", cookies: dict | None = None, headers: dict | None = None) -> Request:
    raw_headers = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    if cookies:
        cookie_header = "; ".join(f"{k}={v}" for k, v in cookies.items())
        raw_headers.append((b"cookie", cookie_header.encode()))
    scope = {
        "type": "http",
        "method": method,
        "headers": raw_headers,
        "path": "/",
        "query_string": b"",
    }
    return Request(scope)


def _seed_user(db_session, role: str) -> User:
    user = User(name="Test User", email=f"{role}@test.dev", password_hash=hash_password("pw"), role=role)
    db_session.add(user)
    db_session.commit()
    return user


def test_require_csrf_header_allows_get_without_header():
    require_csrf_header(_make_request(method="GET"))  # should not raise


def test_require_csrf_header_rejects_post_without_header():
    with pytest.raises(HTTPException) as exc_info:
        require_csrf_header(_make_request(method="POST"))
    assert exc_info.value.status_code == 403


def test_require_csrf_header_allows_post_with_header():
    require_csrf_header(_make_request(method="POST", headers={"X-Requested-With": "XMLHttpRequest"}))


def test_get_current_user_rejects_missing_cookie(db_session):
    request = _make_request()
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(request=request, db=db_session)
    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_tampered_token(db_session):
    request = _make_request(cookies={ACCESS_TOKEN_COOKIE: "garbage.token.value"})
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(request=request, db=db_session)
    assert exc_info.value.status_code == 401


def test_get_current_user_admin_has_unrestricted_scope(db_session):
    user = _seed_user(db_session, "admin")
    token = create_access_token(user.id)
    request = _make_request(cookies={ACCESS_TOKEN_COOKIE: token})

    current = get_current_user(request=request, db=db_session)
    assert current.role == "admin"
    assert current.project_ids is None


def test_get_current_user_cluster_head_resolves_projects_under_their_clusters(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    account = Account(name="Acme", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()
    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.flush()

    user = _seed_user(db_session, "cluster_head")
    db_session.add(ClusterHead(user_id=user.id, cluster_id=cluster.id))
    db_session.commit()

    token = create_access_token(user.id)
    request = _make_request(cookies={ACCESS_TOKEN_COOKIE: token})

    current = get_current_user(request=request, db=db_session)
    assert current.project_ids == [project.id]


def test_get_current_user_account_director_resolves_projects_under_their_accounts(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    account = Account(name="Acme", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()
    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.flush()

    user = _seed_user(db_session, "account_director")
    db_session.add(AccountDirector(user_id=user.id, account_id=account.id))
    db_session.commit()

    token = create_access_token(user.id)
    request = _make_request(cookies={ACCESS_TOKEN_COOKIE: token})

    current = get_current_user(request=request, db=db_session)
    assert current.project_ids == [project.id]


def test_get_current_user_project_manager_resolves_their_own_projects(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    account = Account(name="Acme", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()
    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.flush()

    user = _seed_user(db_session, "project_manager")
    db_session.add(ProjectManager(user_id=user.id, project_id=project.id))
    db_session.commit()

    token = create_access_token(user.id)
    request = _make_request(cookies={ACCESS_TOKEN_COOKIE: token})

    current = get_current_user(request=request, db=db_session)
    assert current.project_ids == [project.id]


def test_require_role_rejects_wrong_role(db_session):
    user = _seed_user(db_session, "project_manager")
    token = create_access_token(user.id)
    request = _make_request(cookies={ACCESS_TOKEN_COOKIE: token})
    current = get_current_user(request=request, db=db_session)

    checker = require_role("admin")
    with pytest.raises(HTTPException) as exc_info:
        checker(user=current)
    assert exc_info.value.status_code == 403


def test_require_role_allows_matching_role(db_session):
    user = _seed_user(db_session, "admin")
    token = create_access_token(user.id)
    request = _make_request(cookies={ACCESS_TOKEN_COOKIE: token})
    current = get_current_user(request=request, db=db_session)

    checker = require_role("admin")
    assert checker(user=current) is current
