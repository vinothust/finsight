from app.models.account import Account
from app.services import nl2sql


class FakeClient:
    def __init__(self, sql_response: str) -> None:
        self.sql_response = sql_response

    def complete(self, prompt, system=None):
        if "Explain" in prompt:
            return "There is one account named Acme."
        return f"```sql\n{self.sql_response}\n```"


def test_run_query_executes_generated_sql(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    monkeypatch.setattr(nl2sql, "get_llm_client", lambda: FakeClient("SELECT name FROM accounts"))

    result = nl2sql.run_query(db_session, "List all accounts")
    assert result["sql"] == "SELECT name FROM accounts"
    assert result["rows"] == [{"name": "Acme"}]
    assert "Acme" in result["explanation"]
