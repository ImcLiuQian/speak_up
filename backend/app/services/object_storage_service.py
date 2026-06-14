from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time
from dataclasses import dataclass
from email.utils import formatdate
from pathlib import PurePosixPath
from urllib.parse import quote

import httpx


@dataclass(frozen=True)
class StoredObject:
    object_key: str
    url: str


class ObjectStorageService:
    def __init__(self) -> None:
        self.driver = os.getenv("SPEAK_UP_STORAGE_DRIVER", "local").strip().lower() or "local"
        self.bucket = os.getenv("SPEAK_UP_OSS_BUCKET", "").strip()
        self.endpoint = (
            os.getenv("SPEAK_UP_OSS_ENDPOINT", "")
            .strip()
            .removeprefix("https://")
            .removeprefix("http://")
            .rstrip("/")
        )
        self.access_key_id = os.getenv("SPEAK_UP_OSS_ACCESS_KEY_ID", "").strip()
        self.access_key_secret = os.getenv("SPEAK_UP_OSS_ACCESS_KEY_SECRET", "").strip()
        self.public_base_url = os.getenv("SPEAK_UP_OSS_PUBLIC_BASE_URL", "").strip().rstrip("/")
        self.prefix = os.getenv("SPEAK_UP_OSS_PREFIX", "speak-up").strip().strip("/")

    @property
    def enabled(self) -> bool:
        return self.driver == "oss"

    async def save_replay_media(
        self,
        *,
        session_id: str,
        extension: str,
        content_type: str | None,
        data: bytes,
    ) -> StoredObject | None:
        if not self.enabled:
            return None
        self._ensure_configured()

        object_key = self._build_object_key(session_id=session_id, extension=extension)
        await self._put_object(object_key=object_key, content_type=content_type, data=data)
        return StoredObject(
            object_key=object_key,
            url=self._build_public_url(object_key),
        )

    def _ensure_configured(self) -> None:
        missing = [
            name
            for name, value in {
                "SPEAK_UP_OSS_BUCKET": self.bucket,
                "SPEAK_UP_OSS_ENDPOINT": self.endpoint,
                "SPEAK_UP_OSS_ACCESS_KEY_ID": self.access_key_id,
                "SPEAK_UP_OSS_ACCESS_KEY_SECRET": self.access_key_secret,
            }.items()
            if not value
        ]
        if missing:
            raise RuntimeError(f"OSS 存储未配置，请设置 {', '.join(missing)}。")

    def _build_object_key(self, *, session_id: str, extension: str) -> str:
        safe_session_id = quote(session_id.strip(), safe="")
        safe_extension = extension if extension.startswith(".") else f".{extension}"
        path = PurePosixPath(self.prefix) / "replay" / safe_session_id / f"replay_media{safe_extension}"
        return str(path).lstrip("/")

    def _build_public_url(self, object_key: str) -> str:
        quoted_key = "/".join(quote(part, safe="") for part in object_key.split("/"))
        if self.public_base_url:
            return f"{self.public_base_url}/{quoted_key}"
        return f"https://{self.bucket}.{self.endpoint}/{quoted_key}"

    def build_read_url(self, object_key: str, *, expires_seconds: int = 900) -> str:
        if self.public_base_url:
            return self._build_public_url(object_key)
        self._ensure_configured()
        expires_at = int(time.time()) + max(60, expires_seconds)
        canonical_resource = f"/{self.bucket}/{object_key}"
        string_to_sign = "\n".join(["GET", "", "", str(expires_at), canonical_resource])
        signature = base64.b64encode(
            hmac.new(
                self.access_key_secret.encode("utf-8"),
                string_to_sign.encode("utf-8"),
                hashlib.sha1,
            ).digest()
        ).decode("ascii")
        return (
            f"https://{self.bucket}.{self.endpoint}/{quote(object_key, safe='/')}"
            f"?OSSAccessKeyId={quote(self.access_key_id, safe='')}"
            f"&Expires={expires_at}"
            f"&Signature={quote(signature, safe='')}"
        )

    async def _put_object(self, *, object_key: str, content_type: str | None, data: bytes) -> None:
        content_md5 = base64.b64encode(hashlib.md5(data).digest()).decode("ascii")
        date_header = formatdate(usegmt=True)
        normalized_content_type = content_type or "application/octet-stream"
        canonical_resource = f"/{self.bucket}/{object_key}"
        string_to_sign = "\n".join(
            [
                "PUT",
                content_md5,
                normalized_content_type,
                date_header,
                canonical_resource,
            ]
        )
        signature = base64.b64encode(
            hmac.new(
                self.access_key_secret.encode("utf-8"),
                string_to_sign.encode("utf-8"),
                hashlib.sha1,
            ).digest()
        ).decode("ascii")
        url = f"https://{self.bucket}.{self.endpoint}/{quote(object_key, safe='/')}"
        headers = {
            "Authorization": f"OSS {self.access_key_id}:{signature}",
            "Content-MD5": content_md5,
            "Content-Type": normalized_content_type,
            "Date": date_header,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.put(url, content=data, headers=headers)
            response.raise_for_status()


object_storage_service = ObjectStorageService()
