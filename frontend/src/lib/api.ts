import type { SessionReport } from "@/types/report";
import type {
  BodyVisualHint,
  CoachPanelState,
  CoachProfileId,
  QAFeedback,
  QAAudioStreamDelta,
  QAAudioStreamEnd,
  QAAudioStreamStart,
  QAQuestion,
  QAState,
  LanguageOption,
  ScenarioType,
  SessionReplay,
  TrainingMode,
  TranscriptChunk,
  VoiceProfile,
} from "@/types/session";
import { getApiBaseUrlCandidates, resolveApiUrlWithBase } from "@/lib/api-base";

export const AUTH_TOKEN_STORAGE_KEY = "speak_up.auth_token";
export const AUTH_SESSION_INVALID_EVENT = "speak_up.auth_session_invalid";
const AUTH_TOKEN_COOKIE_NAME = "speak_up_auth_token";
const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function resolveApiUrl(url: string | null | undefined) {
  return resolveApiUrlWithBase(url);
}

function buildAuthHeaders(token: string | null | undefined) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }
  const tokenCookie = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_TOKEN_COOKIE_NAME}=`));

  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.slice(AUTH_TOKEN_COOKIE_NAME.length + 1)) || null;
}

export function saveStoredAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${AUTH_TOKEN_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttribute}`;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return;
  }
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_INVALID_EVENT));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response | null = null;
  let lastError: unknown = null;
  const baseUrls = getApiBaseUrlCandidates();

  for (const baseUrl of baseUrls) {
    try {
      response = await fetch(resolveApiUrlWithBase(path, baseUrl), {
        cache: "no-store",
        ...init,
        headers,
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    const detail = lastError instanceof Error ? lastError.message : "unknown network error";
    throw new Error(
      `无法连接后端服务，已尝试：${baseUrls.join("、")}。请确认 API 正在运行：${detail}`,
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (response.status === 401) {
      clearStoredAuthToken();
    }
    if (contentType.includes("application/json")) {
      const payload = await response.json().catch(() => null);
      const detail = typeof payload?.detail === "string" ? payload.detail : null;
      throw new Error(detail ?? `Request failed: ${response.status}`);
    }
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface RealtimeSession {
  sessionId: string;
  scenarioId: ScenarioType;
  language: LanguageOption;
  coachProfileId: CoachProfileId | null;
  status: "created" | "streaming" | "finished";
  transcriptCount: number;
  audioChunkCount: number;
  videoFrameCount: number;
}

export interface RealtimeSessionResponse extends RealtimeSession {
  websocketUrl: string;
  quota: AccountQuota | null;
  maxSessionDurationMs: number;
}

export interface RealtimeEvent {
  type: string;
  status: "created" | "streaming" | "finished" | null;
  sessionId: string | null;
  text: string | null;
  message: string | null;
  chunk: TranscriptChunk | null;
  replacePrevious?: boolean;
  coachPanel?: CoachPanelState | null;
  qaState?: QAState | null;
  question?: QAQuestion | null;
  feedback?: QAFeedback | null;
  sampleRateHz?: number | null;
  channels?: number | null;
  audioBase64?: string | null;
  voiceProfileId?: string | null;
  audioStreamStart?: QAAudioStreamStart | null;
  audioStreamDelta?: QAAudioStreamDelta | null;
  audioStreamEnd?: QAAudioStreamEnd | null;
  turnId?: string | null;
  audioUrl?: string | null;
  durationMs?: number | null;
  voiceProfiles?: VoiceProfile[] | null;
}

export function getSessionReport(sessionId: string, token: string | null = getStoredAuthToken()) {
  return request<SessionReport>(`/api/session/${sessionId}/report`, {
    headers: buildAuthHeaders(token),
  });
}

export function triggerSessionReportGeneration(sessionId: string, token: string | null = getStoredAuthToken()) {
  return request<SessionReport>(`/api/session/${sessionId}/report/generate`, {
    method: "POST",
    headers: buildAuthHeaders(token),
  });
}

export function getSessionReplay(sessionId: string, token: string | null = getStoredAuthToken()) {
  return request<SessionReplay>(`/api/session/${sessionId}/replay`, {
    headers: buildAuthHeaders(token),
  });
}

export interface ReplayMediaUploadResult {
  mediaUrl: string;
  mediaType: "audio" | "video";
  durationMs: number;
}

export function uploadSessionReplayMedia(
  sessionId: string,
  file: File,
  durationMs: number,
  token: string | null = getStoredAuthToken(),
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("duration_ms", String(Math.max(0, Math.round(durationMs))));
  return request<ReplayMediaUploadResult>(`/api/session/${sessionId}/replay/media`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: formData,
  });
}

export interface AccountUser {
  email: string;
  displayName: string;
  plan: "free" | "paid";
  paidUntil: string | null;
  createdAt: string | null;
}

export interface AccountQuota {
  date: string;
  limitMs: number;
  completedMs: number;
  remainingMs: number;
  activeSessionId: string | null;
  activeStartedAt: string | null;
}

export interface AuthSession {
  token: string;
  user: AccountUser;
  quota: AccountQuota;
  priceCny: number;
}

export function loginWithPassword(account: string, password: string) {
  return request<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ account, password }),
  });
}

export function getCurrentAccount(token: string) {
  return request<AuthSession>("/api/auth/me", {
    headers: buildAuthHeaders(token),
  });
}

export function subscribeAccount(token: string) {
  return request<AuthSession>("/api/billing/subscribe", {
    method: "POST",
    headers: buildAuthHeaders(token),
  });
}

export function startRealtimeSession(
  scenarioId: ScenarioType,
  language: LanguageOption,
  coachProfileId: CoachProfileId,
  token: string | null,
) {
  return request<RealtimeSessionResponse>("/api/session/start", {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify({ scenarioId, language, coachProfileId }),
  });
}

export function finishRealtimeSession(sessionId: string, token: string | null) {
  return request<RealtimeSession>(`/api/session/${sessionId}/finish`, {
    method: "POST",
    headers: buildAuthHeaders(token),
  });
}

export function getQAVoiceProfiles() {
  return request<VoiceProfile[]>("/api/qa/voice-profiles");
}

export interface DocumentExtractionResult {
  kind: "pdf" | "md";
  filename: string;
  text: string;
  charCount: number;
  preview: {
    kind: "none" | "pdf";
    status: "ready" | "unavailable";
    message: string | null;
  };
}

export function extractDocumentText(file: File, token: string | null = getStoredAuthToken()) {
  const formData = new FormData();
  formData.append("file", file);
  return request<DocumentExtractionResult>("/api/document/extract", {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: formData,
  });
}

export interface OutboundRealtimeMessage {
  type:
    | "ping"
    | "start_stream"
    | "audio_chunk"
    | "video_frame"
    | "start_qa"
    | "stop_qa"
    | "qa_prewarm_context"
    | "qa_select_voice_profile"
    | "qa_audio_playback_started"
    | "qa_audio_playback_ended";
  timestamp_ms?: number;
  payload?: string;
  turn_id?: string;
  image_base64?: string;
  body_visual_hint?: BodyVisualHint;
  mime_type?: string;
  sample_rate_hz?: number;
  channels?: number;
  training_mode?: TrainingMode;
  voice_profile_id?: string;
  document_name?: string;
  document_text?: string;
  manual_text?: string;
}
