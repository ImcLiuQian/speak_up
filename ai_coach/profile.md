# AI 教练画像

AI 教练画像的事实源是 `ai_coach/profiles.json`。前端在 `frontend/src/lib/coach-profiles.ts` 读取它；后端在 `backend/app/services/voice_profile_service.py` 读取同一份 JSON。

## 数据契约

`profiles.json` 每一项包含：

- `id`：稳定画像 id，用于 URL 查询参数、API payload、问答声音选择和报告元数据。
- `name`：UI 展示的教练名。
- `persona_type`：教练行为类型，也会映射到后端 `VoiceStyle`。
- `origin_name`：可读的灵感来源标签。
- `avatar_file`：头像文件名，前端期望文件位于 `frontend/public/ai-coach/`。
- `slogan`、`bio`、`live_status`：教练选择和 live 状态展示文案。
- `voice_profile`：前端展示用的声音描述。
- `qa_style`：后端问答服务使用的声音 id 和提示词。
- `report_style`：后端报告生成使用的写作风格指令和示例。

前端把 `avatar_file` 映射成 `/ai-coach/{avatar_file}`。后端把画像 id 映射成 `/api/qa/voice-profiles` 返回的 `VoiceProfile`。

## 当前画像

| id | name | persona | backend style | voice label | provider voice | omni voice |
| --- | --- | --- | --- | --- | --- | --- |
| `duojiong_he` | 何多炅 | 温暖型 | `gentle` | 何多炅 · 温暖型教练 | `Ethan` | `Raymond` |
| `youge_hu` | 胡有歌 | 严肃型 | `professional` | 胡有歌 · 严肃型教练 | `Ethan` | `Raymond` |
| `xiaoling_jia` | 贾小玲 | 鼓励型 | `encouraging` | 贾小玲 · 鼓励型教练 | `Serena` | `Liora Mira` |
| `daxing_jin` | 金大星 | 压力型 | `firm` | 金大星 · 压力型教练 | `Serena` | `Liora Mira` |

`VoiceProfileService` 当前硬编码了 gender 映射：

- `duojiong_he`：male
- `youge_hu`：male
- `xiaoling_jia`：female
- `daxing_jin`：female

## 画像行为

### 何多炅

- 类型：温暖、耐心、安抚。
- 声音记忆点：放松、有微笑感的深夜电台男声。
- 问答行为：缓解焦虑，用温和承接语，但仍然追关键点。
- 报告行为：鼓励、有陪伴感，同时保留专业判断。

### 胡有歌

- 类型：严肃、克制、锋利。
- 声音记忆点：低频、稳重、有电影旁白感。
- 问答行为：问题直接，推动用户讲核心观点。
- 报告行为：简洁明确，强调优先级，减少情绪化夸奖。

### 贾小玲

- 类型：热情、鼓励、高能量。
- 声音记忆点：综艺气氛组式的跃动感。
- 问答行为：先肯定，再把用户往前推一步。
- 报告行为：先指出亮点，再给改进动作，降低挫败感。

### 金大星

- 类型：高压、干脆、要求高。
- 声音记忆点：锋利的职场高管式表达。
- 问答行为：要求更清晰、更准确，但不做人身攻击。
- 报告行为：直接、行动导向、标准清楚，同时保持专业边界。

## 使用方式

- 教练选择 UI 通过 `getCoachProfiles()` 读取全部画像。
- 默认教练是 `profiles.json` 的第一项。
- URL 查询参数 `coach` 会通过 `isCoachProfileId()` 校验。
- 会话启动时，前端把 `coachProfileId` 发给后端。
- 后端对未知或缺失 id 会回落到第一项画像。
- 问答 realtime 指令使用所选画像的 `instructions_zh` 或 `instructions_en`。
- 报告生成可以使用 `report_style.instruction_zh` 和维度示例。

## 修改清单

新增或修改画像时：

1. 修改 `ai_coach/profiles.json`。
2. 把公开头像放到 `frontend/public/ai-coach/`。
3. 如果新 id 需要非默认 gender 或 style，在 `VoiceProfileService` 中补映射。
4. 通过 `frontend/src/lib/coach-profiles.ts` 检查前端画像渲染。
5. 检查 `provider_voice_id` 和 `omni_voice_id` 是否在问答声音链路中可用。
