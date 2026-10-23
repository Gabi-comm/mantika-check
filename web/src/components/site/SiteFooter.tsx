import Link from "next/link";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/features", label: "Features" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
  { href: "/app/about", label: "Limits" },
  { href: "/#signin", label: "Sign in" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Logo height={26} />
          <span className="font-mono text-[0.7rem] text-gray">© 2026 · Research prototype · Estimates, not lab tests</span>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center text-[0.88rem] text-gray transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
