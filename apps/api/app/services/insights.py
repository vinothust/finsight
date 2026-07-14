from sqlalchemy.orm import Session

from app.core.llm.factory import get_llm_client
from app.deps import CurrentUser
from app.services.dashboard import revenue_margin_summary, utilization_summary


def generate_narrative(db: Session, user: CurrentUser) -> str:
    revenue = revenue_margin_summary(db, user)
    utilization = utilization_summary(db, user)

    prompt = (
        "You are a financial analyst for a services company. "
        "Summarize the trend and flag risks in 3-4 sentences.\n\n"
        f"Revenue/margin by period: {revenue}\n"
        f"Utilization by period: {utilization}"
    )
    client = get_llm_client(db)
    return client.complete(prompt, system="Be concise and specific with numbers.", tier="simple")
