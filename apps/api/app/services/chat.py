from datetime import datetime

from sqlalchemy.orm import Session

from app.deps import CurrentUser
from app.models.chat import ChatMessage, Conversation
from app.services import nl2sql


class ConversationNotFoundError(Exception):
    pass


def _load_or_create_conversation(db: Session, user: CurrentUser, conversation_id: int | None) -> Conversation:
    if conversation_id is None:
        conversation = Conversation(user_id=user.id)
        db.add(conversation)
        db.flush()
        return conversation

    conversation = db.get(Conversation, conversation_id)
    if conversation is None or (conversation.user_id != user.id and user.role != "admin"):
        raise ConversationNotFoundError()
    return conversation


def _augmented_question(db: Session, conversation: Conversation, question: str) -> str:
    history = (
        db.query(ChatMessage).filter_by(conversation_id=conversation.id).order_by(ChatMessage.id).all()
    )
    if not history:
        return question
    lines = [f"{m.role}: {m.content}" for m in history]
    lines.append(f"user: {question}")
    return "\n".join(lines)


def send_chat_message(db: Session, user: CurrentUser, conversation_id: int | None, question: str) -> dict:
    conversation = _load_or_create_conversation(db, user, conversation_id)
    augmented_question = _augmented_question(db, conversation, question)

    db.add(ChatMessage(conversation_id=conversation.id, role="user", content=question))
    result = nl2sql.run_query(db, augmented_question, user)
    db.add(ChatMessage(conversation_id=conversation.id, role="assistant", content=result["explanation"]))
    conversation.updated_at = datetime.utcnow()
    db.commit()

    return {"response": result["explanation"], "conversation_id": conversation.id, "timestamp": conversation.updated_at}


def get_conversation(db: Session, user: CurrentUser, conversation_id: int) -> dict:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or (conversation.user_id != user.id and user.role != "admin"):
        raise ConversationNotFoundError()

    messages = (
        db.query(ChatMessage).filter_by(conversation_id=conversation.id).order_by(ChatMessage.id).all()
    )
    return {
        "messages": [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages],
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
    }
