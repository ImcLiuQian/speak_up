"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  clearStoredAuthToken,
  saveStoredAuthToken,
  subscribeAccount,
  type AuthSession,
} from "@/lib/api";
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

function formatMinutes(ms: number) {
  return `${Math.max(0, Math.floor(ms / 60000))} 分钟`;
}

function formatPaidUntil(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AccountSettingsButton({
  authSession,
  loading = false,
  notice,
  open,
  onOpenChange,
  onSessionChange,
}: AccountSettingsButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accountName = authSession?.user.displayName ?? "";
  const initials = useMemo(() => buildInitials(accountName), [accountName]);
  const paidUntil = formatPaidUntil(authSession?.user.paidUntil ?? null);

  const handleLogout = () => {
    clearStoredAuthToken();
    onSessionChange(null);
    setError(null);
  };

  const handleSubscribe = async () => {
    if (!authSession) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const nextSession = await subscribeAccount(authSession.token);
      saveStoredAuthToken(nextSession.token);
      onSessionChange(nextSession);
    } catch (subscribeError) {
      setError(subscribeError instanceof Error ? subscribeError.message : "模拟付费失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 md:bottom-5 md:left-5">
      {open ? (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-[380px] rounded-[24px] border border-white/70 bg-white/94 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">账号与设置</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                登录后才能开始训练，系统会按账号统计每日视频时长。
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

              <div className="mt-3 grid gap-2 text-xs text-slate-500">
                <div className="flex items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span>当前套餐</span>
                  <span className="font-semibold text-slate-800">
                    {authSession.user.plan === "paid" ? "付费版" : "免费版"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span>今日已用</span>
                  <span className="font-semibold text-slate-800">{formatMinutes(authSession.quota.completedMs)}</span>
                </div>
                <div className="flex items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span>今日剩余</span>
                  <span className="font-semibold text-emerald-700">{formatMinutes(authSession.quota.remainingMs)}</span>
                </div>
                {paidUntil ? (
                  <div className="flex items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <span>有效期至</span>
                    <span className="font-semibold text-slate-800">{paidUntil}</span>
                  </div>
                ) : null}
              </div>

              {authSession.user.plan !== "paid" ? (
                <button
                  type="button"
                  disabled={busy || loading}
                  onClick={handleSubscribe}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(109,40,217,0.22)] transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  30 元/月解锁每日 120 分钟
                </button>
              ) : null}

              {error ? (
                <p className="mt-3 rounded-[14px] bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {error}
                </p>
              ) : null}

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
                setError(null);
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
