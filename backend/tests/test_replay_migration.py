from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from app.services.object_storage_service import StoredObject


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "migrate_replay_media_to_oss.py"


def load_migration_module():
    spec = importlib.util.spec_from_file_location("migrate_replay_media_to_oss", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module


class FakeObjectStorageService:
    enabled = True

    def __init__(self) -> None:
        self.uploads: list[dict] = []

    async def save_replay_media(self, *, session_id: str, extension: str, content_type: str | None, data: bytes):
        self.uploads.append(
            {
                "sessionId": session_id,
                "extension": extension,
                "contentType": content_type,
                "data": data,
            }
        )
        return StoredObject(
            object_key=f"speak-up/replay/{session_id}/replay_media{extension}",
            url=f"https://example.test/{session_id}/replay_media{extension}",
        )


class ReplayMigrationTest(unittest.IsolatedAsyncioTestCase):
    async def test_migrates_metadata_and_keeps_local_file_by_default(self) -> None:
        module = load_migration_module()
        fake_storage = FakeObjectStorageService()
        module.object_storage_service = fake_storage

        with tempfile.TemporaryDirectory() as temp_dir:
            session_dir = Path(temp_dir) / "session-1"
            session_dir.mkdir()
            media_path = session_dir / "replay_media.webm"
            media_path.write_bytes(b"video-bytes")
            (session_dir / "replay_media.json").write_text(
                json.dumps(
                    {
                        "storage": "local",
                        "fileName": "replay_media.webm",
                        "mediaType": "video",
                        "contentType": "video/webm",
                        "durationMs": 1234,
                    }
                ),
                encoding="utf-8",
            )

            migrated = await module.migrate_report_root(Path(temp_dir), dry_run=False)

            self.assertEqual(migrated, 1)
            self.assertTrue(media_path.exists())
            self.assertEqual(fake_storage.uploads[0]["sessionId"], "session-1")
            self.assertEqual(fake_storage.uploads[0]["extension"], ".webm")
            self.assertEqual(fake_storage.uploads[0]["data"], b"video-bytes")

            payload = json.loads((session_dir / "replay_media.json").read_text(encoding="utf-8"))
            self.assertEqual(payload["storage"], "oss")
            self.assertEqual(payload["objectKey"], "speak-up/replay/session-1/replay_media.webm")
            self.assertEqual(payload["durationMs"], 1234)

    async def test_delete_local_requires_explicit_flag(self) -> None:
        module = load_migration_module()
        module.object_storage_service = FakeObjectStorageService()

        with tempfile.TemporaryDirectory() as temp_dir:
            session_dir = Path(temp_dir) / "session-1"
            session_dir.mkdir()
            media_path = session_dir / "replay_media.webm"
            media_path.write_bytes(b"video-bytes")
            (session_dir / "replay_media.json").write_text(
                json.dumps(
                    {
                        "storage": "local",
                        "fileName": "replay_media.webm",
                        "mediaType": "video",
                        "contentType": "video/webm",
                        "durationMs": 0,
                    }
                ),
                encoding="utf-8",
            )

            migrated = await module.migrate_report_root(Path(temp_dir), dry_run=False, delete_local=True)

            self.assertEqual(migrated, 1)
            self.assertFalse(media_path.exists())

    async def test_dry_run_does_not_upload_or_rewrite_metadata(self) -> None:
        module = load_migration_module()
        fake_storage = FakeObjectStorageService()
        module.object_storage_service = fake_storage

        with tempfile.TemporaryDirectory() as temp_dir:
            session_dir = Path(temp_dir) / "session-1"
            session_dir.mkdir()
            media_path = session_dir / "replay_media.webm"
            media_path.write_bytes(b"video-bytes")
            meta_path = session_dir / "replay_media.json"
            original_meta = {
                "storage": "local",
                "fileName": "replay_media.webm",
                "mediaType": "video",
                "contentType": "video/webm",
                "durationMs": 0,
            }
            meta_path.write_text(json.dumps(original_meta), encoding="utf-8")

            migrated = await module.migrate_report_root(Path(temp_dir), dry_run=True)

            self.assertEqual(migrated, 1)
            self.assertEqual(fake_storage.uploads, [])
            self.assertEqual(json.loads(meta_path.read_text(encoding="utf-8")), original_meta)
            self.assertTrue(media_path.exists())


if __name__ == "__main__":
    unittest.main()
