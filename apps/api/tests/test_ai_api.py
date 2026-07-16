from datetime import date

from app.core.security import hash_password
from app.models.account import Account
from app.models.chat import Conversation
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.user import User
from app.services import ai_insights, nl2sql

CSRF = {"X-Requested-With": "XMLHttpRequest"}


class FakeClient:
    def complete(self, prompt, system=None, tier="simple"):
        if "Explain" in prompt:
            return "There is one account named Acme."
        if "Write a single read-only" in prompt:
            return "```sql\nSELECT name FROM accounts\n```"
        return "Revenue looks healthy."


def test_post_chat_requires_authentication(client):
    response = client.post("/ai/chat", json={"messages": [{"role": "user", "content": "hi"}]}, headers=CSRF)
    assert response.status_code == 401


def test_post_chat_creates_conversation(authed_client, db_session, monkeypatch):
    client, _ = authed_client(role="admin")
    db_session.add(Account(name="Acme"))
    db_session.commit()
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: FakeClient())

    response = client.post(
        "/ai/chat",
        json={"messages": [{"role": "user", "content": "List all accounts"}]},
        headers=CSRF,
    )
    assert response.status_code == 200
    body = response.json()
    assert "conversation_id" in body
    assert body["response"] == "There is one account named Acme."


def test_post_chat_returns_404_for_unknown_conversation_id(authed_client, monkeypatch):
    client, _ = authed_client(role="admin")
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: FakeClient())

    response = client.post(
        "/ai/chat",
        json={"messages": [{"role": "user", "content": "hi"}], "conversation_id": 999},
        headers=CSRF,
    )
    assert response.status_code == 404


def test_get_conversation_requires_authentication(client):
    response = client.get("/ai/conversation/1")
    assert response.status_code == 401


def test_get_conversation_admin_can_view_others(authed_client, db_session):
    owner = User(name="Owner", email="owner@test.dev", password_hash=hash_password("pw"), role="project_manager")
    db_session.add(owner)
    db_session.flush()
    conversation = Conversation(user_id=owner.id)
    db_session.add(conversation)
    db_session.commit()

    client, _ = authed_client(role="admin")
    response = client.get(f"/ai/conversation/{conversation.id}")
    assert response.status_code == 200


def test_get_conversation_denies_non_owner_non_admin(authed_client, db_session):
    owner = User(name="Owner", email="owner2@test.dev", password_hash=hash_password("pw"), role="project_manager")
    db_session.add(owner)
    db_session.flush()
    conversation = Conversation(user_id=owner.id)
    db_session.add(conversation)
    db_session.commit()

    client, _ = authed_client(role="project_manager", email="stranger@test.dev")
    response = client.get(f"/ai/conversation/{conversation.id}")
    assert response.status_code == 404


def test_post_insights_requires_authentication(client):
    response = client.post("/ai/insights", json={}, headers=CSRF)
    assert response.status_code == 401


def test_post_insights_returns_cards(authed_client, db_session, monkeypatch):
    client, _ = authed_client(role="admin")
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    account = Account(name="Acme Corp", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()
    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.flush()
    db_session.add(FinancialRecord(project_id=project.id, period=date(2026, 1, 1), revenue=100000, cost=70000))
    db_session.commit()

    monkeypatch.setattr(ai_insights, "get_llm_client", lambda db: FakeClient())

    response = client.post("/ai/insights", json={"focus_area": "revenue"}, headers=CSRF)
    assert response.status_code == 200
    body = response.json()
    assert body["insights"][0]["metric"] == "revenue"
