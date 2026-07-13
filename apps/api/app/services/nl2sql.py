import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.llm.factory import get_llm_client

SCHEMA_DESCRIPTION = """
Tables:
- accounts(id, name, area_director)
- programs(id, name, account_id, program_manager)
- financial_records(id, program_id, period, revenue, cost)
- utilization_records(id, program_id, resource_name, period, allocation_pct, on_bench)
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


def question_to_sql(question: str) -> str:
    client = get_llm_client()
    prompt = (
        f"Given this schema:\n{SCHEMA_DESCRIPTION}\n"
        f"Write a single read-only PostgreSQL SELECT statement to answer: {question}\n"
        "Return only the SQL in a ```sql code block."
    )
    raw = client.complete(prompt, system="You only write safe, read-only SQL.")
    return validate_select_only(_extract_sql(raw))


def run_query(db: Session, question: str) -> dict:
    sql = question_to_sql(question)
    rows = [dict(row) for row in db.execute(text(sql)).mappings().all()]

    client = get_llm_client()
    explanation = client.complete(
        f"Question: {question}\nSQL used: {sql}\nResult rows: {rows}\n"
        "Explain the result in 2-3 plain-English sentences."
    )

    return {"sql": sql, "rows": rows, "explanation": explanation}
