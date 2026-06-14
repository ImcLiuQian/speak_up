from __future__ import annotations

import os
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from starlette.requests import Request

from app.main import (
    _build_websocket_url,
    _public_request_host,
    _public_request_scheme,
    _require_websocket_session_owner,
    app,
    auth_service,
    require_current_account,
    session_manager,
)
from app.services.auth_service import AUTH_TOKEN_COOKIE_NAME
from app.services.session_manager import SessionRecord


def _make_request(headers: list[tuple[bytes, bytes]]) -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "scheme": "http",
            "path": "/api/session/start",
            "headers": headers,
            "server": ("127.0.0.1", 8000),
        }
    )


class PublicRequestOriginTest(unittest.IsolatedAsyncioTestCase):
    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_uses_forwarded_public_https_origin(self) -> None:
        request = _make_request(
            [
                (b"x-forwarded-proto", b"https"),
                (b"x-forwarded-host", b"speakupcoach.cn"),
                (b"host", b"127.0.0.1:8000"),
            ]
        )

        self.assertEqual(_public_request_scheme(request), "https")
        self.assertEqual(_public_request_host(request), "speakupcoach.cn")
        self.assertEqual(_build_websocket_url(request, "session-1", "secret-token"), "wss://speakupcoach.cn/ws/session/session-1")

    def test_can_include_websocket_query_token_for_cross_origin_deployments(self) -> None:
        request = _make_request(
            [
                (b"x-forwarded-proto", b"https"),
                (b"x-forwarded-host", b"speakupcoach.cn"),
            ]
        )

        with patch.dict("os.environ", {"SPEAK_UP_WEBSOCKET_TOKEN_IN_QUERY": "true"}):
            self.assertEqual(
                _build_websocket_url(request, "session-1", "secret token"),
                "wss://speakupcoach.cn/ws/session/session-1?token=secret%20token",
            )

    def test_falls_back_to_direct_request_origin(self) -> None:
        request = _make_request([(b"host", b"127.0.0.1:8000")])

        self.assertEqual(_public_request_scheme(request), "http")
        self.assertEqual(_public_request_host(request), "127.0.0.1:8000")

    def test_start_session_returns_public_wss_url_without_query_token_by_default(self) -> None:
        async def fake_current_account() -> dict:
            return {
                "token": "secret-token",
                "user": {"email": "tester@example.com", "displayName": "Tester", "plan": "free"},
            }

        app.dependency_overrides[require_current_account] = fake_current_account
        reservation = {
            "maxSessionDurationMs": 600000,
            "quota": {
                "date": "2026-05-27",
                "limitMs": 600000,
                "completedMs": 0,
                "remainingMs": 600000,
                "activeSessionId": "session-1",
                "activeStartedAt": "2026-05-27T12:00:00Z",
            },
        }
        session = SessionRecord(
            session_id="session-1",
            scenario_id="general",
            language="zh",
            coach_profile_id="warm_voice_coach",
            user_email="tester@example.com",
            quota_limit_ms=600000,
        )

        with (
            patch.dict(os.environ, {"SPEAK_UP_WEBSOCKET_TOKEN_IN_QUERY": "false"}),
            patch.object(auth_service, "reserve_session", new=AsyncMock(return_value=reservation)),
            patch.object(session_manager, "create_session", return_value=session),
            patch.object(session_manager.report_job_service, "register_session", new=AsyncMock()),
        ):
            response = TestClient(app).post(
                "/api/session/start",
                json={"scenarioId": "general", "language": "zh", "coachProfileId": "warm_voice_coach"},
                headers={"x-forwarded-proto": "https", "x-forwarded-host": "speakupcoach.cn"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["websocketUrl"], "wss://speakupcoach.cn/ws/session/session-1")

    async def test_websocket_owner_check_accepts_same_domain_cookie_token(self) -> None:
        websocket = _FakeWebSocket(
            query_params={},
            cookies={AUTH_TOKEN_COOKIE_NAME: "cookie-token"},
        )

        with patch.object(
            auth_service,
            "get_account_by_token",
            new=AsyncMock(return_value={"user": {"email": "tester@example.com"}}),
        ) as get_account_by_token:
            allowed = await _require_websocket_session_owner(websocket, "session-1", "tester@example.com")

        self.assertTrue(allowed)
        self.assertIsNone(websocket.closed_code)
        get_account_by_token.assert_awaited_once_with("cookie-token")


class _FakeWebSocket:
    def __init__(self, *, query_params: dict[str, str], cookies: dict[str, str]) -> None:
        self.query_params = query_params
        self.cookies = cookies
        self.closed_code: int | None = None

    async def close(self, code: int) -> None:
        self.closed_code = code


if __name__ == "__main__":
    unittest.main()
