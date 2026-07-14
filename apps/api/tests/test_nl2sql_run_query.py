from app.deps import CurrentUser
from app.models.account import Account
from app.services import nl2sql


class FakeClient:
    def __init__(self, sql_response: str) -> None:
        self.sql_response = sql_response
        self.prompts = []
        self.tiers = []

    def complete(self, prompt, system=None, tier="simple"):
        self.prompts.append(prompt)
        self.tiers.append(tier)
        if "Explain" in prompt:
            return "There is one account named Acme."
        return f"```sql\n{self.sql_response}\n```"


def test_run_query_executes_generated_sql(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: FakeClient("SELECT name FROM accounts"))

    admin = CurrentUser(id=1, email="admin@test.dev", name="Admin", role="admin", project_ids=None)
    result = nl2sql.run_query(db_session, "List all accounts", admin)
    assert result["sql"] == "SELECT name FROM accounts"
    assert result["rows"] == [{"name": "Acme"}]
    assert "Acme" in result["explanation"]


def test_run_query_includes_scoping_hint_in_prompt_for_project_manager_scope(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    pm = CurrentUser(id=2, email="pm@test.dev", name="PM", role="project_manager", project_ids=[5])
    nl2sql.run_query(db_session, "List all accounts", pm)

    sql_prompt = fake_client.prompts[0]
    assert "project_id IN (5)" in sql_prompt


def test_run_query_includes_scoping_hint_in_prompt_for_account_director_scope(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    director = CurrentUser(id=3, email="ad@test.dev", name="AD", role="account_director", project_ids=[7, 8])
    nl2sql.run_query(db_session, "List all accounts", director)

    sql_prompt = fake_client.prompts[0]
    assert "project_id IN (7,8)" in sql_prompt


def test_run_query_omits_scoping_hint_for_admin(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    admin = CurrentUser(id=1, email="admin@test.dev", name="Admin", role="admin", project_ids=None)
    nl2sql.run_query(db_session, "List all accounts", admin)

    sql_prompt = fake_client.prompts[0]
    assert "Restrict results to" not in sql_prompt


def test_run_query_uses_complex_tier_for_sql_and_simple_tier_for_explanation(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    admin = CurrentUser(id=1, email="admin@test.dev", name="Admin", role="admin", project_ids=None)
    nl2sql.run_query(db_session, "List all accounts", admin)

    assert fake_client.tiers == ["complex", "simple"]
