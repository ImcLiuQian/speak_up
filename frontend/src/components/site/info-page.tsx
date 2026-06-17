import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";

interface InfoSection {
  title: string;
  body: string;
}

interface InfoPageProps {
  eyebrow: string;
  title: string;
  summary?: string;
  sections?: InfoSection[];
  visual?: {
    src: string;
    alt: string;
    caption?: string;
  };
  action?: {
    label: string;
    href: string;
    external?: boolean;
  };
}

export function InfoPage({ eyebrow, title, summary, sections = [], visual, action }: InfoPageProps) {
  return (
    <main className="min-h-[100dvh] bg-[#e8edf4] px-4 py-6 text-slate-950 md:px-8 md:py-10">
      <section className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-3xl flex-col rounded-[26px] bg-white/88 px-6 py-8 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur md:px-10 md:py-10">
        <Link href="/" className="text-sm font-semibold text-violet-700 transition hover:text-violet-500">
          返回登录页
        </Link>
        <p className="mt-10 text-sm font-semibold text-violet-700">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[0] text-[#071023] md:text-5xl">{title}</h1>
        {summary ? <p className="mt-5 text-base font-medium leading-8 text-slate-600">{summary}</p> : null}

        {visual ? (
          <div className="mt-8 w-full rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div
              aria-label={visual.alt}
              className="mx-auto aspect-[3/4] w-full max-w-72 rounded-[18px] border border-white bg-white bg-contain bg-center bg-no-repeat shadow-[0_16px_42px_rgba(15,23,42,0.12)]"
              role="img"
              style={{ backgroundImage: `url(${visual.src})` }}
            />
            {visual.caption ? (
              <p className="mt-4 text-center text-sm font-medium leading-6 text-slate-500">{visual.caption}</p>
            ) : null}
          </div>
        ) : null}

        {sections.length > 0 ? (
          <div className="mt-9 grid gap-6">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
              </section>
            ))}
          </div>
        ) : null}

        {action ? (
          <a
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noreferrer" : undefined}
            className="mt-8 inline-flex h-11 w-fit items-center justify-center rounded-full bg-violet-600 px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(109,40,217,0.22)] transition hover:bg-violet-500"
          >
            {action.label}
          </a>
        ) : null}
      </section>
      <SiteFooter className="mx-auto mt-4" />
    </main>
  );
}
