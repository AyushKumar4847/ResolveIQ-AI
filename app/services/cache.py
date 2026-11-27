import redis
import json
from app.core.config import settings


def get_redis_client():
    """Connects to Redis. If Redis is down,
      returns None so our app doesn't crash."""

    try:
        return redis.from_url(settings.REDIS_URL,decode_responses=True)
    except Exception:
        return None

def get_cached_response(question: str):
    """Checks Redis for an existing answer. Returns dict or None."""
    r = get_redis_client()

    if not r:
        return None

    try:
        key= f"faq:{question.strip().lower()}"
        cached= r.get(key)
        if cached:
            return json.loads(cached) # Converts JSON string back to Python dict
    except Exception:
        pass

    return None

def set_cached_response(question:str, answer:str, evidence:str, ttl_seconds=3600):
    """Saves answer and citations to Redis, expiring in 1 hour (3600s)."""
    r = get_redis_client()
    if not r:
        return

    try:
        key = f"faq:{question.strip().lower()}"
        payload= json.dumps({"answer": answer, "evidence": evidence})
        r.set(key,payload,ex=ttl_seconds)
    except Exception:
        pass