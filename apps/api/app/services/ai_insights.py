from sqlalchemy.orm import Session

from app.core.llm.factory import get_llm_client
from app.deps import CurrentUser
from app.services import pnl as pnl_service

METRIC_TITLES = {
    "revenue": "Revenue Trend",
    "margin": "Margin Trend",
    "utilization": "Utilization Trend",
}


def _revenue_change(trend: list[dict]) -> float:
    if len(trend) < 2:
        return 0.0
    previous, last = trend[-2], trend[-1]
    return (last["revenue"] - previous["revenue"]) / previous["revenue"] if previous["revenue"] else 0.0


def _margin_change(trend: list[dict]) -> float:
    if len(trend) < 2:
        return 0.0
    previous, last = trend[-2], trend[-1]
    prev_margin = previous["profit"] / previous["revenue"] if previous["revenue"] else 0.0
    last_margin = last["profit"] / last["revenue"] if last["revenue"] else 0.0
    return last_margin - prev_margin


def _utilization_change(trend: list[dict]) -> float:
    if len(trend) < 2:
        return 0.0
    previous, last = trend[-2], trend[-1]
    return last["utilization"] - previous["utilization"]


def _describe(client, metric: str, change: float, trend: list[dict]) -> str:
    prompt = (
        f"The {metric} trend data (chronological, oldest first) is: {trend}\n"
        f"The most recent period-over-period change is {change}.\n"
        "Write one concise sentence describing this trend for a financial analyst."
    )
    return client.complete(prompt, system="Be concise and specific with numbers.", tier="simple")


def generate_insights(
    db: Session,
    user: CurrentUser,
    cluster_ids: list[int] | None,
    account_ids: list[int] | None,
    years: list[int] | None,
    months: list[int] | None,
    focus_area: str | None,
) -> list[dict]:
    client = get_llm_client(db)
    metrics = [focus_area] if focus_area else ["revenue", "margin", "utilization"]

    revenue_trend: list[dict] | None = None
    utilization_trend: list[dict] | None = None
    insights = []
    for metric in metrics:
        if metric in ("revenue", "margin"):
            if revenue_trend is None:
                revenue_trend = pnl_service.get_revenue_trend(db, user, cluster_ids, account_ids, None, years)
            trend = revenue_trend
            change = _revenue_change(trend) if metric == "revenue" else _margin_change(trend)
        else:
            if utilization_trend is None:
                utilization_trend = pnl_service.get_utilization_trend(db, user, cluster_ids, account_ids, years)
            trend = utilization_trend
            change = _utilization_change(trend)

        description = _describe(client, metric, change, trend)
        insights.append({"title": METRIC_TITLES[metric], "description": description, "metric": metric, "change": change})
    return insights
