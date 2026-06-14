# Speak Up

[English](README.en.md) | 简体中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
3. 进入训练台前必须使用内测账号和密码登录；首次登录会在本地账号库自动创建账号记录。
4. 文档演讲可以使用内置练习文本，也可以上传 PDF/Markdown，前端带登录 token 调用 `POST /api/document/extract` 抽取正文。
5. 开始练习时，前端把登录 token 放在 `Authorization: Bearer <token>` 中调用 `POST /api/session/start`，同域部署下 WebSocket 通过安全 cookie 鉴权。
6. 浏览器采集麦克风 PCM 音频和摄像头画面，持续发给后端，并接收文字稿、Live Coach、问答和音频事件。
7. 结束练习时，前端尽量上传回放媒体，带登录 token 调用 `POST /api/session/{session_id}/finish`，后端累计当天训练时长并释放 active session，再跳转到 `/report`。
8. 报告页在后端生成报告期间轮询 `GET /api/session/{session_id}/report`。
9. 回放页调用 `GET /api/session/{session_id}/replay`，按时间轴同步展示文字稿和教练信号。

## 界面预览

### 主训练页

![Speak Up 主训练页](demo_image/main_page.png)

### AI 问答

![AI 问答模式](demo_image/interviewer.png)

### 回放复盘

![回放复盘页](demo_image/review.png)

### 训练建议

![训练建议展示](demo_image/suggestion.png)

## Star 趋势

[![Star History Chart](https://api.star-history.com/svg?repos=ImcLiuQian/speak_up&type=Date)](https://www.star-history.com/#ImcLiuQian/speak_up&Date)

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

前端本地开发会尝试连接 `http://127.0.0.1:8000` 和 `http://localhost:8000`；公网部署时默认走同域名反代的 `/api` 和 `/ws`。如需改后端地址，设置 `NEXT_PUBLIC_API_BASE_URL`。内测账号登录后的 session token hash、套餐和额度数据默认写入 SQLite。

本地账号和回放存储配置：

```bash
SPEAK_UP_AUTH_DB_PATH=output/auth_data/auth.sqlite3
SPEAK_UP_INTERNAL_ACCOUNTS='[{"account":"account-id","password":"password","displayName":"内测用户"}]'
SPEAK_UP_STORAGE_DRIVER=local

# 阿里云 OSS 回放存储，启用时把 SPEAK_UP_STORAGE_DRIVER 改成 oss
SPEAK_UP_OSS_BUCKET=...
SPEAK_UP_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
SPEAK_UP_OSS_ACCESS_KEY_ID=...
SPEAK_UP_OSS_ACCESS_KEY_SECRET=...
SPEAK_UP_OSS_PUBLIC_BASE_URL=https://cdn.example.com
SPEAK_UP_OSS_PREFIX=speak-up
```

`SPEAK_UP_OSS_PUBLIC_BASE_URL` 可为空；为空时后端会给回放生成短期签名地址，适合私有 bucket。

## 公网部署

公网域名访问需要 DNS、ECS 安全组、HTTPS 和反向代理同时就绪。仓库提供了可直接参考的配置：

- Nginx：`deploy/nginx/speakupcoach.cn.conf`
- systemd：`deploy/systemd/speak-up-backend.service`、`deploy/systemd/speak-up-frontend.service`
- 操作说明：`deploy/README.md`

`speakupcoach.cn` 和 `www.speakupcoach.cn` 需要解析到阿里云 ECS 公网 IP。公网训练页必须使用 HTTPS，否则浏览器不会给摄像头和麦克风权限。

## 环境变量

真实 AI 链路运行前，按 `.env.example` 准备环境变量。后端读取 shell 环境；如果需要让 Next.js 从文件读取前端变量，把 `NEXT_PUBLIC_*` 写到 `frontend/.env.local`。核心必填项是：

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

## 许可证

本项目使用 [MIT License](LICENSE)。
