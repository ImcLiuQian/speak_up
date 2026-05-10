# 前端

前端是 `frontend/` 下的 Next.js 16 应用，核心源码在 `frontend/src/`。它负责演讲训练工作台、麦克风和摄像头采集、实时 WebSocket 通信、Live Coach 展示、AI 问答、报告页和回放页。

## 路由

| Route | File | 作用 |
| --- | --- | --- |
| `/` | `app/page.tsx` | 主训练工作台。 |
| `/session` | `app/session/page.tsx` | 同一个工作台，便于承接 `scenario` 和 `coach` 查询参数。 |
| `/report` | `app/report/page.tsx`、`app/report/report-client.tsx` | 最终报告页，报告生成中会轮询。 |
| `/session/[sessionId]/replay` | `app/session/[sessionId]/replay/page.tsx` | 回放媒体、文字稿和教练信号时间轴。 |

`app/layout.tsx` 用 `SessionProvider` 包住整个应用。

## 主要组件

| Component | 职责 |
| --- | --- |
| `SessionWorkspace` | 顶层训练流程，包括模式切换、文档上传、教练选择、问答开关、回放录制和结束跳转。 |
| `SessionToolbar` | 自由演讲/文档演讲切换、内置练习选择、文档上传、计时器和开始/结束控制。 |
| `SessionStage` | 在文档展示、摄像头舞台和问答分屏之间切换。 |
| `CameraPanel` | 摄像头预览和画面帧捕获注册。 |
| `DocumentStage`、`DocumentPreviewPanel` | 文档演讲展示区域。 |
| `QAAvatarPanel`、`QAControlBar` | AI 面试官展示、音频播放生命周期和问答控制。 |
| `LiveAnalysisPanel` | 三条实时教练反馈栏。 |
| `TranscriptPanel` | 实时 partial 和已提交文字稿展示。 |
| `SessionProvider` | 跨 `/report` 和回放路由保存报告、文字稿、回放媒体和报告轮询状态。 |

报告组件在 `components/report` 下，负责总结、雷达图、建议、生成进度和加载态展示。

## 客户端运行链路

1. `SessionWorkspace` 读取 `scenario` 和 `coach` 查询参数，默认回落到 `general` 和第一位教练。
2. 教练数据来自 `ai_coach/profiles.json`，通过 `lib/coach-profiles.ts` 暴露给 UI。
3. 页面默认进入文档演讲模式，并加载一段内置练习文本。
4. 上传 PDF 或 Markdown 时，`lib/api.ts` 的 `extractDocumentText` 会调用 `/api/document/extract`。
5. 开始训练时，`startRealtimeSession` 调用后端创建会话，随后打开返回的 WebSocket，发送 `start_stream`，再开始摄像头帧和麦克风采集。
6. `useMockSession` 通过 `/audio/pcm-capture.worklet.js` 捕获麦克风音频，重采样到 16 kHz PCM，做能量门限和声纹门限过滤，再发送 `audio_chunk`。
7. 摄像头画面每秒发送一次，并可附带 `lib/body-visual-hints.ts` 基于 MediaPipe 识别出的本地肢体提示。
8. WebSocket 事件会更新文字稿、Live Coach 面板、问答状态、问答问题、问答反馈和问答流式音频。
9. 结束训练时，前端停止采集、尽量上传回放媒体、把报告状态写入 `SessionProvider`，然后跳转 `/report`。
10. 报告页轮询后端报告状态，直到 `processing` 结束。
11. 回放页加载后端回放元数据；如果媒体上传还没同步完成，会优先使用本地缓存的回放媒体。

## API 层

`src/lib/api-base.ts` 按下面顺序选择后端地址：

1. `NEXT_PUBLIC_API_BASE_URL`
2. 当前浏览器 hostname 的 `8000` 端口
3. `http://127.0.0.1:8000`
4. `http://localhost:8000`

`src/lib/api.ts` 封装所有 HTTP 请求，并导出 `useMockSession` 使用的 outbound WebSocket 消息类型。

这些文件需要和后端 schema 保持一致：

- `src/types/session.ts`
- `src/types/report.ts`
- `src/lib/api.ts`
- `backend/app/schemas.py`

## 媒体和实时细节

- 麦克风采集使用 `navigator.mediaDevices.getUserMedia`，开启回声消除、降噪、自动增益，目标为单声道 16 kHz。
- 音频帧由 `public/audio/pcm-capture.worklet.js` 收集，并以 base64 PCM 发送。
- `useMockSession` 会在发送前尽量过滤 AI 面试官声音和背景人声。
- 摄像头采集使用浏览器 video API；肢体提示使用从 CDN 加载的 MediaPipe face 和 hand 模型。
- 回放录制使用 `MediaRecorder` 合并摄像头视频轨和麦克风音频轨。
- 问答音频优先播放流式 PCM chunk，也可以回落到后端音频文件 URL。

## UI 类型

核心前端类型在 `src/types/session.ts`：

- `ScenarioType`：`general`、`host`、`guest-sharing`、`standup`。
- `TrainingMode`：`free_speech`、`document_speech`。
- `CoachDimensionId`：`body_expression`、`voice_pacing`、`content_expression`。
- `QAPhase`：idle、preparing context、AI asking、user answering、evaluating、ready next turn、completed。

报告类型在 `src/types/report.ts`，对应后端 `SessionReport` 响应。

## 修改注意事项

- 排查训练流程时，先看 `SessionWorkspace`。
- 排查实时传输、音频采集、文字稿清洗或问答音频播放时，先看 `useMockSession`。
- 排查报告页和回放页之间的跨路由状态时，先看 `SessionProvider`。
- 新增后端事件字段时，需要更新 `src/lib/api.ts` 的 `RealtimeEvent`，并在 `useMockSession` 增加对应 UI 处理。
