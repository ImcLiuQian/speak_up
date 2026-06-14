"use client";

import Image from "next/image";

import { InternalAccountAuthForm } from "@/components/session/internal-account-auth-form";
import { SiteFooter } from "@/components/site/site-footer";
import { type AuthSession } from "@/lib/api";

interface LoginGateProps {
  loading?: boolean;
  onSessionChange: (session: AuthSession) => void;
}

const featureRows = [
  {
    detail: "高精度生成文字稿，聚焦每一句表达",
    icon: <TranscriptIcon />,
    accent: "wave",
  },
  {
    detail: "语速、停顿、重音智能分析与建议",
    icon: <RhythmIcon />,
    accent: "bars",
  },
  {
    detail: "模拟提问与追问，提升临场应对能力",
    icon: <QuestionIcon />,
    accent: "chat",
  },
  {
    detail: "视频复盘与结构化报告，复盘更高效",
    icon: <ReplayIcon />,
    accent: "progress",
  },
] as const;

const coachCards = [
  {
    name: "暖声教练",
    line: "先稳住表达，再打磨细节。",
    image: "/ai-coach/warm-voice-coach.jpg",
    className: "left-[745px] top-[151px] z-30 h-[256px] w-[214px] rotate-[5deg]",
    imageClassName: "h-[180px]",
  },
  {
    name: "锋芒教练",
    line: "逻辑清晰，观点有力。",
    image: "/ai-coach/sharp-logic-coach.jpg",
    className: "left-[597px] top-[292px] z-20 h-[250px] w-[205px] rotate-[-7deg]",
    imageClassName: "h-[174px]",
  },
  {
    name: "元气教练",
    line: "能量在线，感染全场。",
    image: "/ai-coach/bright-energy-coach.jpg",
    className: "left-[790px] top-[424px] z-40 h-[251px] w-[207px] rotate-[7deg]",
    imageClassName: "h-[176px]",
  },
] as const;

const quotaItems = [
  {
    title: "10 分钟",
    subtitle: "免费额度",
    icon: <ClockIcon />,
    iconClassName: "text-violet-500",
  },
  {
    title: "120 分钟",
    subtitle: "付费额度",
    icon: <CrownIcon />,
    iconClassName: "text-amber-500",
  },
  {
    title: "复盘与",
    subtitle: "报告",
    icon: <ReportIcon />,
    iconClassName: "text-sky-500",
  },
] as const;

export function LoginGate({ loading = false, onSessionChange }: LoginGateProps) {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#e8edf4] p-4 text-slate-950 md:p-[26px]">
      <section className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full min-w-0 max-w-[1504px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[26px] shadow-[0_30px_100px_rgba(15,23,42,0.16)] md:min-h-[calc(100dvh-52px)] xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-3">
        <div className="relative hidden min-w-0 overflow-hidden rounded-[24px] bg-[#020b1b] xl:block" style={{ containerType: "inline-size" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(77,45,151,0.18)_0%,transparent_28%),radial-gradient(circle_at_86%_40%,rgba(30,70,118,0.19)_0%,transparent_32%),linear-gradient(135deg,#111426_0%,#071225_48%,#020a18_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.045)_0%,transparent_33%,rgba(123,91,255,0.06)_100%)]" />
          <div className="absolute left-0 top-0 h-[847px] w-[1050px] origin-top-left" style={{ transform: "scale(min(1, calc(100cqw / 1050)))" }}>
            <DecorativeWaves className="absolute bottom-[188px] right-[-44px] h-[150px] w-[520px] text-violet-600/25" />

            <div className="absolute left-[34px] top-[34px] flex items-center gap-3">
              <span className="relative h-[52px] w-[52px] overflow-hidden rounded-[13px] shadow-[0_12px_26px_rgba(126,50,255,0.28)]">
                <Image
                  src="/landing-assets/speakup-logo-purple.png"
                  alt="Speak Up"
                  fill
                  unoptimized
                  priority
                  sizes="52px"
                  className="object-cover"
                />
              </span>
              <span>
                <span className="block text-[20px] font-semibold leading-6 text-white">Speak Up</span>
                <span className="mt-1 block text-[15px] font-medium leading-5 text-slate-400">AI 演讲训练台</span>
              </span>
            </div>

            <div className="absolute right-[40px] top-[40px] rounded-full border border-white/14 bg-white/[0.07] px-4 py-2 text-sm font-semibold text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              登录后进入训练台
            </div>

            <section className="absolute left-[49px] top-[163px] w-[540px]">
              <h1 className="text-[52px] font-semibold leading-[1.14] tracking-[0] text-white">
                让每一位小伙伴
                <span className="block text-[#d8c9ff]">自信大方地开口说！</span>
              </h1>
              <p className="mt-5 text-[17px] font-medium leading-7 text-slate-300">
                把每一次练习都蓄成上台的能量，开口更稳，表达更亮。
              </p>
            </section>

            <section className="absolute left-[49px] top-[379px] grid w-[520px] gap-[14px]">
              {featureRows.map((feature) => (
                <FeatureRow key={feature.detail} feature={feature} />
              ))}
            </section>

            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {coachCards.map((coach) => (
                <CoachCard key={coach.name} coach={coach} />
              ))}
            </div>

            <Timeline className="absolute bottom-[57px] left-[48px] h-[92px] w-[930px]" />
          </div>
        </div>

        <aside className="relative flex min-h-[calc(100dvh-2rem)] min-w-0 items-center justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#fdfbff_0%,#fbf8ff_47%,#f1e6ff_100%)] px-5 py-8 md:min-h-[calc(100dvh-52px)] md:px-8 xl:px-7">
          <div className="pointer-events-none absolute -right-40 -top-28 h-[560px] w-[560px] rounded-full border border-violet-100/50 bg-white/20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.20),transparent_68%)]" />

          <section className="relative z-10 w-full min-w-0 max-w-full sm:max-w-[388px]">
            <div className="mb-9 flex items-center gap-3 xl:hidden">
              <span className="relative flex h-12 w-12 overflow-hidden rounded-[14px] shadow-[0_10px_24px_rgba(126,50,255,0.22)]">
                <Image
                  src="/landing-assets/speakup-logo-purple.png"
                  alt="Speak Up"
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                  sizes="48px"
                />
              </span>
              <span>
                <span className="block text-base font-semibold text-slate-950">Speak Up</span>
                <span className="block text-xs font-medium text-slate-500">AI 演讲训练台</span>
              </span>
            </div>

            <p className="text-[16px] font-semibold text-violet-700">登录后开始训练</p>
            <h2 className="mt-2 text-[2.75rem] font-semibold leading-[0.98] text-[#071023]">
              {loading ? "检查中" : "登录"}
            </h2>
            <p className="mt-2 max-w-[31ch] text-[14px] font-semibold leading-6 text-slate-500">
              输入内测账号和密码，进入你的训练台。
            </p>

            <InternalAccountAuthForm loading={loading} onSessionChange={onSessionChange} />
            <QuotaSummary />
          </section>
        </aside>
      </section>
      <SiteFooter className="pointer-events-auto fixed inset-x-4 bottom-1 z-20 md:bottom-2" />
    </main>
  );
}

function QuotaSummary() {
  return (
    <section className="mt-4" aria-label="训练额度说明">
      <div className="flex items-center gap-5">
        <span className="h-px flex-1 bg-slate-200/70" />
        <span className="text-center text-[13px] font-semibold text-slate-400">训练额度说明</span>
        <span className="h-px flex-1 bg-slate-200/70" />
      </div>
      <div className="mt-4 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3">
        {quotaItems.map((item) => (
          <div
            key={`${item.title}-${item.subtitle}`}
            className="flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-2 rounded-[18px] border border-[#dfe5ef]/90 bg-white/86 px-2.5 py-2 shadow-[0_18px_36px_rgba(76,67,116,0.08)] backdrop-blur-sm sm:flex-row sm:justify-start sm:gap-2 sm:px-3"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center ${item.iconClassName}`}>
              {item.icon}
            </span>
            <span className="min-w-0 text-center text-[13px] font-semibold leading-[1.16] text-slate-700 sm:text-left sm:text-sm">
              <span className="block whitespace-nowrap">{item.title}</span>
              <span className="block whitespace-nowrap">{item.subtitle}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureRow({ feature }: { feature: (typeof featureRows)[number] }) {
  return (
    <div className="grid h-[58px] grid-cols-[48px_minmax(0,1fr)_152px] items-center rounded-[15px] border border-white/10 bg-white/[0.035] px-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(0,0,0,0.10)] backdrop-blur-sm">
      <div className="flex items-center">
        <span className="flex h-8 w-8 items-center justify-center text-violet-300">{feature.icon}</span>
      </div>
      <p className="truncate text-[13px] font-semibold text-slate-400">{feature.detail}</p>
      <div className="ml-4 flex items-center justify-end gap-3">
        <span className="h-2 w-2 rounded-full bg-violet-400" />
        <FeatureAccent type={feature.accent} />
      </div>
    </div>
  );
}

function FeatureAccent({ type }: { type: (typeof featureRows)[number]["accent"] }) {
  if (type === "chat") {
    return (
      <div className="flex w-[105px] items-center justify-end gap-3 text-slate-500">
        <span className="rounded-md bg-slate-500/30 px-1.5 py-1 text-[9px] leading-none">•••</span>
        <span className="rounded bg-slate-500/20 px-1 py-0.5 text-[8px] leading-none">••</span>
        <span className="rounded-md bg-slate-500/30 px-1.5 py-1 text-[9px] leading-none">•••</span>
      </div>
    );
  }

  if (type === "progress") {
    return (
      <div className="flex w-[105px] items-center justify-end gap-4">
        <span className="h-1.5 w-8 rounded-full bg-violet-300/70" />
        <span className="h-1.5 w-6 rounded-full bg-slate-400/45" />
        <span className="h-1.5 w-6 rounded-full bg-slate-400/45" />
      </div>
    );
  }

  const bars = type === "bars" ? [5, 15, 8, 20, 11, 7, 17, 10, 22, 8, 13] : [7, 13, 5, 18, 24, 9, 28, 14, 8, 16, 10];
  return (
    <div className="flex h-7 w-[105px] items-center justify-end gap-1">
      {bars.map((height, index) => (
        <span
          key={`${type}-${height}-${index}`}
          className="w-[2px] rounded-full bg-slate-400/45"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function CoachCard({ coach }: { coach: (typeof coachCards)[number] }) {
  return (
    <article className={`absolute overflow-hidden rounded-[18px] border-[3px] border-white/72 bg-[#101a2b] shadow-[0_24px_48px_rgba(0,0,0,0.26)] ${coach.className}`}>
      <div className={`relative overflow-hidden ${coach.imageClassName}`}>
        <Image
          src={coach.image}
          alt={coach.name}
          fill
          priority
          sizes="220px"
          className="object-cover"
        />
      </div>
      <div className="px-4 py-3">
        <p className="text-[15px] font-semibold leading-5 text-white">{coach.name}</p>
        <p className="mt-1 text-[12px] font-medium leading-5 text-slate-400">{coach.line}</p>
      </div>
    </article>
  );
}

function Timeline({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 930 92" className="h-full w-full overflow-visible">
        <text x="0" y="35" fill="#aeb8cc" fontSize="14" fontWeight="600">开始练习</text>
        <path d="M88 54 C160 50 210 59 268 53 S364 48 425 54 526 61 579 52 692 48 776 55 846 54 890 53" fill="none" stroke="#8b5cf6" strokeWidth="1.4" opacity="0.72" />
        <path d="M88 54 L894 54" fill="none" stroke="#5b4bb6" strokeWidth="1" opacity="0.32" />
        {[105, 113, 119, 151, 198, 239, 252, 295, 319, 371, 407, 421, 442, 455, 465, 487, 518, 561, 599, 634, 670, 707, 728, 755, 791, 819, 847].map((x, index) => (
          <line
            key={`wave-${x}-${index}`}
            x1={x}
            x2={x}
            y1={54 - ((index % 7) + 2) * 2.6}
            y2={54 + ((index % 6) + 2) * 2.4}
            stroke="#8b5cf6"
            strokeWidth={index % 5 === 0 ? 2.2 : 1.1}
            opacity={index % 4 === 0 ? 0.9 : 0.62}
          />
        ))}
        <TimelineMarker x={240} label="文字稿" />
        <TimelineMarker x={405} label="语速分析" />
        <TimelineMarker x={585} label="临场追问" />
        <TimelineMarker x={780} label="复盘报告" />
        <text x="875" y="35" fill="#aeb8cc" fontSize="14" fontWeight="600">持续进步</text>
        <circle cx="916" cy="54" r="9" fill="none" stroke="#a78bfa" strokeWidth="2" />
        <path d="M911 53 L915 57 L922 49" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M101 54 L89 47 L89 61 Z" fill="#a78bfa" />
      </svg>
    </div>
  );
}

function TimelineMarker({ x, label }: { x: number; label: string }) {
  return (
    <>
      <line x1={x} x2={x} y1="24" y2="54" stroke="#8b5cf6" strokeWidth="1.7" opacity="0.9" />
      <circle cx={x} cy="33" r="5" fill="#a78bfa" />
      <text x={x - 22} y="18" fill="#aeb8cc" fontSize="14" fontWeight="600">{label}</text>
    </>
  );
}

function DecorativeWaves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 150" className={className} fill="none" aria-hidden="true">
      {Array.from({ length: 7 }).map((_, index) => (
        <path
          key={index}
          d={`M0 ${105 + index * 8} C95 ${62 + index * 4} 168 ${146 - index * 2} 275 ${96 + index * 4} S421 ${64 + index * 3} 520 ${88 + index * 5}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.36 - index * 0.028}
        />
      ))}
    </svg>
  );
}

function TranscriptIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
      {[6, 11, 16, 21, 26].map((x, index) => (
        <rect key={x} x={x - 1.5} y={8 + (index % 2) * 4} width="3" height={16 - (index % 2) * 7} rx="1.5" fill="currentColor" />
      ))}
    </svg>
  );
}

function RhythmIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2.6" />
      <path d="M8.5 16H12l2-5 3.5 10 2.2-5H24" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2.6" />
      <path d="M12.2 12.4c.6-2 2.2-3.1 4.2-3.1 2.5 0 4.2 1.5 4.2 3.8 0 3.6-4.4 3.4-4.4 6.4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16.2" cy="23.4" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2.6" />
      <path d="M13 10.5v11l8-5.5-8-5.5Z" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16 9.5V16l4.5 3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M6.5 23.5h19l1.7-12.8-7.1 5.5L16 7l-4.1 9.2-7.1-5.5 1.7 12.8Z" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M8.5 26h15" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true">
      <rect x="7" y="17" width="4" height="8" rx="1.3" stroke="currentColor" strokeWidth="2.2" />
      <rect x="14" y="11" width="4" height="14" rx="1.3" stroke="currentColor" strokeWidth="2.2" />
      <rect x="21" y="6" width="4" height="19" rx="1.3" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
