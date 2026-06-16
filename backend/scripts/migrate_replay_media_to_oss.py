from __future__ import annotations

import argparse
import asyncio
import json
import mimetypes
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.object_storage_service import object_storage_service
from app.services.replay_service import ReplayService


async def migrate_report_root(report_root: Path, *, dry_run: bool) -> int:
    if not object_storage_service.enabled:
        raise RuntimeError("Set SPEAK_UP_STORAGE_DRIVER=oss before running this migration.")

    migrated = 0
    for meta_path in sorted(report_root.glob("*/replay_media.json")):
        session_dir = meta_path.parent
        payload = json.loads(meta_path.read_text(encoding="utf-8"))
        if payload.get("storage") == "oss":
            continue

        file_name = str(payload.get("fileName") or "").strip()
        if not file_name:
            continue
        media_path = session_dir / file_name
        if not media_path.exists():
            continue

        session_id = session_dir.name
        content_type = str(payload.get("contentType") or "").strip() or mimetypes.guess_type(media_path.name)[0]
        extension = media_path.suffix or ReplayService._resolve_extension(media_path.name, content_type)
        print(f"{'would migrate' if dry_run else 'migrating'} {session_id}/{media_path.name}")
        if dry_run:
            migrated += 1
            continue

        stored_object = await object_storage_service.save_replay_media(
            session_id=session_id,
            extension=extension,
            content_type=content_type,
            data=media_path.read_bytes(),
        )
        if stored_object is None:
            raise RuntimeError("OSS storage returned no object; check SPEAK_UP_STORAGE_DRIVER.")

        next_meta = ReplayService._build_media_meta(
            media_path=media_path,
            stored_object=stored_object,
            media_type=str(payload.get("mediaType") or ReplayService._resolve_media_type(extension, content_type)),
            content_type=content_type,
            duration_ms=max(0, int(payload.get("durationMs") or 0)),
        )
        meta_path.write_text(json.dumps(next_meta, ensure_ascii=False, indent=2), encoding="utf-8")
        media_path.unlink(missing_ok=True)
        migrated += 1

    return migrated


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate local replay media files to Aliyun OSS.")
    parser.add_argument(
        "--report-root",
        default="output/report_data",
        help="Report data root containing per-session replay_media.json files.",
    )
    parser.add_argument("--dry-run", action="store_true", help="List files that would be migrated without uploading.")
    args = parser.parse_args()

    migrated = asyncio.run(migrate_report_root(Path(args.report_root), dry_run=args.dry_run))
    print(f"{'candidate' if args.dry_run else 'migrated'} files: {migrated}")


if __name__ == "__main__":
    main()
