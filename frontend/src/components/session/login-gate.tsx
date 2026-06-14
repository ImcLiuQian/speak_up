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
    className: "right-[155px] top-[72px] z-30 h-[256px] w-[214px] rotate-[7deg]",
    imageClassName: "h-[178px]",
  },
  {
    name: "锋芒教练",
    line: "逻辑清晰，观点有力。",
    image: "/ai-coach/sharp-logic-coach.jpg",
    className: "right-[330px] top-[250px] z-20 h-[246px] w-[210px] rotate-[-9deg]",
    imageClassName: "h-[168px]",
  },
  {
    name: "元气教练",
    line: "能量在线，感染全场。",
    image: "/ai-coach/bright-energy-coach.jpg",
    className: "right-[112px] top-[406px] z-40 h-[250px] w-[210px] rotate-[8deg]",
    imageClassName: "h-[172px]",
  },
] as const;

const showcaseFeatures = [
  {
    title: "开口练习",
    subtitle: "多场景模拟练习 大胆开口表达",
    icon: <MicIcon />,
  },
  {
    title: "表达反馈",
    subtitle: "AI 实时分析表达 提供改进建议",
    icon: <RhythmIcon />,
  },
  {
    title: "复盘报告",
    subtitle: "结构化复盘总结 记录每次进步",
    icon: <ReportIcon />,
  },
] as const;

export function LoginGate({ loading = false, onSessionChange }: LoginGateProps) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#e9edf4] px-4 py-6 text-slate-950 sm:px-7 lg:px-10">
      <section className="mx-auto grid h-auto min-h-[690px] w-full max-w-[1428px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_96px_rgba(38,48,73,0.18)] xl:h-[min(792px,calc(100dvh-88px))] xl:grid-cols-[minmax(390px,0.415fr)_minmax(0,0.585fr)]">
        <aside className="flex min-h-[690px] items-center justify-center px-8 py-12 sm:px-12 lg:px-16 xl:min-h-0 xl:px-[96px]">
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
            <p className="mt-4 text-[15px] font-semibold leading-6 text-slate-500">
              输入内测账号和密码，进入你的训练台。
            </p>

            <InternalAccountAuthForm loading={loading} onSessionChange={onSessionChange} />
          </section>
        </aside>

        <section className="relative hidden min-h-0 overflow-hidden rounded-r-[30px] bg-[#040b20] text-white xl:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_28%,rgba(126,87,255,0.26)_0%,transparent_31%),radial-gradient(circle_at_78%_36%,rgba(34,91,151,0.22)_0%,transparent_34%),linear-gradient(135deg,#15152c_0%,#071327_46%,#020917_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_0%,transparent_25%,rgba(151,104,255,0.06)_100%)]" />
          <DecorativeWaves className="absolute bottom-[150px] right-[-96px] h-[210px] w-[760px] text-violet-500/26" />
          <div className="absolute left-0 top-[374px] h-px w-full bg-violet-400/20" />
          <div className="absolute left-[70px] top-[342px] flex h-[74px] w-[520px] items-center">
            <span className="mr-5 flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border border-violet-300/16 bg-violet-400/10 text-violet-300">
              <MicIcon />
            </span>
            <Waveform />
          </div>

          <section className="absolute left-[70px] top-[82px] w-[470px]">
            <h2 className="text-[48px] font-semibold leading-[1.14] tracking-[0] text-white">
              把演讲练到
              <span className="block text-[#d8c9ff]">上台前就有底气。</span>
            </h2>
            <p className="mt-6 max-w-[360px] text-[16px] font-medium leading-7 text-slate-300">
              AI 教练陪你开口练习，实时反馈表达，复盘每一次进步。
            </p>
          </section>

          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {coachCards.map((coach) => (
              <CoachCard key={coach.name} coach={coach} />
            ))}
            <SpeechBubble className="right-[36px] top-[108px]" icon={<TranscriptIcon />} text="语速更稳了 表达更清晰!" />
            <SpeechBubble className="right-[32px] top-[338px]" icon={<HeartIcon />} text="情绪饱满 打动人心!" />
            <SpeechBubble className="left-[116px] top-[456px]" icon={<ReportIcon />} text="结构清晰 逻辑升级!" />
          </div>

          <div className="absolute inset-x-[72px] bottom-[68px] grid grid-cols-3 divide-x divide-white/14">
            {showcaseFeatures.map((feature) => (
              <ShowcaseFeature key={feature.title} feature={feature} />
            ))}
          </div>
        </section>
      </section>
      <SiteFooter className="pointer-events-auto fixed inset-x-4 bottom-1 z-20 md:bottom-2" />
    </main>
  );
}

function ShowcaseFeature({ feature }: { feature: (typeof showcaseFeatures)[number] }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-4 px-8 first:pl-0 last:pr-0">
      <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border border-violet-300/18 bg-violet-400/10 text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        {feature.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[18px] font-semibold leading-6 text-white">{feature.title}</span>
        <span className="mt-1 block max-w-[10rem] text-[13px] font-medium leading-5 text-slate-400">{feature.subtitle}</span>
      </span>
    </div>
  );
}

function SpeechBubble({ className, icon, text }: { className: string; icon: React.ReactNode; text: string }) {
  return (
    <div className={`absolute flex max-w-[150px] items-center gap-3 rounded-[16px] border border-white/14 bg-white/[0.055] px-4 py-3 shadow-[0_18px_38px_rgba(0,0,0,0.20)] backdrop-blur-md ${className}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-violet-300">{icon}</span>
      <span className="text-[12px] font-semibold leading-[1.45] text-slate-200">{text}</span>
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

function Waveform() {
  const bars = [11, 22, 14, 34, 18, 45, 24, 16, 30, 58, 24, 18, 36, 15, 22, 46, 26, 12, 19, 34, 14, 24, 52, 17, 13, 28, 16, 20, 31, 16];
  return (
    <div className="flex h-full min-w-0 flex-1 items-center gap-1.5">
      <span className="mr-2 h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.65)]" />
      {bars.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-[2px] rounded-full bg-violet-400/70"
          style={{ height }}
        />
      ))}
      <span className="ml-3 h-px flex-1 bg-gradient-to-r from-violet-400/45 to-transparent" />
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
