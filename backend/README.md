# 后端

后端是 `backend/app` 下的 FastAPI 服务，负责实时会话编排、文档抽取、阿里云 realtime 模型连接、问答状态、报告素材、回放媒体和最终报告生成。

## 入口

- `app/main.py`：FastAPI app、CORS、HTTP 路由和会话 WebSocket。
- `app/schemas.py`：Pydantic 请求、响应、事件、报告、回放和问答模型。
- `app/services/session_manager.py`：每个实时会话的核心协调器。
- `requirements.txt`：FastAPI、uvicorn、Pydantic、httpx、websockets、python-multipart、pypdf。

## HTTP API

| Method | Path | 作用 |
| --- | --- | --- |
| `GET` | `/health` | 存活检查。 |
| `GET` | `/api/qa/voice-profiles` | 返回从 `ai_coach/profiles.json` 派生的教练声音画像。 |
| `POST` | `/api/auth/login` | 校验内测账号和密码；首次登录时自动创建本地账号记录。 |
| `GET` | `/api/auth/me` | 根据 `Authorization: Bearer <token>` 返回当前账号。 |
| `POST` | `/api/document/extract` | 登录后抽取并压缩 PDF 或 Markdown 正文，供问答上下文使用；单文件最大 20MB。 |
| `POST` | `/api/session/start` | 登录后创建实时会话，检查同账号 active session，并返回 WebSocket URL。 |
| `GET` | `/api/session/{session_id}` | 返回会话状态和计数器。 |
| `POST` | `/api/session/{session_id}/finish` | 登录后结束会话，释放 active session，并标记报告素材完结。 |
| `GET` | `/api/session/{session_id}/report` | 返回最终报告，或返回生成中的占位报告。 |
| `POST` | `/api/session/{session_id}/report/generate` | 触发最终报告生成。 |
| `GET` | `/api/session/{session_id}/report/windows` | 查看中间报告窗口。 |
| `GET` | `/api/session/{session_id}/report/artifacts` | 查看原始报告素材。 |
| `GET` | `/api/session/{session_id}/report/signals` | 查看重建后的文字稿、问答和教练信号统计。 |
| `GET` | `/api/session/{session_id}/replay` | 返回回放时间轴元数据。 |
| `POST` | `/api/session/{session_id}/replay/media` | 上传回放音频或视频；只接受常见音视频类型，单文件最大 512MB。 |
| `GET` | `/api/session/{session_id}/replay/media` | 下载回放媒体。 |
| `GET` | `/api/session/{session_id}/qa/turns/{turn_id}/audio` | 下载单轮问答音频。 |

## 账号与存储配置

内测账号池由后端配置管理，登录 session token hash 和 active session 写入 SQLite：

```bash
SPEAK_UP_AUTH_DATA_DIR=output/auth_data
SPEAK_UP_AUTH_DB_PATH=output/auth_data/auth.sqlite3

SPEAK_UP_INTERNAL_ACCOUNTS='[{"account":"account-id","password":"password","displayName":"内测用户"}]'
```

`SPEAK_UP_INTERNAL_ACCOUNTS` 必须在运行环境里配置；为空时登录接口会返回“内测账号池未配置”，避免把真实账号口令长期写进仓库。

回放媒体默认保存在本地报告目录。接阿里云 OSS 时设置：

```bash
SPEAK_UP_STORAGE_DRIVER=oss
SPEAK_UP_OSS_BUCKET=...
SPEAK_UP_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
SPEAK_UP_OSS_ACCESS_KEY_ID=...
SPEAK_UP_OSS_ACCESS_KEY_SECRET=...
SPEAK_UP_OSS_PUBLIC_BASE_URL=https://cdn.example.com
SPEAK_UP_OSS_PREFIX=speak-up
```

`SPEAK_UP_OSS_PUBLIC_BASE_URL` 可为空；为空时回放接口会生成短期签名 URL，适合私有 bucket。本地开发时把 `SPEAK_UP_STORAGE_DRIVER` 保持为 `local` 即可。

如果生产环境已经存在本地回放媒体，配置好 OSS 后可以迁移：

```bash
cd /srv/speak_up/backend
SPEAK_UP_STORAGE_DRIVER=oss \
SPEAK_UP_OSS_BUCKET=... \
SPEAK_UP_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com \
SPEAK_UP_OSS_ACCESS_KEY_ID=... \
SPEAK_UP_OSS_ACCESS_KEY_SECRET=... \
.venv/bin/python scripts/migrate_replay_media_to_oss.py --report-root output/report_data
```

迁移脚本会上传 `replay_media.*` 并把 `replay_media.json` 改为 OSS 元数据。默认会保留 ECS 本地媒体文件作为备份；确认 OSS 回放可用后，再追加 `--delete-local` 清理已迁移的本地媒体文件。如果元数据引用的本地媒体缺失，脚本默认失败并打印缺失记录；确认可以忽略时再追加 `--allow-missing`。

## WebSocket API

会话 WebSocket 路径是 `/ws/session/{session_id}`。同域部署默认用登录 cookie 完成 WebSocket 鉴权，服务端在连接时校验 session owner；只有显式设置 `SPEAK_UP_WEBSOCKET_TOKEN_IN_QUERY=true` 时，`POST /api/session/start` 返回的 `websocketUrl` 才会附带当前 token，用于跨域部署兜底。请求和事件结构定义在 `app/schemas.py` 的 `ClientMessage` 与事件模型中。

后端会限制同一个账号同时只能有一个 active session，避免同账号多开时互相覆盖训练状态。

客户端消息类型：

- 会话和传输：`ping`、`start_stream`、`audio_chunk`、`video_frame`。
- 问答控制：`start_qa`、`stop_qa`、`qa_prewarm_context`、`qa_request_question`、`qa_stop_answer`、`qa_select_voice_profile`。
- 问答音频播放生命周期：`qa_audio_playback_started`、`qa_audio_playback_ended`。

服务端事件类型：

- 会话和文字稿：`session_status`、`transcript_partial`、`transcript_final`、`pong`、`ack`、`error`。
- 实时教练：`coach_panel`。
- 问答：`qa_state`、`qa_question`、`qa_feedback`、`qa_voice_profiles`。
- 问答音频：`qa_audio`、`qa_audio_stream_start`、`qa_audio_stream_delta`、`qa_audio_stream_end`。

## 服务职责

| Service | Code | 职责 |
| --- | --- | --- |
| Session manager | `services/session_manager.py` | 创建会话、接收 WebSocket 消息、广播事件、记录报告素材，并协调所有实时服务。 |
| Realtime ASR | `services/stt_service.py` | 向阿里云实时 ASR 发送 PCM 音频，并回调 partial/final 文字稿。 |
| Omni live coach | `services/omni_service.py` | 运行语音内容和肢体视觉两条 Omni realtime 教练链路。 |
| Local speech analysis | `services/speech_analysis_service.py` | 基于文字稿生成本地规则反馈，例如口头禅和节奏。 |
| Coach panel | `services/coach_panel_service.py` | 维护三个实时反馈维度：肢体表情、语音节奏、内容表达。 |
| Q&A orchestrator | `services/qa_mode_orchestrator.py` | 管理问答阶段、上下文预热、声音画像选择、追问规划和答案收集。 |
| Q&A brain | `services/qa_brain_service.py` | 通过 OpenAI-compatible 阿里云接口生成参考摘要、问题和答案评估。 |
| Q&A realtime audio | `services/qa_omni_realtime_service.py` | 为问答轮次流式生成面试官音频和 transcript 事件。 |
| TTS | `services/tts_service.py` | 在需要文件式音频时生成问答音频。 |
| Document extraction | `services/document_extraction_service.py` | 支持 Markdown 和 PDF 文本抽取，并把上下文压缩到约 2000 字符。 |
| Report job | `services/report_job_service.py` | 记录素材、构建报告窗口、维护进度并触发最终报告。 |
| Report brain | `services/report_brain_service.py` | 生成窗口包和最终报告，并提供本地兜底评分与文案清洗。 |
| Replay | `services/replay_service.py` | 保存回放媒体，并重建文字稿和教练信号时间轴。 |

## 数据落盘

账号和登录数据默认写到后端进程工作目录下的 SQLite 数据库。如果从 `backend/` 目录启动服务，实际路径就是 `backend/output/auth_data/auth.sqlite3`。

- `users`：内测账号、昵称、兼容旧数据的密码哈希/legacy token 和创建时间。
- `auth_sessions`：登录 token 的 SHA-256 hash、账号、过期时间和最近访问时间。
- `active_sessions`：按账号记录当前进行中的训练 session，服务重启时会自动清空。

报告和回放数据默认写到后端进程工作目录下的 `output/report_data`。如果从 `backend/` 目录启动服务，实际路径就是 `backend/output/report_data`。

每个 session 目录可能包含：

- `session_core.json`：session id、场景和语言。
- `session_artifacts.jsonl`：文字稿、问答问题、教练信号、面板快照、会话结束事件。
- `report_state.json`：报告状态、进度和窗口覆盖信息。
- `windows/*.json`：中间报告窗口包。
- `final_report.json`：最终报告响应。
- `replay_media.*` 和 `replay_media.json`：本地上传的回放媒体和元数据；启用 OSS 后只保存元数据，视频对象写入 OSS。

## 评分维度

报告维度定义在 `services/report_domain.py`：

- 顶层维度：肢体、表情、语音语调、节奏、内容质量、表达结构。
- `general`、`host`、`guest-sharing`、`standup` 四类场景有不同权重。
- Live Coach 的三个维度通过 `COACH_TO_TOP_DIMENSIONS` 映射到报告顶层维度。

## 环境变量

后端从环境变量读取模型、接口和节奏配置。主要 provider key 是 `DASHSCOPE_API_KEY`。

高影响配置：

- `ALIYUN_REALTIME_ASR_MODEL`
- `ALIYUN_OMNI_COACH_MODEL`
- `ALIYUN_QA_OMNI_MODEL`
- `ALIYUN_QA_BRAIN_MODEL`
- `ALIYUN_REPORT_WINDOW_MODEL`
- `ALIYUN_REPORT_BRAIN_MODEL`
- `REPORT_WINDOW_BUILD_INTERVAL_SECONDS`
- `REPORT_WINDOW_MIN_MS`
- `QA_PREWARM_INTERVAL_SECONDS`
- `QA_AUTO_ADVANCE_DELAY_MS`
- `QA_MAX_QUESTION_TOPICS`
- `QA_MAX_FOLLOW_UPS_PER_QUESTION`

默认值见 `.env.example`。

## 修改注意事项

- 路由 schema 需要同步 `app/schemas.py`、`frontend/src/types/session.ts`、`frontend/src/types/report.ts` 和 `frontend/src/lib/api.ts`。
- 新增回放或报告素材时，需要更新 `ReportArtifactType`，由 `ReportJobService` 写入，再由 `ReportSignalService` 或 `ReplayService` 消费。
- 教练画像改动优先修改 `ai_coach/profiles.json`，前后端都会读取这个文件。
