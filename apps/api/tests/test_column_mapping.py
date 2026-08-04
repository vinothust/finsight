from app.services import column_mapping


class FakeClient:
    def __init__(self, response: str) -> None:
        self.response = response
        self.prompts = []

    def complete(self, prompt, system=None, tier="simple"):
        self.prompts.append(prompt)
        return self.response


def test_suggest_column_mapping_returns_valid_llm_mapping(db_session, monkeypatch):
    fake = FakeClient(
        '```json\n{"account_name": "Account", "program_name": "Project", "period": "Date", '
        '"revenue": "Revenue ($)", "cost": "Cost ($)"}\n```'
    )
    monkeypatch.setattr(column_mapping, "get_llm_client", lambda db: fake)

    result = column_mapping.suggest_column_mapping(
        db_session, "financial", ["Account", "Project", "Date", "Revenue ($)", "Cost ($)"]
    )

    assert result == {
        "account_name": "Account",
        "program_name": "Project",
        "period": "Date",
        "revenue": "Revenue ($)",
        "cost": "Cost ($)",
    }


def test_suggest_column_mapping_coerces_hallucinated_header_to_none(db_session, monkeypatch):
    fake = FakeClient('```json\n{"account_name": "Nonexistent Header", "program_name": "Project"}\n```')
    monkeypatch.setattr(column_mapping, "get_llm_client", lambda db: fake)

    result = column_mapping.suggest_column_mapping(db_session, "financial", ["Project"])

    assert result["account_name"] is None
    assert result["program_name"] == "Project"


def test_suggest_column_mapping_falls_back_to_all_none_on_malformed_json(db_session, monkeypatch):
    fake = FakeClient("not json at all")
    monkeypatch.setattr(column_mapping, "get_llm_client", lambda db: fake)

    result = column_mapping.suggest_column_mapping(db_session, "financial", ["Account"])

    assert result == {"account_name": None, "program_name": None, "period": None, "revenue": None, "cost": None}


def test_suggest_column_mapping_uses_simple_tier(db_session, monkeypatch):
    fake = FakeClient('```json\n{"account_name": "Account"}\n```')
    monkeypatch.setattr(column_mapping, "get_llm_client", lambda db: fake)

    column_mapping.suggest_column_mapping(db_session, "financial", ["Account"])

    assert "Account" in fake.prompts[0]
