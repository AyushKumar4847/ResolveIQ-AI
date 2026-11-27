import pytest
from app.services.cache import get_cached_response, set_cached_response, get_redis_client


def test_cache_set_and_get():
    """Test saving an AI answer to Redis and retrieving it."""
    question = "What is ResolveIQ AI?"
    answer = "ResolveIQ is an autonomous AI customer support copilot."
    evidence = "[Manual.pdf | Page 1]"

    # 1. Save to cache
    set_cached_response(question, answer, evidence, ttl_seconds=60)

    # 2. Retrieve from cache
    cached = get_cached_response(question)
    assert cached is not None
    assert cached["answer"] == answer
    assert cached["evidence"] == evidence


def test_cache_normalization():
    """Test that uppercase letters and extra spaces find the exact same cached answer."""
    question1 = "What is AWS S3?"
    question2 = "   what is aws s3?   "
    answer = "S3 is Amazon Simple Storage Service."
    evidence = "[Cloud.pdf | Page 2]"

    # Saved with question1 ("What is AWS S3?")
    set_cached_response(question1, answer, evidence, ttl_seconds=60)

    # Queried with question2 ("   what is aws s3?   ") -> Should HIT the cache!
    cached = get_cached_response(question2)
    assert cached is not None
    assert cached["answer"] == answer
    assert cached["evidence"] == evidence


def test_cache_fallback_when_offline(monkeypatch):
    """Test that if Redis is unavailable, it returns None safely without crashing."""
    # Simulate Redis connection returning None (offline)
    monkeypatch.setattr("app.services.cache.get_redis_client", lambda: None)

    result = get_cached_response("Any question")
    assert result is None
