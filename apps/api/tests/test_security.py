from datetime import datetime, timedelta

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_hash_password_round_trip():
    password_hash = hash_password("correct horse battery staple")
    assert verify_password("correct horse battery staple", password_hash)
    assert not verify_password("wrong password", password_hash)


def test_create_access_token_decodes_with_correct_subject():
    token = create_access_token(subject=42)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["type"] == "access"


def test_create_refresh_token_returns_token_and_expiry():
    token, expires_at = create_refresh_token(subject=7)
    payload = decode_token(token)
    assert payload["sub"] == "7"
    assert payload["type"] == "refresh"
    assert expires_at > datetime.utcnow() + timedelta(days=6)


def test_decode_token_rejects_garbage():
    assert decode_token("not-a-real-token") is None


def test_create_refresh_token_is_unique_even_for_same_subject_in_same_second():
    token_a, _ = create_refresh_token(subject=1)
    token_b, _ = create_refresh_token(subject=1)
    assert token_a != token_b
