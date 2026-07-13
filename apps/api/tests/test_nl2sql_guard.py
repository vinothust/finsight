import pytest

from app.services.nl2sql import UnsafeSQLError, _extract_sql, validate_select_only


def test_validate_select_only_accepts_select():
    assert validate_select_only("SELECT * FROM accounts") == "SELECT * FROM accounts"


def test_validate_select_only_rejects_delete():
    with pytest.raises(UnsafeSQLError):
        validate_select_only("DELETE FROM accounts")


def test_validate_select_only_rejects_stacked_statement():
    with pytest.raises(UnsafeSQLError):
        validate_select_only("SELECT * FROM accounts; DROP TABLE accounts")


def test_validate_select_only_rejects_non_select_start():
    with pytest.raises(UnsafeSQLError):
        validate_select_only("UPDATE accounts SET name = 'x'")


def test_extract_sql_pulls_code_block():
    llm_output = "Here you go:\n```sql\nSELECT 1\n```"
    assert _extract_sql(llm_output) == "SELECT 1"


def test_extract_sql_falls_back_to_raw_text_when_no_code_block():
    assert _extract_sql("SELECT 1") == "SELECT 1"
