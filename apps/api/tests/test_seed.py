from app.core.security import verify_password
from app.core.seed import run_seed
from app.models.associations import AccountDirector, ClusterHead, ProjectManager
from app.models.user import User


def test_run_seed_creates_one_user_per_role_with_working_passwords(db_session):
    run_seed(db_session)

    users = {u.role: u for u in db_session.query(User).all()}
    assert set(users) == {"admin", "cluster_head", "account_director", "project_manager"}
    assert verify_password("DevPassword123!", users["admin"].password_hash)

    assert db_session.query(ClusterHead).filter_by(user_id=users["cluster_head"].id).first() is not None
    assert db_session.query(AccountDirector).filter_by(user_id=users["account_director"].id).first() is not None
    assert db_session.query(ProjectManager).filter_by(user_id=users["project_manager"].id).first() is not None


def test_run_seed_is_idempotent(db_session):
    run_seed(db_session)
    run_seed(db_session)
    assert db_session.query(User).count() == 4
