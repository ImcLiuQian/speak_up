"use client";

import Image from "next/image";
import { useMemo } from "react";

import { clearStoredAuthToken, type AuthSession } from "@/lib/api";
import { InternalAccountAuthForm } from "@/components/session/internal-account-auth-form";

interface AccountSettingsButtonProps {
  authSession: AuthSession | null;
  loading?: boolean;
  notice?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionChange: (session: AuthSession | null) => void;
}

function buildInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "SU";
  }

  const asciiWords = trimmed.match(/[A-Za-z0-9]+/g);
  if (asciiWords?.length) {
    return asciiWords
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }

  return trimmed.slice(0, 2);
}

export function AccountSettingsButton({
  authSession,
  loading = false,
  notice,
  open,
  onOpenChange,
  onSessionChange,
}: AccountSettingsButtonProps) {
  const accountName = authSession?.user.displayName ?? "";
  const initials = useMemo(() => buildInitials(accountName), [accountName]);

  const handleLogout = () => {
    clearStoredAuthToken();
    onSessionChange(null);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 md:bottom-5 md:left-5">
      {open ? (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-[380px] rounded-[24px] border border-white/70 bg-white/94 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">账号与设置</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                登录后可以开始训练，训练记录会归属到你的账号。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="关闭账号设置"
            >
              ×
            </button>
          </div>

          {notice ? (
            <p className="mt-3 rounded-[14px] bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {notice}
            </p>
          ) : null}

          {authSession ? (
            <div className="mt-4">
              <div className="flex items-center gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50 p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-emerald-600 text-sm font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{authSession.user.displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-emerald-700">{authSession.user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                退出登录
              </button>
            </div>
          ) : (
            <InternalAccountAuthForm
              compact
              tone="slate"
              loading={loading}
              onSessionChange={(session) => {
                onSessionChange(session);
              }}
            />
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-white/70 bg-white/92 px-2.5 py-2 pr-4 text-sm font-semibold text-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur transition hover:bg-white"
        aria-expanded={open}
        aria-label={authSession ? "打开账号设置" : "登录 Speak Up"}
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-xs font-semibold text-white">
          {authSession ? (
            initials
          ) : (
            <Image
              src="/brand/speakup-logo-pure.png"
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          )}
        </span>
        <span className="truncate">{authSession ? authSession.user.displayName : "登录"}</span>
      </button>
    </div>
  );
}
