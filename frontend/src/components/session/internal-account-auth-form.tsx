"use client";

import { useState, type FormEvent } from "react";

import { loginWithPassword, saveStoredAuthToken, type AuthSession } from "@/lib/api";

interface InternalAccountAuthFormProps {
  loading?: boolean;
  compact?: boolean;
  tone?: "violet" | "slate";
  onSessionChange: (session: AuthSession) => void;
}

export function InternalAccountAuthForm({
  loading = false,
  compact = false,
  tone = "violet",
  onSessionChange,
}: InternalAccountAuthFormProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const normalizedAccount = account.trim();
  const submitDisabled = loading || busy || normalizedAccount.length < 3 || password.length === 0;

  const inputClassName = compact
    ? "h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
    : "h-[56px] w-full rounded-[22px] border border-[#dfe5ef] bg-white/94 py-0 pl-12 pr-3 text-sm font-semibold text-slate-950 shadow-[0_16px_34px_rgba(31,41,71,0.05)] outline-none transition placeholder:text-[#98a7bc] focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 sm:pl-14 sm:pr-4 sm:text-base";
  const buttonClassName =
    tone === "slate"
      ? "inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      : "mt-2 h-[62px] rounded-[24px] bg-[linear-gradient(135deg,#8f35ff_0%,#841df5_52%,#6411dc_100%)] px-4 text-[18px] font-semibold text-white shadow-[0_24px_48px_rgba(118,45,239,0.28)] transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (submitDisabled) {
      setError("请输入内测账号和密码。");
      return;
    }

    setBusy(true);
    try {
      const nextSession = await loginWithPassword(normalizedAccount, password);
      saveStoredAuthToken(nextSession.token);
      onSessionChange(nextSession);
      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "登录失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-2">
          <span className="text-xs font-semibold text-slate-600">内测账号</span>
          <input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder="请输入账号"
            autoComplete="username"
            inputMode="text"
            className={inputClassName}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold text-slate-600">密码</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            autoComplete="current-password"
            type="password"
            className={inputClassName}
          />
        </label>

        {error ? (
          <p className="break-words rounded-[16px] border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={submitDisabled} className={buttonClassName}>
          {busy ? "登录中..." : "登录"}
        </button>
      </form>
    );
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
      <label className="grid gap-2">
        <span className="text-[15px] font-semibold text-slate-700">内测账号</span>
        <span className="relative">
          <FieldUserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b8c1d1] sm:left-5" />
          <input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder="请输入内测账号"
            autoComplete="username"
            inputMode="text"
            required
            className={inputClassName}
          />
        </span>
      </label>

      <label className="grid gap-2">
        <span className="text-[15px] font-semibold text-slate-700">密码</span>
        <span className="relative">
          <FieldLockIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b8c1d1] sm:left-5" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            autoComplete="current-password"
            type={showPassword ? "text" : "password"}
            required
            className={`${inputClassName} pr-12 sm:pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={showPassword ? "隐藏口令" : "显示口令"}
          >
            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </span>
      </label>

      {error ? (
        <p className="break-words rounded-[16px] border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitDisabled} className={buttonClassName}>
        {busy ? "登录中..." : "进入训练台"}
      </button>
    </form>
  );
}

function FieldUserIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function FieldLockIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 3 18 18" strokeLinecap="round" />
      <path d="M10.6 10.6a3 3 0 0 0 2.8 2.8" />
      <path d="M9.5 5.3A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.4 3.3" />
      <path d="M6.2 6.9C3.8 8.7 2.5 12 2.5 12s3.5 7 9.5 7a10.7 10.7 0 0 0 5.1-1.3" />
    </svg>
  );
}
