# Speak Up

Speak Up 是一个演讲训练 Web 原型。当前代码是 Next.js 前端加 FastAPI 后端，支持自由演讲、文档演讲、实时 AI 教练、AI 追问、回放复盘和最终报告生成。

## 仓库结构

```text
speak_up/
├── frontend/                  # Next.js 前端项目根
├── backend/                   # FastAPI 后端
├── ai_coach/profiles.json     # 前后端共享的 AI 教练画像源
├── backend/requirements.txt   # 后端 Python 依赖
└── .env.example               # 运行环境变量模板
```

## 技术栈

- 前端：Next.js 16.2.2、React 19、TypeScript、Tailwind CSS 4、Recharts、MediaPipe Tasks Vision。
- 后端：FastAPI、Pydantic、httpx、websockets、pypdf。
- 外部 AI：通过环境变量配置阿里云 DashScope realtime 和 OpenAI-compatible 接口。
- 后端入口：`backend/app/main.py`。
- 前端入口：`frontend/src/app/page.tsx`，直接渲染 `SessionWorkspace`。

## 主流程

1. 用户打开 `/` 或 `/session`，两者都会进入 `SessionWorkspace`。
2. 前端从 `ai_coach/profiles.json` 读取教练画像，选择场景，再选择自由演讲或文档演讲模式。
3. 文档演讲可以使用内置练习文本，也可以上传 PDF/Markdown，前端调用 `POST /api/document/extract` 抽取正文。
4. 开始练习时，前端调用 `POST /api/session/start`，再连接 `/ws/session/{session_id}`。
5. 浏览器采集麦克风 PCM 音频和摄像头画面，持续发给后端，并接收文字稿、Live Coach、问答和音频事件。
6. 结束练习时，前端尽量上传回放媒体，调用 `POST /api/session/{session_id}/finish`，再跳转到 `/report`。
7. 报告页在后端生成报告期间轮询 `GET /api/session/{session_id}/report`。
8. 回放页调用 `GET /api/session/{session_id}/replay`，按时间轴同步展示文字稿和教练信号。

## 界面预览

### 主训练页

![Speak Up 主训练页](demo_image/main_page.png)

### AI 问答

![AI 问答模式](demo_image/interviewer.png)

### 回放复盘

![回放复盘页](demo_image/review.png)

### 训练建议

![训练建议展示](demo_image/suggestion.png)

## 本地运行

安装前端依赖：

```bash
cd frontend
npm install
```

启动前端：

```bash
cd frontend
npm run dev
```

安装后端依赖：

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

从 `backend/` 目录启动后端：

```bash
uvicorn app.main:app --reload
```

前端默认会尝试连接 `http://127.0.0.1:8000` 和 `http://localhost:8000`。如需改后端地址，设置 `NEXT_PUBLIC_API_BASE_URL`。

## 环境变量

真实 AI 链路运行前，按 `.env.example` 准备环境变量。后端通常从 shell 环境读取；如果需要让 Next.js 从文件读取前端变量，把 `NEXT_PUBLIC_*` 写到 `frontend/.env.local`。核心必填项是：

```bash
DASHSCOPE_API_KEY=...
```

主要配置组：

- ASR：`ALIYUN_REALTIME_ASR_MODEL`、`ALIYUN_REALTIME_ASR_URL`、`ALIYUN_REALTIME_ASR_SILENCE_DURATION_MS`。
- Live Coach：`ALIYUN_OMNI_COACH_MODEL`、`ALIYUN_OMNI_COACH_URL`、`ALIYUN_OMNI_COACH_SILENCE_DURATION_MS`。
- 问答：`ALIYUN_QA_OMNI_MODEL`、`ALIYUN_QA_BRAIN_MODEL`、`QA_MAX_QUESTION_TOPICS`、`QA_MAX_FOLLOW_UPS_PER_QUESTION`。
- 报告：`REPORT_WINDOW_BUILD_INTERVAL_SECONDS`、`ALIYUN_REPORT_WINDOW_MODEL`、`ALIYUN_REPORT_BRAIN_MODEL`。

## 质量检查

仓库提供前端 lint 命令：

```bash
cd frontend
npm run lint
```

后端常规验证方式是启动 FastAPI 后检查 `/health`、`/api/session/start` 和 WebSocket 会话链路。
