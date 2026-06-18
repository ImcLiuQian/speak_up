"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { analyzeBodyVisualHint } from "@/lib/body-visual-hints";
import { getMediaCaptureBlockedMessage, getMediaCaptureUnavailableState } from "@/lib/media-permissions";
import type { CameraPermissionState, CapturedVideoFrame } from "@/types/session";

interface CameraPanelProps {
  children: React.ReactNode;
  isRunning: boolean;
  elapsedSeconds: number;
  cameraStream?: MediaStream | null;
  cameraPermissionState?: CameraPermissionState;
  onFrameCaptureReady?: (capture: () => Promise<CapturedVideoFrame | null>) => void;
  onStreamReady?: (stream: MediaStream | null) => void;
  variant?: "stage" | "inset";
}

const MAX_CAPTURE_WIDTH = 1280;
const MAX_CAPTURE_HEIGHT = 720;

function getCameraIssueCopy(permissionState: CameraPermissionState) {
  if (permissionState === "idle" || permissionState === "granted") {
    return null;
  }

  const title =
    permissionState === "insecure"
      ? "需要 HTTPS"
      : permissionState === "unavailable"
        ? "摄像头不可用"
        : "摄像头未授权";

  return {
    title,
    description: getMediaCaptureBlockedMessage(permissionState, "camera"),
  };
}

export function CameraPanel({
  children,
  cameraStream,
  cameraPermissionState,
  onFrameCaptureReady,
  onStreamReady,
  variant = "stage",
}: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamReadyCallbackRef = useRef(onStreamReady);
  const [localPermissionState, setLocalPermissionState] = useState<CameraPermissionState>("idle");
  const isExternallyManaged = cameraStream !== undefined;
  const permissionState = isExternallyManaged
    ? cameraPermissionState ?? (cameraStream ? "granted" : "idle")
    : localPermissionState;

  const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
  }, []);

  useEffect(() => {
    streamReadyCallbackRef.current = onStreamReady;
  }, [onStreamReady]);

  useEffect(() => {
    if (isExternallyManaged) {
      if (videoRef.current && videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
        if (cameraStream) {
          void videoRef.current.play().catch(() => {
            // The browser may delay playback until metadata is ready.
          });
        }
      }
      return () => {
        if (videoRef.current?.srcObject === cameraStream) {
          videoRef.current.srcObject = null;
        }
      };
    }

    let stream: MediaStream | null = null;

    async function enableCamera() {
      const unavailableState = getMediaCaptureUnavailableState();
      if (unavailableState) {
        setLocalPermissionState(unavailableState);
        streamReadyCallbackRef.current?.(null);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {
            // The browser may delay playback until metadata is ready.
          });
        }
        setLocalPermissionState("granted");
        streamReadyCallbackRef.current?.(stream);
      } catch {
        setLocalPermissionState("denied");
        streamReadyCallbackRef.current?.(null);
      }
    }

    enableCamera();

    return () => {
      streamReadyCallbackRef.current?.(null);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream, isExternallyManaged]);

  useEffect(() => {
    if (!onFrameCaptureReady) {
      return;
    }

    onFrameCaptureReady(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
      }

      const widthScale = MAX_CAPTURE_WIDTH / video.videoWidth;
      const heightScale = MAX_CAPTURE_HEIGHT / video.videoHeight;
      const scale = Math.min(1, widthScale, heightScale);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        return null;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.72);
      const bodyVisualHint = await analyzeBodyVisualHint(canvas);
      return bodyVisualHint ? { imageBase64, bodyVisualHint } : { imageBase64 };
    });
  }, [onFrameCaptureReady]);

  const issueCopy = getCameraIssueCopy(permissionState);

  if (variant === "inset") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] bg-transparent text-white">
        <div className="relative min-h-0 flex-1">
          {issueCopy ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[18px] bg-slate-950/70 px-4 text-center">
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{issueCopy.title}</div>
              <p className="text-xs leading-5 text-slate-400">{issueCopy.description}</p>
            </div>
          ) : (
            <>
              <video ref={handleVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,0.68),transparent_40%)]" />
              {children ? <div className="pointer-events-auto absolute bottom-3 right-3">{children}</div> : null}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border-white/60 bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
      <div className="relative min-h-0 flex-1">
        {issueCopy ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-300">{issueCopy.title}</div>
            <p className="max-w-md text-sm leading-7 text-slate-400">
              {issueCopy.description}
            </p>
          </div>
        ) : (
          <>
            <video ref={handleVideoRef} autoPlay playsInline muted className="h-full w-full object-cover opacity-85" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.25),transparent_35%),linear-gradient(to_top,rgba(2,6,23,0.7),transparent_38%)]" />
            {children ? <div className="absolute bottom-5 right-5">{children}</div> : null}
          </>
        )}
      </div>
    </Card>
  );
}
