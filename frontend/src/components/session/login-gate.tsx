"use client";

import Image from "next/image";

import { InternalAccountAuthForm } from "@/components/session/internal-account-auth-form";
import { SiteFooter } from "@/components/site/site-footer";
import { type AuthSession } from "@/lib/api";

interface LoginGateProps {
  loading?: boolean;
  onSessionChange: (session: AuthSession) => void;
}

const coachCards = [
  {
    name: "暖声教练",
    line: "先稳住表达，再打磨细节。",
    image: "/ai-coach/warm-voice-coach.jpg",
    className: "right-[150px] top-[58px] z-40 h-[300px] w-[252px] rotate-[7deg]",
    imageClassName: "h-[212px]",
    imageObjectClassName: "object-[50%_40%]",
  },
  {
    name: "锋芒教练",
    line: "逻辑清晰，观点有力。",
    image: "/ai-coach/sharp-logic-coach.jpg",
    className: "right-[348px] top-[278px] z-30 h-[296px] w-[248px] rotate-[-10deg]",
    imageClassName: "h-[204px]",
    imageObjectClassName: "object-[50%_43%]",
  },
  {
    name: "元气教练",
    line: "能量在线，感染全场。",
    image: "/ai-coach/bright-energy-coach.jpg",
    className: "right-[88px] top-[340px] z-[35] h-[272px] w-[228px] rotate-[8deg]",
    imageClassName: "h-[188px]",
    imageObjectClassName: "object-[50%_45%]",
  },
] as const;

const showcaseFeatures = [
  {
    title: "开口练习",
    subtitle: ["多场景模拟练习 大胆", "开口表达"],
    icon: <MicIcon />,
  },
  {
    title: "表达反馈",
    subtitle: ["AI 实时分析表达", "提供改进建议"],
    icon: <RhythmIcon />,
  },
  {
    title: "复盘报告",
    subtitle: ["结构化复盘总结 记录", "每次进步"],
    icon: <ReportIcon />,
  },
] as const;

const starPoints = Array.from({ length: 72 }, (_, index) => {
  const left = 3 + ((index * 37 + (index % 7) * 11) % 94);
  const top = 4 + ((index * 53 + (index % 5) * 13) % 90);
  const opacity = 0.1 + ((index * 17) % 16) / 100;
  const size = index % 13 === 0 ? 2 : 1;
  return [left, top, opacity, size] as const;
});

const soundBars = [5, 12, 20, 27, 35, 23, 58, 36, 22, 46, 70, 43, 28, 52, 31, 24, 39, 20, 32, 18, 26, 34, 16, 28, 42, 21, 14, 31, 19, 25];

export function LoginGate({ loading = false, onSessionChange }: LoginGateProps) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#e9edf4] px-4 py-5 text-slate-950 sm:px-7 lg:px-10">
      <section className="mx-auto grid h-auto min-h-[690px] w-full max-w-[1510px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_96px_rgba(38,48,73,0.18)] xl:h-[min(842px,calc(100dvh-76px))] xl:grid-cols-[minmax(420px,0.405fr)_minmax(0,0.595fr)]">
        <aside className="flex min-h-[690px] items-center justify-center px-8 py-12 sm:px-12 lg:px-16 xl:min-h-0 xl:px-[88px]">
          <section className="w-full max-w-[420px]">
            <div className="flex items-center gap-5">
              <span className="relative h-[72px] w-[72px] overflow-hidden rounded-[18px] shadow-[0_18px_36px_rgba(126,50,255,0.24)]">
                <Image
                  src="/landing-assets/speakup-logo-purple.png"
                  alt="Speak Up"
                  fill
                  unoptimized
                  priority
                  sizes="72px"
                  className="object-cover"
                />
              </span>
              <span>
                <span className="block text-[26px] font-semibold leading-8 tracking-[0] text-slate-950">Speak Up</span>
                <span className="mt-1 block text-[16px] font-medium leading-6 text-slate-500">AI 演讲训练台</span>
              </span>
            </div>

            <h1 className="mt-16 text-[56px] font-semibold leading-none tracking-[0] text-[#071023]">登录</h1>

            <InternalAccountAuthForm loading={loading} onSessionChange={onSessionChange} />
          </section>
        </aside>

        <section className="relative hidden min-h-0 overflow-hidden rounded-r-[30px] bg-[#020918] text-white xl:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(128,91,255,0.30)_0%,transparent_32%),radial-gradient(circle_at_72%_28%,rgba(37,91,150,0.22)_0%,transparent_34%),radial-gradient(circle_at_50%_74%,rgba(99,62,219,0.18)_0%,transparent_42%),linear-gradient(135deg,#17162f_0%,#071326_43%,#020916_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0%,transparent_28%,rgba(151,104,255,0.05)_100%)]" />
          <StarField />

          <div className="absolute left-0 top-0 h-[842px] w-[900px] origin-top-left scale-[0.74] min-[1360px]:scale-[0.82] min-[1440px]:scale-[0.9] 2xl:scale-[0.96] min-[1680px]:scale-100">
            <DecorativeWaves className="absolute bottom-[182px] right-[-116px] h-[220px] w-[820px] text-violet-500/25" />
            <SoundLine />

            <section className="absolute left-[74px] top-[92px] w-[490px]">
              <h2 className="text-[54px] font-semibold leading-[1.08] tracking-[0] text-white">
                把演讲练到
                <span className="block text-[#d8c9ff]">上台前就有底气。</span>
              </h2>
              <p className="mt-8 max-w-[382px] text-[20px] font-medium leading-[1.75] text-slate-300">
                AI 教练陪你开口练习，实时反馈表达，复盘每一次进步。
              </p>
            </section>

            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {coachCards.map((coach) => (
                <CoachCard key={coach.name} coach={coach} />
              ))}
              <SpeechBubble className="right-[22px] top-[144px]" icon={<SmallBarsIcon />} text={["语速更稳了", "表达更清晰!"]} />
              <SpeechBubble className="right-[22px] top-[264px]" icon={<HeartIcon />} text={["情绪饱满", "打动人心!"]} />
              <SpeechBubble className="left-[128px] top-[500px]" icon={<ReportIcon />} text={["结构清晰", "逻辑升级!"]} />
            </div>

            <div className="absolute inset-x-[74px] bottom-[58px] grid grid-cols-3 divide-x divide-white/14">
              {showcaseFeatures.map((feature) => (
                <ShowcaseFeature key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </section>
      </section>
      <SiteFooter className="pointer-events-auto fixed inset-x-4 bottom-1 z-20 md:bottom-2" />
    </main>
  );
}

function ShowcaseFeature({ feature }: { feature: (typeof showcaseFeatures)[number] }) {
  return (
    <div className="grid min-w-0 grid-cols-[82px_minmax(0,1fr)] items-center gap-5 px-10 first:pl-0 last:pr-0">
      <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border border-violet-300/24 bg-violet-400/13 text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.11),0_16px_34px_rgba(18,11,55,0.24)]">
        {feature.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[25px] font-semibold leading-8 tracking-[0] text-white">{feature.title}</span>
        <span className="mt-2 block text-[16px] font-medium leading-7 text-slate-400">
          {feature.subtitle.map((line) => (
            <span key={line} className="block">{line}</span>
          ))}
        </span>
      </span>
    </div>
  );
}

function SpeechBubble({ className, icon, text }: { className: string; icon: React.ReactNode; text: readonly string[] }) {
  return (
    <div className={`absolute z-20 flex w-[188px] items-center gap-4 rounded-[19px] border border-white/14 bg-[#1d2942]/90 px-5 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)] backdrop-blur-md ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-violet-300">{icon}</span>
      <span className="text-[16px] font-semibold leading-[1.35] text-slate-200">
        {text.map((line) => (
          <span key={line} className="block">{line}</span>
        ))}
      </span>
    </div>
  );
}

function CoachCard({ coach }: { coach: (typeof coachCards)[number] }) {
  return (
    <article className={`absolute overflow-hidden rounded-[20px] border-[3px] border-white/78 bg-[#0d1729] shadow-[0_28px_58px_rgba(0,0,0,0.30)] ${coach.className}`}>
      <div className={`relative overflow-hidden ${coach.imageClassName}`}>
        <Image
          src={coach.image}
          alt={coach.name}
          fill
          sizes="282px"
          className={`object-cover ${coach.imageObjectClassName}`}
        />
      </div>
      <div className="px-5 py-4">
        <p className="text-[20px] font-semibold leading-7 text-white">{coach.name}</p>
        <p className="mt-1 text-[15px] font-medium leading-6 text-slate-400">{coach.line}</p>
      </div>
    </article>
  );
}

function StarField() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {starPoints.map(([left, top, opacity, size], index) => (
        <span
          key={`${left}-${top}-${index}`}
          className="absolute rounded-full bg-white"
          style={{ left: `${left}%`, top: `${top}%`, opacity, height: size, width: size }}
        />
      ))}
    </div>
  );
}

function SoundLine() {
  return (
    <div className="absolute left-0 right-0 top-[346px] h-[128px]" aria-hidden="true">
      <svg viewBox="0 0 900 128" className="h-full w-full overflow-visible" fill="none">
        <path d="M0 64H900" stroke="url(#sound-line-gradient)" strokeWidth="1.4" opacity="0.5" />
        <defs>
          <linearGradient id="sound-line-gradient" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" stopOpacity="0" />
            <stop offset="0.23" stopColor="#A78BFA" stopOpacity="0.75" />
            <stop offset="0.76" stopColor="#A78BFA" stopOpacity="0.34" />
            <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute left-[78px] top-1/2 flex h-[82px] w-[82px] -translate-y-1/2 items-center justify-center rounded-full border border-violet-300/20 bg-violet-400/13 text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_48px_rgba(139,92,246,0.10)]">
        <MicIcon />
      </span>
      <span className="absolute left-[178px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.72)]" />
      <span className="absolute left-[212px] top-1/2 flex h-[92px] -translate-y-1/2 items-center gap-[9px]">
        {soundBars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-[3px] rounded-full bg-violet-400/80"
            style={{ height }}
          />
        ))}
      </span>
    </div>
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

function SmallBarsIcon() {
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

function MicIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
      <rect x="10.5" y="5" width="11" height="16" rx="5.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6.8 15.5c0 5.1 3.7 8.7 9.2 8.7s9.2-3.6 9.2-8.7M16 24.2V28M11.8 28h8.4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
      <path d="M16 26.5S5.5 20.2 5.5 12.7A5.7 5.7 0 0 1 16 9.4a5.7 5.7 0 0 1 10.5 3.3c0 7.5-10.5 13.8-10.5 13.8Z" fill="currentColor" />
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
