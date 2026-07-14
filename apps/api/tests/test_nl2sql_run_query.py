from app.deps import RoleScope
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

    result = nl2sql.run_query(db_session, "List all accounts", RoleScope(role="area_director"))
    assert result["sql"] == "SELECT name FROM accounts"
    assert result["rows"] == [{"name": "Acme"}]
    assert "Acme" in result["explanation"]


def test_run_query_includes_scoping_hint_in_prompt_for_pm_scope(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    nl2sql.run_query(db_session, "List all accounts", RoleScope(role="pm", scope_id=5))

    sql_prompt = fake_client.prompts[0]
    assert "project_id = 5" in sql_prompt


def test_run_query_includes_scoping_hint_in_prompt_for_account_director_scope(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    nl2sql.run_query(db_session, "List all accounts", RoleScope(role="account_director", scope_id=7))

    sql_prompt = fake_client.prompts[0]
    assert "account_id = 7" in sql_prompt


def test_run_query_omits_scoping_hint_for_area_director(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    nl2sql.run_query(db_session, "List all accounts", RoleScope(role="area_director"))

    sql_prompt = fake_client.prompts[0]
    assert "Restrict results to" not in sql_prompt


def test_run_query_uses_complex_tier_for_sql_and_simple_tier_for_explanation(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient("SELECT name FROM accounts")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    nl2sql.run_query(db_session, "List all accounts", RoleScope(role="area_director"))

    assert fake_client.tiers == ["complex", "simple"]
