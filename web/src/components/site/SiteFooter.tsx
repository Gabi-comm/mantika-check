import Link from "next/link";
import { Logo } from "@/components/Logo";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/app", label: "Dashboard" },
      { href: "/app/log", label: "Log a session" },
      { href: "/app/check", label: "Quick check" },
      { href: "/app/history", label: "History" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/features", label: "Features" },
      { href: "/methodology", label: "Methodology" },
      { href: "/about", label: "About" },
      { href: "/app/about", label: "Limits" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo reversed height={26} />
          <p className="mt-4 max-w-sm text-[0.92rem]">
            A cooking-oil usage monitoring workspace for street-food vendors. Research prototype: statuses are estimates from logged usage and observations, not
            laboratory measurements.
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-mint/70">{c.title}</h2>
            <ul className="mt-3">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-10 items-center text-[0.92rem] hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 px-4 py-5 font-mono text-[0.72rem] text-white/55 sm:px-6">
          <span>© 2026 MANTIKA CHECK · Research prototype</span>
          <span>No accounts · Data stays on your device · Engine not yet validated</span>
        </div>
      </div>
    </footer>
  );
}
