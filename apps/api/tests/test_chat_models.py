from app.core.security import hash_password
from app.models.chat import ChatMessage, Conversation
from app.models.user import User


def test_conversation_holds_ordered_chat_messages(db_session):
    user = User(name="Test User", email="user@test.dev", password_hash=hash_password("pw"), role="project_manager")
    db_session.add(user)
    db_session.flush()

    conversation = Conversation(user_id=user.id)
    db_session.add(conversation)
    db_session.flush()

    db_session.add_all(
        [
            ChatMessage(conversation_id=conversation.id, role="user", content="List all accounts"),
            ChatMessage(conversation_id=conversation.id, role="assistant", content="There is one account: Acme."),
        ]
    )
    db_session.commit()

    messages = (
        db_session.query(ChatMessage).filter_by(conversation_id=conversation.id).order_by(ChatMessage.id).all()
    )
    assert [m.role for m in messages] == ["user", "assistant"]
    assert conversation.user_id == user.id
