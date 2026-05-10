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
| `POST` | `/api/document/extract` | 抽取并压缩 PDF 或 Markdown 正文，供问答上下文使用。 |
| `POST` | `/api/session/start` | 创建实时会话并返回 WebSocket URL。 |
| `GET` | `/api/session/{session_id}` | 返回会话状态和计数器。 |
| `POST` | `/api/session/{session_id}/finish` | 结束会话，并标记报告素材完结。 |
| `GET` | `/api/session/{session_id}/report` | 返回最终报告，或返回生成中的占位报告。 |
| `POST` | `/api/session/{session_id}/report/generate` | 触发最终报告生成。 |
| `GET` | `/api/session/{session_id}/report/windows` | 查看中间报告窗口。 |
| `GET` | `/api/session/{session_id}/report/artifacts` | 查看原始报告素材。 |
| `GET` | `/api/session/{session_id}/report/signals` | 查看重建后的文字稿、问答和教练信号统计。 |
| `GET` | `/api/session/{session_id}/replay` | 返回回放时间轴元数据。 |
| `POST` | `/api/session/{session_id}/replay/media` | 上传回放音频或视频。 |
| `GET` | `/api/session/{session_id}/replay/media` | 下载回放媒体。 |
| `GET` | `/api/session/{session_id}/qa/turns/{turn_id}/audio` | 下载单轮问答音频。 |

## WebSocket API

会话 WebSocket 路径是 `/ws/session/{session_id}`。请求和事件结构定义在 `app/schemas.py` 的 `ClientMessage` 与事件模型中。

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

报告和回放数据默认写到后端进程工作目录下的 `output/report_data`。如果从 `backend/` 目录启动服务，实际路径就是 `backend/output/report_data`。

每个 session 目录可能包含：

- `session_core.json`：session id、场景和语言。
- `session_artifacts.jsonl`：文字稿、问答问题、教练信号、面板快照、会话结束事件。
- `report_state.json`：报告状态、进度和窗口覆盖信息。
- `windows/*.json`：中间报告窗口包。
- `final_report.json`：最终报告响应。
- `replay_media.*` 和 `replay_media.json`：上传的回放媒体和元数据。

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
