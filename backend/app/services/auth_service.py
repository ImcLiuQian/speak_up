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


FREE_DAILY_LIMIT_MS = 10 * 60 * 1000
PAID_DAILY_LIMIT_MS = 120 * 60 * 1000
SUBSCRIPTION_PRICE_CNY = 30
SUBSCRIPTION_DAYS = 30
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
                payload = self._build_auth_payload(connection, user, token)
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
                    SELECT u.email, u.display_name, u.password_hash, u.token, u.plan, u.paid_until, u.created_at,
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
                payload = self._build_auth_payload(connection, self._row_to_user(row), stripped_token)
                connection.commit()
                return payload

    async def subscribe(self, *, token: str) -> dict:
        account = await self.get_account_by_token(token)
        email = account["user"]["email"]
        paid_until = self._now() + timedelta(days=SUBSCRIPTION_DAYS)

        async with self._lock:
            with self._connect() as connection:
                user = self._get_user_by_email(connection, email)
                if not user:
                    raise HTTPException(status_code=404, detail="账号不存在，请重新登录。")
                connection.execute(
                    "UPDATE users SET plan = ?, paid_until = ? WHERE email = ?",
                    ("paid", paid_until.isoformat(), email),
                )
                next_user = dict(user)
                next_user["plan"] = "paid"
                next_user["paidUntil"] = paid_until.isoformat()
                payload = self._build_auth_payload(connection, next_user, token)
                connection.commit()
                return payload

    async def reserve_session(self, *, email: str, session_id: str) -> dict:
        normalized_email = self._normalize_account(email)
        async with self._lock:
            with self._connect() as connection:
                user = self._get_user_by_email(connection, normalized_email)
                if not user:
                    raise HTTPException(status_code=401, detail="请先登录。")

                day_usage = self._get_day_usage(connection, normalized_email)
                if day_usage.get("activeSessionId"):
                    raise HTTPException(status_code=409, detail="已有训练进行中，请先结束当前训练。")

                quota = self._build_quota(user, day_usage)
                if quota["remainingMs"] <= 0:
                    raise HTTPException(status_code=403, detail="今日训练额度已用完，请升级后继续。")

                now = self._now_iso()
                connection.execute(
                    """
                    UPDATE usage_daily
                    SET active_session_id = ?, active_started_at = ?
                    WHERE email = ? AND usage_date = ?
                    """,
                    (session_id, now, normalized_email, self._today_key()),
                )
                connection.commit()
                day_usage["activeSessionId"] = session_id
                day_usage["activeStartedAt"] = now
                quota = self._build_quota(user, day_usage)
                return {
                    "quota": quota,
                    "maxSessionDurationMs": quota["remainingMs"],
                }

    async def complete_session(self, *, email: str | None, session_id: str, duration_ms: int) -> dict | None:
        if not email:
            return None

        normalized_email = self._normalize_account(email)
        async with self._lock:
            with self._connect() as connection:
                user = self._get_user_by_email(connection, normalized_email)
                if not user:
                    return None

                day_usage = self._get_day_usage(connection, normalized_email)
                if day_usage.get("activeSessionId") == session_id:
                    completed_before_ms = max(0, int(day_usage.get("completedMs") or 0))
                    quota = self._build_quota(user, day_usage)
                    chargeable_duration_ms = min(
                        max(0, int(duration_ms)),
                        max(0, int(quota["limitMs"]) - completed_before_ms),
                    )
                    completed_ms = completed_before_ms + chargeable_duration_ms
                    connection.execute(
                        """
                        UPDATE usage_daily
                        SET completed_ms = ?, active_session_id = NULL, active_started_at = NULL
                        WHERE email = ? AND usage_date = ?
                        """,
                        (completed_ms, normalized_email, self._today_key()),
                    )
                    connection.commit()
                    day_usage["completedMs"] = completed_ms
                    day_usage["activeSessionId"] = None
                    day_usage["activeStartedAt"] = None
                quota = self._build_quota(user, day_usage)
                connection.commit()
                return quota

    def _ensure_storage(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            self._ensure_sqlite_storage(connection)
            connection.execute("UPDATE usage_daily SET active_session_id = NULL, active_started_at = NULL")
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
                plan TEXT NOT NULL DEFAULT 'free',
                paid_until TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS auth_sessions (
                token_hash TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS usage_daily (
                email TEXT NOT NULL,
                usage_date TEXT NOT NULL,
                completed_ms INTEGER NOT NULL DEFAULT 0,
                active_session_id TEXT,
                active_started_at TEXT,
                PRIMARY KEY (email, usage_date)
            );

            CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON auth_sessions(email);
            """
        )

    def _build_auth_payload(self, connection: _DatabaseConnection, user: dict, token: str) -> dict:
        day_usage = self._get_day_usage(connection, str(user["email"]))
        return {
            "token": token,
            "user": self._public_user(user),
            "quota": self._build_quota(user, day_usage),
            "priceCny": SUBSCRIPTION_PRICE_CNY,
        }

    def _public_user(self, user: dict) -> dict:
        paid_active = self._is_paid_active(user)
        return {
            "email": user["email"],
            "displayName": user["displayName"],
            "plan": "paid" if paid_active else "free",
            "paidUntil": user.get("paidUntil") if paid_active else None,
            "createdAt": user.get("createdAt"),
        }

    def _build_quota(self, user: dict, day_usage: dict) -> dict:
        limit_ms = PAID_DAILY_LIMIT_MS if self._is_paid_active(user) else FREE_DAILY_LIMIT_MS
        completed_ms = max(0, int(day_usage.get("completedMs") or 0))
        return {
            "date": self._today_key(),
            "limitMs": limit_ms,
            "completedMs": completed_ms,
            "remainingMs": max(0, limit_ms - completed_ms),
            "activeSessionId": day_usage.get("activeSessionId"),
            "activeStartedAt": day_usage.get("activeStartedAt"),
        }

    def _get_day_usage(self, connection: _DatabaseConnection, email: str) -> dict:
        day_key = self._today_key()
        self._ensure_day_usage_row(connection, email, day_key)
        row = connection.execute(
            """
            SELECT completed_ms, active_session_id, active_started_at
            FROM usage_daily
            WHERE email = ? AND usage_date = ?
            """,
            (email, day_key),
        ).fetchone()
        return {
            "completedMs": int(row["completed_ms"] or 0),
            "activeSessionId": row["active_session_id"],
            "activeStartedAt": row["active_started_at"],
        }

    @staticmethod
    def _ensure_day_usage_row(connection: _DatabaseConnection, email: str, day_key: str) -> None:
        connection.execute(
            """
            INSERT OR IGNORE INTO usage_daily(email, usage_date, completed_ms, active_session_id, active_started_at)
            VALUES (?, ?, 0, NULL, NULL)
            """,
            (email, day_key),
        )

    @staticmethod
    def _get_user_by_email(connection: _DatabaseConnection, email: str) -> dict | None:
        row = connection.execute(
            """
            SELECT email, display_name, password_hash, token, plan, paid_until, created_at
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
            "plan": row["plan"],
            "paidUntil": row["paid_until"],
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
            "plan": "free",
            "paidUntil": None,
            "createdAt": now,
        }
        connection.execute(
            """
            INSERT INTO users(email, display_name, password_hash, token, plan, paid_until, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["email"],
                user["displayName"],
                user["passwordHash"],
                user["token"],
                user["plan"],
                user["paidUntil"],
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
    def _is_paid_active(user: dict) -> bool:
        if user.get("plan") != "paid" or not user.get("paidUntil"):
            return False
        paid_until = AuthService._parse_datetime(user.get("paidUntil"))
        return bool(paid_until and paid_until > datetime.now().astimezone())

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

    def _today_key(self) -> str:
        return self._now().date().isoformat()

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
