import logging
import os
from urllib.parse import quote
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    AuthLoginRequest,
    AuthSessionResponse,
    ClientMessage,
    DocumentExtractionResponse,
    RealtimeSession,
    RealtimeSessionResponse,
    ReplayMediaUploadResponse,
    VoiceProfile,
    SessionReport,
    SessionReplay,
    StartSessionRequest,
)
from app.services.auth_service import AUTH_TOKEN_COOKIE_NAME, auth_service, require_current_account
from app.services.document_extraction_service import DocumentExtractionError, document_extraction_service
from app.services.document_preview_service import document_preview_service
from app.services.session_manager import session_manager

MAX_DOCUMENT_UPLOAD_BYTES = 20 * 1024 * 1024
MAX_REPLAY_MEDIA_UPLOAD_BYTES = 512 * 1024 * 1024
ALLOWED_REPLAY_MEDIA_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "video/mp4",
    "video/quicktime",
    "video/webm",
}


def _configure_app_logging() -> None:
    uvicorn_logger = logging.getLogger("uvicorn.error")
    formatter = logging.Formatter("%(levelname)s:     %(name)s - %(message)s")
    fallback_handler = logging.StreamHandler()
    fallback_handler.setFormatter(formatter)

    for logger_name in ("speak_up.session", "speak_up.qa"):
        app_logger = logging.getLogger(logger_name)
        app_logger.setLevel(logging.INFO)
        app_logger.handlers = uvicorn_logger.handlers or [fallback_handler]
        app_logger.propagate = False


_configure_app_logging()


def _allowed_cors_origins() -> list[str]:
    defaults = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://speakup.cn",
        "https://www.speakup.cn",
    ]
    configured = [
        origin.strip().rstrip("/")
        for origin in os.getenv("SPEAK_UP_ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return list(dict.fromkeys([*defaults, *configured]))


app = FastAPI(title="Speak Up API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _first_forwarded_value(value: str | None) -> str | None:
    if not value:
        return None
    first_value = value.split(",", 1)[0].strip()
    return first_value or None


def _public_request_scheme(request: Request) -> str:
    return _first_forwarded_value(request.headers.get("x-forwarded-proto")) or request.url.scheme


def _public_request_host(request: Request) -> str:
    return (
        _first_forwarded_value(request.headers.get("x-forwarded-host"))
        or _first_forwarded_value(request.headers.get("host"))
        or "127.0.0.1:8000"
    )


def _bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _build_websocket_url(request: Request, session_id: str, token: str) -> str:
    websocket_scheme = "wss" if _public_request_scheme(request) == "https" else "ws"
    token_query = f"?token={quote(token, safe='')}" if _bool_env("SPEAK_UP_WEBSOCKET_TOKEN_IN_QUERY") else ""
    return f"{websocket_scheme}://{_public_request_host(request)}/ws/session/{session_id}{token_query}"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/qa/voice-profiles", response_model=list[VoiceProfile])
def list_qa_voice_profiles() -> list[VoiceProfile]:
    return session_manager.qa_mode_orchestrator.list_voice_profiles()


@app.post("/api/auth/login", response_model=AuthSessionResponse)
async def login_account(payload: AuthLoginRequest) -> AuthSessionResponse:
    return AuthSessionResponse.model_validate(
        await auth_service.login(account=payload.account, password=payload.password)
    )


@app.get("/api/auth/me", response_model=AuthSessionResponse)
async def get_current_account(current_account: dict = Depends(require_current_account)) -> AuthSessionResponse:
    return AuthSessionResponse.model_validate(current_account)


async def _require_session_owner(session_id: str, current_account: dict) -> None:
    current_email = current_account["user"]["email"]
    active_session = session_manager.get_session(session_id)
    if active_session is not None:
        if active_session.user_email and active_session.user_email != current_email:
            raise HTTPException(status_code=403, detail="无权访问这个训练会话。")
        return

    state = await session_manager.report_job_service.repository.get_state(session_id)
    if state is not None:
        if not state.userEmail:
            raise HTTPException(status_code=403, detail="这个历史会话缺少账号归属，已禁止访问。")
        if state.userEmail != current_email:
            raise HTTPException(status_code=403, detail="无权访问这个训练会话。")


async def _require_websocket_session_owner(websocket: WebSocket, session_id: str, user_email: str | None) -> bool:
    token = str(websocket.query_params.get("token") or websocket.cookies.get(AUTH_TOKEN_COOKIE_NAME, "")).strip()
    if not token:
        await websocket.close(code=4401)
        return False
    try:
        current_account = await auth_service.get_account_by_token(token)
    except HTTPException:
        await websocket.close(code=4401)
        return False
    if user_email and current_account["user"]["email"] != user_email:
        logging.getLogger("speak_up.session").warning(
            "websocket.owner_mismatch session=%s expected=%s actual=%s",
            session_id,
            user_email,
            current_account["user"]["email"],
        )
        await websocket.close(code=4403)
        return False
    return True


def _normalize_content_type(content_type: str | None) -> str:
    return str(content_type or "").split(";", 1)[0].strip().lower()


def _is_allowed_replay_media(filename: str | None, content_type: str | None) -> bool:
    normalized_content_type = _normalize_content_type(content_type)
    if normalized_content_type in ALLOWED_REPLAY_MEDIA_CONTENT_TYPES:
        return True
    return str(filename or "").lower().endswith((".webm", ".mp4", ".mov", ".m4a", ".wav", ".mp3", ".ogg"))


@app.post("/api/document/extract", response_model=DocumentExtractionResponse)
async def extract_document_text(
    file: UploadFile = File(...),
    current_account: dict = Depends(require_current_account),
) -> DocumentExtractionResponse:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Document file is empty")
    if len(data) > MAX_DOCUMENT_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="文档文件不能超过 20MB。")

    try:
        extraction = document_extraction_service.extract(
            filename=file.filename or "document",
            content_type=file.content_type,
            data=data,
        )
    except DocumentExtractionError as error:
        logging.getLogger("speak_up.session").warning(
            "document.extract.failed filename=%s content_type=%s bytes=%s error=%s",
            file.filename or "document",
            file.content_type,
            len(data),
            error,
        )
        raise HTTPException(status_code=400, detail=str(error)) from error

    if not extraction.text.strip():
        logging.getLogger("speak_up.session").warning(
            "document.extract.empty filename=%s kind=%s bytes=%s",
            file.filename or "document",
            extraction.kind,
            len(data),
        )
        raise HTTPException(status_code=400, detail="未能从文档中抽取到可用正文。")

    preview = await document_preview_service.build_preview(
        kind=extraction.kind,
        filename=file.filename or "document",
        content_type=file.content_type,
        data=data,
    )

    logging.getLogger("speak_up.session").info(
        "document.extract.done filename=%s kind=%s bytes=%s chars=%s preview_kind=%s preview_status=%s",
        file.filename or "document",
        extraction.kind,
        len(data),
        len(extraction.text),
        preview.kind,
        preview.status,
    )

    return DocumentExtractionResponse(
        kind=extraction.kind,
        filename=file.filename or "document",
        text=extraction.text,
        charCount=len(extraction.text),
        preview=preview,
    )


@app.post("/api/session/start", response_model=RealtimeSessionResponse)
async def start_session(
    payload: StartSessionRequest,
    request: Request,
    current_account: dict = Depends(require_current_account),
) -> RealtimeSessionResponse:
    session_id = uuid4().hex
    user_email = current_account["user"]["email"]
    await auth_service.reserve_session(email=user_email, session_id=session_id)
    try:
        session = session_manager.create_session(
            payload.scenarioId,
            payload.language,
            payload.coachProfileId,
            user_email=user_email,
            session_id=session_id,
        )
        await session_manager.report_job_service.register_session(
            session_id=session.session_id,
            scenario_id=payload.scenarioId,
            language=payload.language,
            coach_profile_id=session.coach_profile_id,
            user_email=user_email,
        )
    except Exception:
        await auth_service.release_session(email=user_email, session_id=session_id)
        raise
    websocket_url = _build_websocket_url(request, session.session_id, current_account["token"])
    return RealtimeSessionResponse(
        **session.to_schema().model_dump(),
        websocketUrl=websocket_url,
    )


@app.get("/api/session/{session_id}", response_model=RealtimeSession)
async def get_realtime_session(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> RealtimeSession:
    await _require_session_owner(session_id, current_account)
    session = session_manager.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_schema()


@app.post("/api/session/{session_id}/finish", response_model=RealtimeSession)
async def finish_session(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> RealtimeSession:
    existing_session = session_manager.get_session(session_id)
    if existing_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if existing_session.user_email and existing_session.user_email != current_account["user"]["email"]:
        raise HTTPException(status_code=403, detail="无权结束这个训练会话。")

    session = await session_manager.finish_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    await auth_service.release_session(
        email=session.user_email,
        session_id=session.session_id,
    )
    return session.to_schema()


@app.get("/api/session/{session_id}/report", response_model=SessionReport)
async def get_session_report(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> SessionReport:
    await _require_session_owner(session_id, current_account)
    report = await session_manager.report_job_service.get_report(session_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return report


@app.post("/api/session/{session_id}/report/generate", response_model=SessionReport)
async def generate_session_report(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> SessionReport:
    await _require_session_owner(session_id, current_account)
    try:
        report = await session_manager.report_job_service.trigger_final_report(session_id)
        if report is None:
            raise FileNotFoundError(session_id)
        return report
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error
    except Exception as error:
        logging.getLogger("speak_up.session").exception(
            "report.generate.failed session=%s error=%s",
            session_id,
            error,
        )
        raise HTTPException(status_code=500, detail="报告生成失败") from error


@app.get("/api/session/{session_id}/report/windows")
async def list_session_report_windows(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> list[dict]:
    await _require_session_owner(session_id, current_account)
    try:
        packs = await session_manager.report_job_service.list_window_packs(session_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error
    return [pack.model_dump() for pack in packs]


@app.get("/api/session/{session_id}/report/artifacts")
async def list_session_report_artifacts(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> list[dict]:
    await _require_session_owner(session_id, current_account)
    try:
        return await session_manager.report_job_service.list_artifacts(session_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error


@app.get("/api/session/{session_id}/report/signals")
async def get_session_report_signals(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> dict:
    await _require_session_owner(session_id, current_account)
    payload = await session_manager.report_job_service.get_signals(session_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return payload


@app.get("/api/session/{session_id}/replay", response_model=SessionReplay)
async def get_session_replay(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> SessionReplay:
    await _require_session_owner(session_id, current_account)
    replay = await session_manager.replay_service.build_replay(session_id)
    if replay is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return replay


@app.post("/api/session/{session_id}/replay/media", response_model=ReplayMediaUploadResponse)
async def upload_session_replay_media(
    session_id: str,
    file: UploadFile = File(...),
    duration_ms: int = Form(default=0),
    current_account: dict = Depends(require_current_account),
) -> ReplayMediaUploadResponse:
    await _require_session_owner(session_id, current_account)
    if not _is_allowed_replay_media(file.filename, file.content_type):
        raise HTTPException(status_code=400, detail="只支持 WebM、MP4、MOV、WAV、MP3、M4A 或 OGG 回放媒体。")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Replay media file is empty")
    if len(data) > MAX_REPLAY_MEDIA_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="回放媒体不能超过 512MB。")
    try:
        return await session_manager.replay_service.save_media(
            session_id,
            filename=file.filename,
            content_type=file.content_type,
            data=data,
            duration_ms=duration_ms,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error


@app.get("/api/session/{session_id}/replay/media", response_model=None)
async def get_session_replay_media(
    session_id: str,
    current_account: dict = Depends(require_current_account),
) -> FileResponse | RedirectResponse:
    await _require_session_owner(session_id, current_account)
    media = await session_manager.replay_service.get_media_file(session_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Replay media not found")
    if media.url:
        return RedirectResponse(media.url)
    if media.path is None:
        raise HTTPException(status_code=404, detail="Replay media not found")
    return FileResponse(
        path=media.path,
        media_type=media.content_type or "application/octet-stream",
        filename=media.path.name,
    )


@app.get("/api/session/{session_id}/qa/turns/{turn_id}/audio", response_model=None)
async def get_qa_turn_audio(
    session_id: str,
    turn_id: str,
    current_account: dict = Depends(require_current_account),
) -> FileResponse:
    await _require_session_owner(session_id, current_account)
    file_path = session_manager.qa_mode_orchestrator.get_audio_path(session_id, turn_id)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="QA audio not found")
    return FileResponse(path=file_path, media_type="audio/wav", filename=file_path.name)


@app.websocket("/ws/session/{session_id}")
async def session_websocket(websocket: WebSocket, session_id: str) -> None:
    session = session_manager.get_session(session_id)
    if session is None:
        await websocket.close(code=4404)
        return
    if not await _require_websocket_session_owner(websocket, session_id, session.user_email):
        return

    await session_manager.connect(session, websocket)

    try:
        while True:
            payload = await websocket.receive_json()
            message = ClientMessage.model_validate(payload)
            await session_manager.handle_client_message(session, message, websocket)
    except WebSocketDisconnect:
        session_manager.disconnect(session, websocket)
        return
