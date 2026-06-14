import Link from "next/link";

const footerLinks = [
  { label: "问卷调查", href: "/survey", external: false },
  { label: "隐私政策", href: "/privacy", external: false },
  { label: "服务条款", href: "/terms", external: false },
  { label: "Discord", href: "/community", external: false },
  { label: "GitHub", href: "https://github.com/ImcLiuQian/speak_up", external: true },
  { label: "无障碍", href: "/accessibility", external: false },
] as const;

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer className={`flex justify-center text-[12px] font-medium text-slate-500 ${className}`}>
      <nav
        aria-label="站点链接"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur"
      >
        {footerLinks.map((link) =>
          link.external ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-violet-700"
            >
              {link.label}
            </a>
          ) : (
            <Link key={link.label} href={link.href} className="transition hover:text-violet-700">
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </footer>
  );
}
