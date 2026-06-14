from __future__ import annotations

import json
import os
import tempfile
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.services.auth_service import AuthService, FREE_DAILY_LIMIT_MS, PAID_DAILY_LIMIT_MS
from app.services.object_storage_service import ObjectStorageService

TEST_ACCOUNT = "beta-tester"
TEST_PASSWORD = "test-password-123"
TEST_DISPLAY_NAME = "内测测试用户"


class AuthServiceTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.env_patch = patch.dict(
            os.environ,
            {
                "SPEAK_UP_AUTH_DATA_DIR": self.temp_dir.name,
                "SPEAK_UP_AUTH_DB_PATH": os.path.join(self.temp_dir.name, "auth.sqlite3"),
                "SPEAK_UP_INTERNAL_ACCOUNTS": json.dumps(
                    [
                        {
                            "account": TEST_ACCOUNT,
                            "password": TEST_PASSWORD,
                            "displayName": TEST_DISPLAY_NAME,
                        }
                    ],
                    ensure_ascii=False,
                ),
            },
            clear=False,
        )
        self.env_patch.start()
        self.service = AuthService(output_root=self.temp_dir.name)

    async def asyncTearDown(self) -> None:
        self.env_patch.stop()
        self.temp_dir.cleanup()

    async def test_internal_account_login_and_quota(self) -> None:
        with self.assertRaises(HTTPException) as login_error:
            await self.service.login(account=TEST_ACCOUNT, password="wrong")
        self.assertEqual(login_error.exception.status_code, 401)

        logged_in = await self.service.login(account=TEST_ACCOUNT, password=TEST_PASSWORD)
        self.assertEqual(logged_in["user"]["email"], TEST_ACCOUNT)
        self.assertEqual(logged_in["user"]["displayName"], TEST_DISPLAY_NAME)
        self.assertEqual(logged_in["quota"]["limitMs"], FREE_DAILY_LIMIT_MS)
        self.assertNotIn("passwordHash", logged_in["user"])

        second_login = await self.service.login(account=TEST_ACCOUNT, password=TEST_PASSWORD)
        self.assertNotEqual(second_login["token"], logged_in["token"])
        self.assertEqual(second_login["user"]["createdAt"], logged_in["user"]["createdAt"])

        with self.service._connect() as connection:
            legacy_token = connection.execute(
                "SELECT token FROM users WHERE email = ?",
                (TEST_ACCOUNT,),
            ).fetchone()["token"]
        with self.assertRaises(HTTPException) as legacy_error:
            await self.service.get_account_by_token(legacy_token)
        self.assertEqual(legacy_error.exception.status_code, 401)

        first_reservation = await self.service.reserve_session(email=TEST_ACCOUNT, session_id="s1")
        self.assertEqual(first_reservation["maxSessionDurationMs"], FREE_DAILY_LIMIT_MS)

        with self.assertRaises(HTTPException) as active_error:
            await self.service.reserve_session(email=TEST_ACCOUNT, session_id="s2")
        self.assertEqual(active_error.exception.status_code, 409)

        quota = await self.service.complete_session(email=TEST_ACCOUNT, session_id="s1", duration_ms=180000)
        self.assertEqual(quota["completedMs"], 180000)
        self.assertEqual(quota["remainingMs"], FREE_DAILY_LIMIT_MS - 180000)

        await self.service.reserve_session(email=TEST_ACCOUNT, session_id="s2")
        quota = await self.service.complete_session(
            email=TEST_ACCOUNT,
            session_id="s2",
            duration_ms=FREE_DAILY_LIMIT_MS,
        )
        self.assertEqual(quota["completedMs"], FREE_DAILY_LIMIT_MS)
        self.assertEqual(quota["remainingMs"], 0)

        with self.assertRaises(HTTPException) as exhausted_error:
            await self.service.reserve_session(email=TEST_ACCOUNT, session_id="s3")
        self.assertEqual(exhausted_error.exception.status_code, 403)

        paid = await self.service.subscribe(token=second_login["token"])
        self.assertEqual(paid["user"]["plan"], "paid")
        self.assertEqual(paid["quota"]["limitMs"], PAID_DAILY_LIMIT_MS)

    async def test_internal_account_pool_must_be_configured(self) -> None:
        with patch.dict(os.environ, {"SPEAK_UP_INTERNAL_ACCOUNTS": ""}, clear=False):
            service = AuthService(output_root=self.temp_dir.name)
        with self.assertRaises(HTTPException) as login_error:
            await service.login(account=TEST_ACCOUNT, password=TEST_PASSWORD)
        self.assertEqual(login_error.exception.status_code, 503)

    async def test_auth_routes_login_internal_account(self) -> None:
        from app import main as main_module
        from app.services import auth_service as auth_service_module

        original_service = main_module.auth_service
        original_dependency_service = auth_service_module.auth_service
        main_module.auth_service = self.service
        auth_service_module.auth_service = self.service
        try:
            transport = ASGITransport(app=main_module.app)
            async with AsyncClient(transport=transport, base_url="http://testserver") as client:
                invalid_response = await client.post(
                    "/api/auth/login",
                    json={"account": TEST_ACCOUNT, "password": "wrong"},
                )
                self.assertEqual(invalid_response.status_code, 401)

                login_response = await client.post(
                    "/api/auth/login",
                    json={"account": TEST_ACCOUNT, "password": TEST_PASSWORD},
                )
                self.assertEqual(login_response.status_code, 200)
                login_payload = login_response.json()
                self.assertEqual(login_payload["user"]["email"], TEST_ACCOUNT)
                self.assertEqual(login_payload["user"]["displayName"], TEST_DISPLAY_NAME)
                self.assertEqual(login_payload["quota"]["limitMs"], FREE_DAILY_LIMIT_MS)

                me_response = await client.get(
                    "/api/auth/me",
                    headers={"Authorization": f"Bearer {login_payload['token']}"},
                )
                self.assertEqual(me_response.status_code, 200)
                self.assertEqual(me_response.json()["user"]["email"], TEST_ACCOUNT)

                removed_auth_paths = (
                    ("GET", "/api/auth/captcha"),
                    ("POST", "/api/auth/email-code"),
                    ("POST", "/api/auth/register"),
                )
                for method, path in removed_auth_paths:
                    response = await client.request(method, path, json={})
                    self.assertEqual(response.status_code, 404)
        finally:
            main_module.auth_service = original_service
            auth_service_module.auth_service = original_dependency_service


class ObjectStorageServiceTest(unittest.TestCase):
    def test_builds_signed_read_url_for_private_oss_bucket(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SPEAK_UP_STORAGE_DRIVER": "oss",
                "SPEAK_UP_OSS_BUCKET": "bucket",
                "SPEAK_UP_OSS_ENDPOINT": "https://oss-cn-hangzhou.aliyuncs.com/",
                "SPEAK_UP_OSS_ACCESS_KEY_ID": "ak",
                "SPEAK_UP_OSS_ACCESS_KEY_SECRET": "secret",
                "SPEAK_UP_OSS_PUBLIC_BASE_URL": "",
            },
            clear=False,
        ):
            storage = ObjectStorageService()
            signed_url = storage.build_read_url("speak-up/replay/s1/replay_media.webm")

        self.assertTrue(
            signed_url.startswith(
                "https://bucket.oss-cn-hangzhou.aliyuncs.com/speak-up/replay/s1/replay_media.webm?"
            )
        )
        self.assertIn("OSSAccessKeyId=ak", signed_url)
        self.assertIn("Signature=", signed_url)


if __name__ == "__main__":
    unittest.main()
