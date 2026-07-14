from app.deps import CurrentUser
from app.services import insights


class FakeClient:
    def complete(self, prompt, system=None, tier="simple"):
        return "Revenue grew steadily with stable margins."


def test_generate_narrative_uses_llm_client(db_session, monkeypatch):
    monkeypatch.setattr(insights, "get_llm_client", lambda db: FakeClient())
    admin = CurrentUser(id=1, email="admin@test.dev", name="Admin", role="admin", project_ids=None)
    result = insights.generate_narrative(db_session, admin)
    assert "Revenue grew" in result
