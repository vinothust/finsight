import pytest

from app.core.security import hash_password
from app.deps import CurrentUser
from app.models.account import Account
from app.models.chat import ChatMessage, Conversation
from app.models.user import User
from app.services import chat, nl2sql


class FakeClient:
    def __init__(self):
        self.prompts = []

    def complete(self, prompt, system=None, tier="simple"):
        self.prompts.append(prompt)
        if "Explain" in prompt:
            return "There is one account named Acme."
        return "```sql\nSELECT name FROM accounts\n```"


def _seed_user(db_session, role="admin", email="user@test.dev") -> User:
    user = User(name="Test User", email=email, password_hash=hash_password("pw"), role=role)
    db_session.add(user)
    db_session.commit()
    return user


def test_send_chat_message_creates_conversation_and_messages(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient()
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    user = _seed_user(db_session)
    current = CurrentUser(id=user.id, email=user.email, name=user.name, role="admin", project_ids=None)

    result = chat.send_chat_message(db_session, current, None, "List all accounts")
    assert result["response"] == "There is one account named Acme."
    conversation_id = result["conversation_id"]

    messages = (
        db_session.query(ChatMessage).filter_by(conversation_id=conversation_id).order_by(ChatMessage.id).all()
    )
    assert [m.role for m in messages] == ["user", "assistant"]
    assert messages[0].content == "List all accounts"


def test_send_chat_message_includes_prior_turns_in_augmented_question(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    fake_client = FakeClient()
    monkeypatch.setattr(nl2sql, "get_llm_client", lambda db: fake_client)

    user = _seed_user(db_session)
    current = CurrentUser(id=user.id, email=user.email, name=user.name, role="admin", project_ids=None)

    first = chat.send_chat_message(db_session, current, None, "List all accounts")
    chat.send_chat_message(db_session, current, first["conversation_id"], "What about their margins?")

    second_turn_sql_prompt = fake_client.prompts[2]  # 3rd complete() call = SQL-gen prompt for 2nd turn
    assert "List all accounts" in second_turn_sql_prompt
    assert "What about their margins?" in second_turn_sql_prompt


def test_send_chat_message_raises_for_unknown_conversation(db_session):
    user = _seed_user(db_session)
    current = CurrentUser(id=user.id, email=user.email, name=user.name, role="admin", project_ids=None)

    with pytest.raises(chat.ConversationNotFoundError):
        chat.send_chat_message(db_session, current, 999, "question")


def test_get_conversation_denies_non_owner_non_admin(db_session):
    owner = _seed_user(db_session, role="project_manager", email="owner@test.dev")
    other = _seed_user(db_session, role="project_manager", email="other@test.dev")

    conversation = Conversation(user_id=owner.id)
    db_session.add(conversation)
    db_session.commit()

    other_user = CurrentUser(id=other.id, email=other.email, name=other.name, role="project_manager", project_ids=[])

    with pytest.raises(chat.ConversationNotFoundError):
        chat.get_conversation(db_session, other_user, conversation.id)


def test_get_conversation_allows_admin(db_session):
    owner = _seed_user(db_session, role="project_manager", email="owner@test.dev")
    admin = _seed_user(db_session, role="admin", email="admin@test.dev")

    conversation = Conversation(user_id=owner.id)
    db_session.add(conversation)
    db_session.flush()
    db_session.add(ChatMessage(conversation_id=conversation.id, role="user", content="hi"))
    db_session.commit()

    admin_user = CurrentUser(id=admin.id, email=admin.email, name=admin.name, role="admin", project_ids=None)
    result = chat.get_conversation(db_session, admin_user, conversation.id)
    assert result["messages"][0]["content"] == "hi"
