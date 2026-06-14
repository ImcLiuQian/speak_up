import type { CameraPermissionState } from "@/types/session";

export type MediaCaptureKind = "camera" | "microphone";

const CAPTURE_KIND_LABEL: Record<MediaCaptureKind, string> = {
  camera: "摄像头",
  microphone: "麦克风",
};

export function getMediaCaptureUnavailableState(): Exclude<
  CameraPermissionState,
  "idle" | "granted" | "denied"
> | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }

  if (!window.isSecureContext) {
    return "insecure";
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "unavailable";
  }

  return null;
}

export function getMediaCaptureBlockedMessage(
  state: Exclude<CameraPermissionState, "idle" | "granted">,
  kind: MediaCaptureKind,
) {
  const label = CAPTURE_KIND_LABEL[kind];

  if (state === "insecure") {
    return `当前公网地址是 HTTP，浏览器不会弹出${label}授权框。请使用 HTTPS 域名或 localhost 访问。`;
  }

  if (state === "unavailable") {
    return `当前浏览器不支持${label}采集。`;
  }

  return `${label}未授权，请在浏览器地址栏左侧允许${label}后刷新页面。`;
}
