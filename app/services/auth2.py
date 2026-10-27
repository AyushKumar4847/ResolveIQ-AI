from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from app.core.config import settings


def create_token(userinfo: dict) -> str:
    payload = userinfo.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(payload, settings.SECRET_KEY, settings.ALGORITHM)

def create_refresh_token(user_id: str) -> tuple[str, datetime]:
    expires = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {"sub": user_id, "type": "refresh", "exp": expires}
    token = jwt.encode(payload, settings.SECRET_KEY, settings.ALGORITHM)
    return token, expires


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
