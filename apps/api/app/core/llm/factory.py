from sqlalchemy.orm import Session

from app.core.llm.vertex_client import VertexAIClient
from app.services.llm_settings import get_or_create_llm_settings


def get_llm_client(db: Session) -> VertexAIClient:
    row = get_or_create_llm_settings(db)
    return VertexAIClient(
        project=row.gcp_project,
        location=row.gcp_location,
        model_simple=row.model_simple,
        model_complex=row.model_complex,
        model_fallback=row.model_fallback,
    )
