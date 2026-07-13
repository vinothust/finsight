from app.models.account import Account
from app.models.program import Program


def _seed(db_session):
    a1 = Account(name="Zeta Corp")
    a2 = Account(name="Acme Corp")
    db_session.add_all([a1, a2])
    db_session.flush()

    p1 = Program(name="Beta Program", account_id=a1.id)
    p2 = Program(name="Alpha Program", account_id=a2.id)
    p3 = Program(name="Zed Program", account_id=a1.id)
    db_session.add_all([p1, p2, p3])
    db_session.commit()
    return a1, a2, p1, p2, p3


def test_list_accounts_returns_seeded_accounts_ordered_by_name(client, db_session):
    _seed(db_session)
    response = client.get("/scope-options/accounts")
    assert response.status_code == 200
    body = response.json()
    assert [a["name"] for a in body] == ["Acme Corp", "Zeta Corp"]
    assert all(set(a.keys()) == {"id", "name"} for a in body)


def test_list_programs_without_account_id_returns_all_programs_ordered_by_name(client, db_session):
    _seed(db_session)
    response = client.get("/scope-options/programs")
    assert response.status_code == 200
    body = response.json()
    assert [p["name"] for p in body] == ["Alpha Program", "Beta Program", "Zed Program"]
    assert all(set(p.keys()) == {"id", "name", "account_id"} for p in body)


def test_list_programs_with_account_id_filters_correctly(client, db_session):
    a1, a2, p1, p2, p3 = _seed(db_session)
    response = client.get(f"/scope-options/programs?account_id={a1.id}")
    assert response.status_code == 200
    body = response.json()
    assert [p["name"] for p in body] == ["Beta Program", "Zed Program"]
    assert all(p["account_id"] == a1.id for p in body)
