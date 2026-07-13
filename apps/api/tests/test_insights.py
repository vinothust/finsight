from app.deps import RoleScope
from app.services import insights


class FakeClient:
    def complete(self, prompt, system=None):
        return "Revenue grew steadily with stable margins."


def test_generate_narrative_uses_llm_client(db_session, monkeypatch):
    monkeypatch.setattr(insights, "get_llm_client", lambda: FakeClient())
    result = insights.generate_narrative(db_session, RoleScope(role="area_director"))
    assert "Revenue grew" in result
