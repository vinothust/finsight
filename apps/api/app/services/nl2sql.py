import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.llm.base import LLMClient
from app.core.llm.factory import get_llm_client
from app.deps import CurrentUser

SCHEMA_DESCRIPTION = """
Tables:
- accounts(id, name, cluster_id)
- projects(id, name, account_id, status)
- financial_records(id, project_id, period, revenue, cost)
- utilization_records(id, project_id, resource_name, period, allocation_pct, on_bench)
"""

FORBIDDEN_KEYWORDS = ("insert", "update", "delete", "drop", "alter", "create", "truncate", "attach", ";")


class UnsafeSQLError(ValueError):
    pass


def _extract_sql(llm_output: str) -> str:
    match = re.search(r"```sql\s*(.*?)```", llm_output, re.DOTALL | re.IGNORECASE)
    return (match.group(1) if match else llm_output).strip()


def validate_select_only(sql: str) -> str:
    lowered = sql.strip().lower()
    if not lowered.startswith("select"):
        raise UnsafeSQLError("only SELECT statements are allowed")
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in lowered:
            raise UnsafeSQLError(f"disallowed keyword detected: {keyword}")
    return sql.strip()


def question_to_sql(question: str, user: CurrentUser, client: LLMClient) -> str:
    prompt = (
        f"Given this schema:\n{SCHEMA_DESCRIPTION}\n"
        f"Write a single read-only PostgreSQL SELECT statement to answer: {question}\n"
        "Return only the SQL in a ```sql code block."
    )
    if user.role != "admin":
        if user.project_ids:
            ids = ",".join(str(i) for i in user.project_ids)
            prompt += (
                f"\nThe caller's role is {user.role}. Restrict results to project_id IN ({ids}) "
                "wherever the schema allows it."
            )
        else:
            prompt += f"\nThe caller's role is {user.role} and manages no projects; the answer must return no rows."
    raw = client.complete(prompt, system="You only write safe, read-only SQL.", tier="complex")
    return validate_select_only(_extract_sql(raw))


def run_query(db: Session, question: str, user: CurrentUser) -> dict:
    client = get_llm_client(db)
    sql = question_to_sql(question, user, client)
    rows = [dict(row) for row in db.execute(text(sql)).mappings().all()]

    explanation = client.complete(
        f"Question: {question}\nSQL used: {sql}\nResult rows: {rows}\n"
        "Explain the result in 2-3 plain-English sentences.",
        tier="simple",
    )

    return {"sql": sql, "rows": rows, "explanation": explanation}
