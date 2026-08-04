import json
import re

from sqlalchemy.orm import Session

from app.core.llm.factory import get_llm_client

CANONICAL_FIELDS = {
    "financial": ["account_name", "program_name", "period", "revenue", "cost"],
    "utilization": ["program_name", "resource_name", "period", "allocation_pct", "on_bench"],
}


def _extract_json(llm_output: str) -> str:
    match = re.search(r"```json\s*(.*?)```", llm_output, re.DOTALL | re.IGNORECASE)
    return (match.group(1) if match else llm_output).strip()


def suggest_column_mapping(db: Session, dataset: str, source_columns: list[str]) -> dict[str, str | None]:
    canonical = CANONICAL_FIELDS[dataset]
    prompt = (
        f"A spreadsheet has these column headers: {source_columns}\n"
        f"Map each of these required fields to the header that best matches it: {canonical}\n"
        "Return ONLY a JSON object mapping each required field name to the matching header "
        "(or null if none of the headers match), in a ```json code block. "
        f'Example: {{"{canonical[0]}": "<matching header or null>"}}'
    )
    client = get_llm_client(db)
    raw = client.complete(
        prompt, system="You map spreadsheet headers to a fixed schema. Reply with JSON only.", tier="simple"
    )

    try:
        parsed = json.loads(_extract_json(raw))
    except (json.JSONDecodeError, TypeError):
        return {field: None for field in canonical}

    if not isinstance(parsed, dict):
        return {field: None for field in canonical}

    return {
        field: parsed.get(field)
        if isinstance(parsed.get(field), str) and parsed.get(field) in source_columns
        else None
        for field in canonical
    }
