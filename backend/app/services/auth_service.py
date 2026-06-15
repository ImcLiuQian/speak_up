from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import HTTPException, Request


AUTH_TOKEN_COOKIE_NAME = "speak_up_auth_token"
SAFE_COOKIE_AUTH_METHODS = {"GET", "HEAD", "OPTIONS"}
AUTH_SESSION_DAYS = 30
ACCOUNT_PATTERN = re.compile(r"^[^\s]{3,128}$")


class _DatabaseConnection:
    def __init__(self, raw_connection: sqlite3.Connection) -> None:
        self.raw_connection = raw_connection

    def execute(self, sql: str, parameters: tuple = ()):
        return self.raw_connection.execute(sql, parameters)

    def executescript(self, script: str) -> None:
        self.raw_connection.executescript(script)

    def commit(self) -> None:
        self.raw_connection.commit()

    def close(self) -> None:
        self.raw_connection.close()


class AuthService:
    def __init__(self, output_root: str | None = None) -> None:
        self.output_root = Path(output_root or os.getenv("SPEAK_UP_AUTH_DATA_DIR", "output/auth_data"))
        self.db_path = Path(os.getenv("SPEAK_UP_AUTH_DB_PATH", self.output_root / "auth.sqlite3"))
        self.session_days = self._int_env("SPEAK_UP_AUTH_SESSION_DAYS", AUTH_SESSION_DAYS)
        self.internal_accounts = self._load_internal_accounts()
        self._lock = asyncio.Lock()
        self._ensure_storage()

    async def login(self, *, account: str, password: str) -> dict:
        normalized_account = self._normalize_account(account)
        if not self.internal_accounts:
            raise HTTPException(status_code=503, detail="内测账号池未配置。")
        account_config = self.internal_accounts.get(normalized_account)
        if not account_config or not hmac.compare_digest(str(account_config["password"]), str(password or "")):
            raise HTTPException(status_code=401, detail="账号或密码不正确。")

        async with self._lock:
            with self._connect() as connection:
                user = self._get_user_by_email(connection, normalized_account)
                if not user:
                    user = self._create_user(
                        connection,
                        normalized_account,
                        display_name=str(account_config.get("displayName") or self._default_display_name(normalized_account)),
                    )
                token = self._issue_session(connection, normalized_account)
                payload = self._build_auth_payload(user, token)
                connection.commit()
                return payload

    async def get_account_by_token(self, token: str) -> dict:
        stripped_token = token.strip()
        if not stripped_token:
            raise HTTPException(status_code=401, detail="请先登录。")
        token_hash = self._hash_session_token(stripped_token)

        async with self._lock:
            with self._connect() as connection:
                row = connection.execute(
                    """
                    SELECT u.email, u.display_name, u.password_hash, u.token, u.created_at,
                        s.expires_at AS session_expires_at
                    FROM auth_sessions s
                    JOIN users u ON u.email = s.email
                    WHERE s.token_hash = ?
                    """,
                    (token_hash,),
                ).fetchone()
                if row is None:
                    raise HTTPException(status_code=401, detail="登录已失效，请重新登录。")

                expires_at = self._parse_datetime(row["session_expires_at"])
                if not expires_at or expires_at <= self._now():
                    connection.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
                    connection.commit()
                    raise HTTPException(status_code=401, detail="登录已失效，请重新登录。")
                connection.execute(
                    "UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?",
                    (self._now_iso(), token_hash),
                )
                payload = self._build_auth_payload(self._row_to_user(row), stripped_token)
                connection.commit()
                return payload

    async def reserve_session(self, *, email: str, session_id: str) -> None:
        normalized_email = self._normalize_account(email)
        async with self._lock:
            with self._connect() as connection:
                user = self._get_user_by_email(connection, normalized_email)
                if not user:
                    raise HTTPException(status_code=401, detail="请先登录。")

                active_session = connection.execute(
                    "SELECT session_id FROM active_sessions WHERE email = ?",
                    (normalized_email,),
                ).fetchone()
                if active_session is not None:
                    raise HTTPException(status_code=409, detail="已有训练进行中，请先结束当前训练。")

                connection.execute(
                    """
                    INSERT INTO active_sessions(email, session_id, started_at)
                    VALUES (?, ?, ?)
                    """,
                    (normalized_email, session_id, self._now_iso()),
                )
                connection.commit()

    async def release_session(self, *, email: str | None, session_id: str) -> None:
        if not email:
            return

        normalized_email = self._normalize_account(email)
        async with self._lock:
            with self._connect() as connection:
                connection.execute(
                    "DELETE FROM active_sessions WHERE email = ? AND session_id = ?",
                    (normalized_email, session_id),
                )
                connection.commit()

    def _ensure_storage(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            self._ensure_sqlite_storage(connection)
            connection.execute("DELETE FROM active_sessions")
            connection.commit()

    @contextmanager
    def _connect(self) -> Iterator[_DatabaseConnection]:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        wrapped_connection = _DatabaseConnection(connection)
        try:
            yield wrapped_connection
        finally:
            wrapped_connection.close()

    def _ensure_sqlite_storage(self, connection: _DatabaseConnection) -> None:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS auth_sessions (
                token_hash TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS active_sessions (
                email TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                started_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON auth_sessions(email);
            """
        )

    def _build_auth_payload(self, user: dict, token: str) -> dict:
        return {
            "token": token,
            "user": self._public_user(user),
        }

    def _public_user(self, user: dict) -> dict:
        return {
            "email": user["email"],
            "displayName": user["displayName"],
            "createdAt": user.get("createdAt"),
        }

    @staticmethod
    def _get_user_by_email(connection: _DatabaseConnection, email: str) -> dict | None:
        row = connection.execute(
            """
            SELECT email, display_name, password_hash, token, created_at
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()
        return AuthService._row_to_user(row) if row else None

    @staticmethod
    def _row_to_user(row) -> dict:
        return {
            "email": row["email"],
            "displayName": row["display_name"],
            "passwordHash": row["password_hash"],
            "token": row["token"],
            "createdAt": row["created_at"],
        }

    def _create_user(self, connection: _DatabaseConnection, email: str, *, display_name: str) -> dict:
        now = self._now_iso()
        legacy_token = f"legacy-disabled:{secrets.token_urlsafe(16)}"
        user = {
            "email": email,
            "displayName": display_name,
            "passwordHash": "",
            "token": legacy_token,
            "createdAt": now,
        }
        connection.execute(
            """
            INSERT INTO users(email, display_name, password_hash, token, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                user["email"],
                user["displayName"],
                user["passwordHash"],
                user["token"],
                user["createdAt"],
            ),
        )
        return user

    def _issue_session(self, connection: _DatabaseConnection, email: str) -> str:
        token = secrets.token_urlsafe(32)
        self._store_session(connection, email=email, token=token)
        return token

    def _store_session(self, connection: _DatabaseConnection, *, email: str, token: str) -> None:
        now = self._now()
        now_iso = now.isoformat()
        expires_at = (now + timedelta(days=self.session_days)).isoformat()
        token_hash = self._hash_session_token(token)
        connection.execute("DELETE FROM auth_sessions WHERE expires_at <= ?", (now_iso,))
        connection.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
        connection.execute(
            """
            INSERT INTO auth_sessions(token_hash, email, expires_at, created_at, last_seen_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (token_hash, email, expires_at, now_iso, now_iso),
        )

    @staticmethod
    def _hash_session_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def _load_internal_accounts(self) -> dict[str, dict]:
        configured_accounts = os.getenv("SPEAK_UP_INTERNAL_ACCOUNTS", "").strip()
        if not configured_accounts:
            return {}
        try:
            raw_accounts = json.loads(configured_accounts)
        except json.JSONDecodeError as error:
            raise RuntimeError("SPEAK_UP_INTERNAL_ACCOUNTS must be a JSON array") from error
        if not isinstance(raw_accounts, list):
            raise RuntimeError("SPEAK_UP_INTERNAL_ACCOUNTS must be a JSON array")

        accounts: dict[str, dict] = {}
        for item in raw_accounts:
            if not isinstance(item, dict):
                raise RuntimeError("Each internal account must be an object")
            account = self._normalize_account(str(item.get("account", "")))
            password = str(item.get("password", ""))
            if not password:
                raise RuntimeError("Each internal account must include a password")
            accounts[account] = {
                "account": account,
                "password": password,
                "displayName": str(item.get("displayName") or self._default_display_name(account)),
            }
        return accounts

    @staticmethod
    def _normalize_account(account: str) -> str:
        normalized = str(account or "").strip().lower()
        if not ACCOUNT_PATTERN.match(normalized):
            raise HTTPException(status_code=400, detail="请输入有效账号。")
        return normalized

    @staticmethod
    def _default_display_name(account: str) -> str:
        if "@" in account:
            return account.split("@", 1)[0] or "Speak Up 用户"
        return "内测用户"

    @staticmethod
    def _parse_datetime(value: object) -> datetime | None:
        try:
            return datetime.fromisoformat(str(value))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _now() -> datetime:
        return datetime.now().astimezone()

    def _now_iso(self) -> str:
        return self._now().isoformat()

    @staticmethod
    def _int_env(name: str, default: int) -> int:
        value = os.getenv(name)
        if value is None or value.strip() == "":
            return default
        try:
            return int(value)
        except ValueError as error:
            raise RuntimeError(f"{name} must be an integer") from error


auth_service = AuthService()


async def require_current_account(request: Request) -> dict:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        if request.method.upper() not in SAFE_COOKIE_AUTH_METHODS:
            raise HTTPException(status_code=401, detail="请先登录。")
        token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME, "")
    if not token.strip():
        raise HTTPException(status_code=401, detail="请先登录。")
    return await auth_service.get_account_by_token(token)
