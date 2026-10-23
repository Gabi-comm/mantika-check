"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutDashboard, Timer, ClipboardCheck, History, Settings, Info, ScanLine, ArrowUpRight, WifiOff } from "lucide-react";
import { Logo } from "./Logo";
import { Tag } from "./ui";
import { cx } from "@/lib/format";
import { copy } from "@/vendor/copy";
import { useOnline, useVendorState } from "@/vendor/useOilStatus";

const primary = [
  { href: "/app", label: copy.nav.dashboard, icon: LayoutDashboard },
  { href: "/app/log", label: copy.nav.log, icon: Timer },
  { href: "/app/check", label: copy.nav.check, icon: ClipboardCheck },
  { href: "/app/history", label: copy.nav.history, icon: History },
  { href: "/app/settings", label: copy.nav.settings, icon: Settings },
];
const secondary = [
  { href: "/app/about", label: copy.nav.about, icon: Info },
  { href: "/app/experimental/color", label: copy.nav.experimental, icon: ScanLine, tag: "Experimental" },
];
const tabs = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/check", label: "Check", icon: ClipboardCheck },
  { href: "/app/log", label: "Log", icon: Timer, primary: true },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/app";
  const online = useOnline();
  const state = useVendorState();
  const hasDemo = !!state?.batches.some((b) => b.origin === "demo");

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#main" className="sr-only-focusable fixed top-2 left-2 z-50 rounded bg-forest px-3 py-2 text-white">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white lg:flex" aria-label="Workspace">
        <Link href="/" className="flex min-h-16 items-center px-5" aria-label="MANTIKA CHECK home">
          <Logo height={26} />
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Workspace navigation">
          <ul className="space-y-0.5">
            {primary.map(({ href, label, icon: Icon }) => {
              const on = isActive(path, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={on ? "page" : undefined}
                    className={cx(
                      "flex min-h-11 items-center gap-3 rounded-[var(--radius-s)] px-3 text-[0.94rem] font-medium",
                      on ? "bg-mint text-forest" : "text-ink/80 hover:bg-pale hover:text-ink"
                    )}
                  >
                    <Icon className="size-[1.15rem]" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 mb-1.5 px-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-gray">Reference</p>
          <ul className="space-y-0.5">
            {secondary.map(({ href, label, icon: Icon, tag }) => {
              const on = isActive(path, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={on ? "page" : undefined}
                    className={cx("flex min-h-11 items-center gap-3 rounded-[var(--radius-s)] px-3 text-[0.92rem]", on ? "bg-mint text-forest" : "text-ink/75 hover:bg-pale")}
                  >
                    <Icon className="size-[1.1rem]" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {tag && <Tag tone="outline">Exp.</Tag>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="m-3 rounded-[var(--radius-s)] border border-line bg-pale p-3 text-[0.8rem] text-ink/80">
          <p className="font-semibold text-ink">{copy.prototype}</p>
          <p className="mt-0.5">Statuses are estimates from logged usage, not laboratory measurements.</p>
          {hasDemo && <p className="mt-1.5 text-teal">Showing fictional demo records.</p>}
        </div>
        <Link href="/" className="flex min-h-12 items-center gap-2 border-t border-line px-5 text-[0.88rem] text-gray hover:text-green">
          <ArrowUpRight className="size-4" aria-hidden="true" /> Back to website
        </Link>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
          <Link href="/" aria-label="MANTIKA CHECK home" className="flex min-h-11 items-center">
            <Logo height={24} />
          </Link>
          <div className="flex items-center gap-2">
            {hasDemo && <Tag tone="neutral">{copy.demo.badge}</Tag>}
            <Link href="/app/about" className="grid size-11 place-items-center rounded text-gray hover:text-green" aria-label={copy.nav.about}>
              <Info className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {!online && (
          <div role="status" className="flex items-center gap-2 border-b border-st-monitor/30 bg-st-monitor-bg px-4 py-2 text-[0.88rem] text-ink lg:px-8">
            <WifiOff className="size-4 shrink-0 text-st-monitor" aria-hidden="true" />
            {copy.states.offline}
          </div>
        )}

        <main id="main" className="mx-auto w-full max-w-[1320px] px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          {children}
        </main>
      </div>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white lg:hidden" aria-label="Workspace navigation">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map(({ href, label, icon: Icon, primary: p }) => {
            const on = isActive(path, href);
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cx("flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium", on ? "text-forest" : "text-gray")}
                >
                  {p ? (
                    <span className={cx("-mt-5 grid size-13 place-items-center rounded-full border-4 border-white text-white shadow-md", on ? "bg-forest" : "bg-green")}>
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                  ) : (
                    <Icon className="size-[1.35rem]" aria-hidden="true" />
                  )}
                  <span className={cx(on && !p && "font-semibold")}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
