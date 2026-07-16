from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import CurrentUser, get_current_user
from app.services import ai_insights, chat

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessageIn(BaseModel):
    role: str
    content: str


class FiltersIn(BaseModel):
    cluster_ids: list[int] | None = None
    account_ids: list[int] | None = None
    project_ids: list[int] | None = None
    years: list[int] | None = None
    months: list[int] | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn]
    filters: FiltersIn | None = None  # accepted for contract compatibility; not yet applied to the NL2SQL prompt
    conversation_id: int | None = None


class InsightsRequest(BaseModel):
    filters: FiltersIn | None = None
    focus_area: str | None = None


@router.post("/chat")
def post_chat(payload: ChatRequest, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    user_messages = [m for m in payload.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="messages must include at least one user message")
    question = user_messages[-1].content

    try:
        return chat.send_chat_message(db, user, payload.conversation_id, question)
    except chat.ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="conversation not found") from exc


@router.get("/conversation/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    try:
        return chat.get_conversation(db, user, conversation_id)
    except chat.ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="conversation not found") from exc


@router.post("/insights")
def post_insights(payload: InsightsRequest, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    filters = payload.filters or FiltersIn()
    insights = ai_insights.generate_insights(
        db, user, filters.cluster_ids, filters.account_ids, filters.years, filters.months, payload.focus_area
    )
    return {"insights": insights, "generated_at": datetime.utcnow()}
