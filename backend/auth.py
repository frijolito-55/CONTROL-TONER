import hmac
import secrets
import time

from settings import get_admin_credentials

SESSION_TTL_SECONDS = 8 * 60 * 60
_sessions: dict[str, tuple[str, float]] = {}


def authenticate_admin(username: str, password: str) -> bool:
    credentials = get_admin_credentials()
    if credentials is None:
        return False

    expected_username, expected_password = credentials
    username_matches = hmac.compare_digest(username.encode(), expected_username.encode())
    password_matches = hmac.compare_digest(password.encode(), expected_password.encode())
    return username_matches and password_matches


def create_session(username: str) -> str:
    now = time.monotonic()
    expired_tokens = [token for token, (_, expires_at) in _sessions.items() if expires_at <= now]
    for token in expired_tokens:
        _sessions.pop(token, None)

    token = secrets.token_urlsafe(32)
    _sessions[token] = (username, now + SESSION_TTL_SECONDS)
    return token


def get_session_username(token: str | None, now: float | None = None) -> str | None:
    if not token:
        return None

    session = _sessions.get(token)
    if session is None:
        return None

    username, expires_at = session
    if expires_at <= (time.monotonic() if now is None else now):
        _sessions.pop(token, None)
        return None
    return username


def revoke_session(token: str | None) -> None:
    if token:
        _sessions.pop(token, None)