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
    className: "right-[142px] top-[78px] z-40 h-[276px] w-[226px] rotate-[7deg]",
    imageClassName: "h-[192px]",
    imageObjectClassName: "object-[50%_50%]",
  },
  {
    name: "逻辑教练",
    line: "逻辑清晰，观点有力。",
    image: "/ai-coach/sharp-logic-coach-suit.png",
    className: "right-[338px] top-[300px] z-30 h-[302px] w-[252px] rotate-[-10deg]",
    imageClassName: "h-[214px]",
    imageObjectClassName: "object-[50%_48%]",
  },
  {
    name: "元气教练",
    line: "能量在线，感染全场。",
    image: "/ai-coach/bright-energy-coach.jpg",
    className: "right-[152px] top-[382px] z-[35] h-[276px] w-[230px] rotate-[8deg]",
    imageClassName: "h-[192px]",
    imageObjectClassName: "object-[50%_45%]",
  },
] as const;

const showcaseFeatures = [
  {
    title: "开口练习",
    subtitle: ["多场景模拟练习", "大胆开口表达"],
    icon: <MicIcon />,
  },
  {
    title: "表达反馈",
    subtitle: ["AI 实时分析表达", "提供改进建议"],
    icon: <RhythmIcon />,
  },
  {
    title: "复盘报告",
    subtitle: ["结构化复盘总结", "记录每次进步"],
    icon: <ReportIcon />,
  },
] as const;

const starPoints = Array.from({ length: 124 }, (_, index) => {
  const left = 3 + ((index * 37 + (index % 7) * 11) % 94);
  const top = 4 + ((index * 53 + (index % 5) * 13) % 90);
  const opacity = 0.08 + ((index * 17) % 18) / 100;
  const size = index % 17 === 0 ? 2 : 1;
  return [left, top, opacity, size] as const;
});

const particlePoints = Array.from({ length: 22 }, (_, index) => {
  const left = 8 + ((index * 47 + 13) % 84);
  const top = 8 + ((index * 31 + 19) % 76);
  const size = index % 7 === 0 ? 5 : index % 4 === 0 ? 3 : 2;
  return [left, top, size] as const;
});

const soundBars = Array.from({ length: 78 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 0.58) + Math.sin(index * 1.21) * 0.45) * 24;
  const pulse = index % 17 === 0 ? 42 : index % 11 === 0 ? 28 : index % 6 === 0 ? 16 : 0;
  return Math.round(4 + wave + pulse + ((index * 19) % 9));
});
const distantBars = Array.from({ length: 36 }, (_, index) => Math.round(4 + Math.abs(Math.sin(index * 0.77) + Math.cos(index * 0.31) * 0.4) * 22 + (index % 10 === 0 ? 20 : 0)));

export function LoginGate({ loading = false, onSessionChange }: LoginGateProps) {
  return (
    <main className="relative flex min-h-[100dvh] items-start justify-center overflow-hidden bg-[#e9edf4] px-3 pb-20 pt-8 text-slate-950 sm:px-5 lg:px-6 min-[1500px]:pt-[54px]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0)_34%),radial-gradient(circle_at_80%_18%,rgba(217,226,246,0.68)_0%,rgba(217,226,246,0)_36%),linear-gradient(135deg,#edf3fb_0%,#e5ebf4_52%,#dde6f1_100%)]"
        aria-hidden="true"
      />
      <section className="relative z-10 mx-auto grid h-auto min-h-[690px] w-full max-w-[1560px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_96px_rgba(38,48,73,0.18)] xl:h-[min(842px,calc(100dvh-76px))] xl:grid-cols-[minmax(420px,0.405fr)_minmax(0,0.595fr)]">
        <aside className="relative flex min-h-[690px] items-center justify-center overflow-hidden bg-[#f8fbff] px-8 py-12 sm:px-12 lg:px-16 xl:min-h-0 xl:px-[88px]">
          <Image
            src="/landing-assets/login-page-background.png"
            alt=""
            fill
            priority
            unoptimized
            sizes="(min-width: 1280px) 640px, 100vw"
            className="pointer-events-none select-none object-cover object-left"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_48%,rgba(234,221,255,0.18)_100%)]"
            aria-hidden="true"
          />
          <section className="relative z-10 w-full max-w-[420px]">
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_13%_14%,rgba(115,79,226,0.45)_0%,transparent_28%),radial-gradient(circle_at_46%_44%,rgba(91,45,201,0.42)_0%,transparent_30%),radial-gradient(circle_at_80%_20%,rgba(5,40,83,0.55)_0%,transparent_36%),linear-gradient(135deg,#191735_0%,#071226_47%,#020814_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.01)_25%,rgba(146,92,255,0.055)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_52%,transparent_0%,rgba(7,10,30,0.20)_46%,rgba(1,6,17,0.58)_100%)]" />
          <StarTexture />
          <StarField />

          <div className="absolute left-0 top-0 h-[842px] w-[900px] origin-top-left scale-[0.92] min-[1500px]:scale-[0.98] min-[1600px]:scale-100">
            <DecorativeWaves className="absolute bottom-[154px] right-[-110px] h-[230px] w-[770px] text-violet-500/24" />
            <SoundLine />

            <section className="absolute left-[64px] top-[86px] w-[490px]">
              <h2 className="text-[54px] font-semibold leading-[1.08] tracking-[0] text-white">
                把演讲练到
                <span className="block text-[#d8c9ff]">上台前就有底气。</span>
              </h2>
              <p className="mt-5 max-w-[360px] text-[20px] font-medium leading-[1.75] text-slate-300">
                AI 教练陪你开口练习，实时反馈表达，复盘每一次进步。
              </p>
            </section>

            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {coachCards.map((coach) => (
                <CoachCard key={coach.name} coach={coach} />
              ))}
              <SpeechBubble className="right-[2px] top-[128px]" tailClassName="-left-[9px] bottom-[18px] rotate-45" icon={<SmallBarsIcon />} text={["语速更稳了", "表达更清晰!"]} />
              <SpeechBubble className="right-[8px] top-[328px]" tailClassName="-left-[9px] top-[18px] rotate-45" icon={<HeartIcon />} text={["情绪饱满", "打动人心!"]} />
              <SpeechBubble className="left-[126px] top-[498px]" tailClassName="right-[-9px] top-[28px] rotate-45" icon={<ReportIcon />} text={["结构清晰", "逻辑升级!"]} />
            </div>

            <div className="absolute inset-x-[54px] bottom-[82px] grid grid-cols-3 divide-x divide-white/14">
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
    <div className="grid min-w-0 grid-cols-[68px_minmax(0,1fr)] items-center gap-[18px] px-5 first:pl-0 last:pr-0">
      <span className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full border border-violet-300/24 bg-violet-400/13 text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.11),0_16px_34px_rgba(18,11,55,0.24),0_0_36px_rgba(139,92,246,0.12)]">
        {feature.icon}
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[23px] font-semibold leading-8 tracking-[0] text-white">{feature.title}</span>
        <span className="mt-2 block text-[15px] font-medium leading-7 text-slate-400">
          {feature.subtitle.map((line) => (
            <span key={line} className="block">{line}</span>
          ))}
        </span>
      </span>
    </div>
  );
}

function SpeechBubble({ className, tailClassName, icon, text }: { className: string; tailClassName: string; icon: React.ReactNode; text: readonly string[] }) {
  return (
    <div className={`absolute z-50 flex w-[166px] items-center gap-3 rounded-[18px] border border-white/15 bg-[#1c2942]/88 px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.24)] backdrop-blur-md ${className}`}>
      <span className={`absolute h-4 w-4 border-b border-r border-white/15 bg-[#1c2942]/88 ${tailClassName}`} />
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center text-violet-300">{icon}</span>
      <span className="relative text-[15px] font-semibold leading-[1.35] text-slate-200">
        {text.map((line) => (
          <span key={line} className="block">{line}</span>
        ))}
      </span>
    </div>
  );
}

function CoachCard({ coach }: { coach: (typeof coachCards)[number] }) {
  return (
    <article className={`absolute overflow-hidden rounded-[18px] border-[3px] border-white/78 bg-[#0d1729] shadow-[0_28px_58px_rgba(0,0,0,0.32)] ${coach.className}`}>
      <div className={`relative overflow-hidden ${coach.imageClassName}`}>
        <Image
          src={coach.image}
          alt={coach.name}
          fill
          sizes="282px"
          className={`object-cover ${coach.imageObjectClassName}`}
        />
      </div>
      <div className="px-5 py-[13px]">
        <p className="text-[19px] font-semibold leading-7 text-white">{coach.name}</p>
        <p className="mt-1 text-[14px] font-medium leading-6 text-slate-400">{coach.line}</p>
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
      {particlePoints.map(([left, top, size], index) => (
        <span
          key={`particle-${left}-${top}-${index}`}
          className="absolute rounded-full bg-violet-400 shadow-[0_0_18px_rgba(139,92,246,0.85)]"
          style={{ left: `${left}%`, top: `${top}%`, height: size, width: size, opacity: index % 3 === 0 ? 0.9 : 0.55 }}
        />
      ))}
    </div>
  );
}

function StarTexture() {
  return (
    <div
      className="absolute inset-0 opacity-35"
      style={{
        backgroundImage: [
          "radial-gradient(circle at 18% 24%, rgba(167,139,250,0.9) 0 1px, transparent 1.5px)",
          "radial-gradient(circle at 70% 18%, rgba(255,255,255,0.42) 0 1px, transparent 1.5px)",
          "radial-gradient(circle at 42% 66%, rgba(99,102,241,0.55) 0 1px, transparent 1.6px)",
          "radial-gradient(circle at 86% 70%, rgba(139,92,246,0.55) 0 1px, transparent 1.6px)",
        ].join(","),
        backgroundPosition: "0 0, 38px 42px, 90px 18px, 126px 90px",
        backgroundSize: "170px 170px, 220px 220px, 260px 260px, 310px 310px",
      }}
      aria-hidden="true"
    />
  );
}

function SoundLine() {
  return (
    <div className="absolute left-0 right-0 top-[306px] h-[160px]" aria-hidden="true">
      <svg viewBox="0 0 900 160" className="h-full w-full overflow-visible" fill="none">
        <path d="M0 82H900" stroke="url(#sound-line-gradient)" strokeWidth="1.2" opacity="0.42" />
        <path
          d="M0 82 C52 82 55 80 86 82 S149 84 181 82 S242 79 282 82 S354 87 400 82 S482 77 535 82 S630 89 690 82 S812 78 900 82"
          stroke="url(#sound-line-gradient)"
          strokeWidth="2"
          opacity="0.5"
        />
        <path
          d="M78 82 C128 82 148 81 180 82 C220 84 235 74 268 82 C306 91 332 74 356 82 C394 94 420 66 444 82 C480 101 512 72 548 82 C602 95 646 73 700 82 C758 90 812 78 900 82"
          stroke="url(#sound-line-strong)"
          strokeWidth="1.8"
          opacity="0.72"
        />
        <defs>
          <linearGradient id="sound-line-gradient" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" stopOpacity="0" />
            <stop offset="0.23" stopColor="#A78BFA" stopOpacity="0.75" />
            <stop offset="0.72" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sound-line-strong" x1="78" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" stopOpacity="0" />
            <stop offset="0.24" stopColor="#8B5CF6" stopOpacity="0.9" />
            <stop offset="0.54" stopColor="#A78BFA" stopOpacity="0.68" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.06" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute left-[74px] top-1/2 flex h-[84px] w-[84px] -translate-y-1/2 items-center justify-center rounded-full border border-violet-300/22 bg-violet-400/13 text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_48px_rgba(139,92,246,0.16)]">
        <MicIcon />
      </span>
      <span className="absolute left-[174px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.72)]" />
      <span className="absolute left-[210px] top-1/2 flex h-[110px] -translate-y-1/2 items-center gap-[4px]">
        {soundBars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-[2px] rounded-full bg-violet-400/80"
            style={{ height }}
          />
        ))}
      </span>
      <span className="absolute left-[606px] top-1/2 flex h-[72px] -translate-y-1/2 items-center gap-[5px]">
        {distantBars.map((height, index) => (
          <span
            key={`distant-${height}-${index}`}
            className="w-[2px] rounded-full bg-violet-400/38"
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
        <rect key={x} x={x - 1.5} y={7 + (index % 2) * 5} width="3" height={18 - (index % 2) * 8} rx="1.5" fill="currentColor" />
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
    <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none" aria-hidden="true">
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
