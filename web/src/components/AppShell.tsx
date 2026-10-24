"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Timer, ClipboardCheck, History, Settings, Info, ScanLine, ArrowUpRight, WifiOff, CircleHelp, PanelLeftClose, PanelLeftOpen } from "@/components/icons";
import { ThemeToggle } from "./ThemeToggle";
import { HelpButton, HelpDrawer } from "./help/HelpDrawer";
import { Tour } from "./help/Tour";
import { TOUR_EVENT } from "./help/tourEvents";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { CloudBadge } from "./CloudBadge";
import { Tag } from "./ui";
import { cx } from "@/frontend/format";
import { SIDEBAR_KEY } from "@/frontend/boot";
import { copy } from "@/vendor/copy";
import { useOnline } from "@/vendor/useOilStatus";

const primary = [
  { href: "/app", label: copy.nav.dashboard, icon: LayoutDashboard },
  { href: "/app/log", label: copy.nav.log, icon: Timer },
  { href: "/app/check", label: copy.nav.check, icon: ClipboardCheck },
  { href: "/app/history", label: copy.nav.history, icon: History },
  { href: "/app/settings", label: copy.nav.settings, icon: Settings },
];
const secondary = [
  { href: "/app/about", label: copy.nav.about, icon: Info },
  {
    href: "/app/experimental/color",
    label: copy.nav.experimental,
    icon: ScanLine,
    tag: "Experimental",
  },
];
const TOUR_TARGET: Record<string, string> = {
  "/app": "dashboard",
  "/app/log": "log",
  "/app/check": "check",
  "/app/history": "history",
  "/app/experimental/color": "color",
};

const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/app";
  const online = useOnline();
  const [help, setHelp] = useState(false);
  const [sidebar, setSidebar] = useState(true);

  const showSidebar = useCallback((open: boolean) => {
    setSidebar(open);
    const html = document.documentElement;
    if (open) delete html.dataset.sidebar;
    else html.dataset.sidebar = "hidden";
    try {
      localStorage.setItem(SIDEBAR_KEY, open ? "shown" : "hidden");
    } catch {}
  }, []);

  useEffect(() => {
    // The boot script has already applied the saved choice; mirror it after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebar(document.documentElement.dataset.sidebar !== "hidden");
    // The tour points at sidebar items, so bring the sidebar back when it starts.
    const onTour = () => showSidebar(true);
    window.addEventListener(TOUR_EVENT, onTour);
    return () => window.removeEventListener(TOUR_EVENT, onTour);
  }, [showSidebar]);

  return (
    <div className="app-grid min-h-dvh bg-canvas">
      <a href="#main" className="sr-only-focusable fixed top-2 left-2 z-50 rounded bg-forest px-3 py-2 text-white">
        Skip to content
      </a>

      <aside className="app-sidebar sticky top-0 hidden h-dvh overflow-hidden border-r border-line bg-surface lg:block" aria-label="Workspace" inert={!sidebar}>
        <div className="flex h-full w-[248px] flex-col">
          <div className="flex min-h-16 items-center justify-between gap-1 pr-2.5">
            <Link href="/" className="flex min-h-16 items-center pl-5" aria-label="MANTIKA CHECK home">
              <Logo height={30} />
            </Link>
            <button
              type="button"
              onClick={() => showSidebar(false)}
              aria-label="Hide sidebar"
              title="Hide sidebar"
              className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-s)] text-gray transition-colors hover:bg-pale hover:text-ink"
            >
              <PanelLeftClose className="size-[1.15rem]" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Workspace navigation">
            <ul className="space-y-0.5">
              {primary.map(({ href, label, icon: Icon }) => {
                const on = isActive(path, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      data-tour={TOUR_TARGET[href]}
                      aria-current={on ? "page" : undefined}
                      className={cx(
                        "flex min-h-11 items-center gap-3 rounded-[var(--radius-s)] px-3 text-[0.94rem] font-medium transition-colors",
                        on ? "bg-tint text-heading" : "text-ink/80 hover:bg-pale hover:text-ink"
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
                      data-tour={TOUR_TARGET[href]}
                      aria-current={on ? "page" : undefined}
                      className={cx(
                        "flex min-h-11 items-center gap-3 rounded-[var(--radius-s)] px-3 text-[0.92rem] transition-colors",
                        on ? "bg-tint text-heading" : "text-ink/75 hover:bg-pale"
                      )}
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
          <Link href="/" className="flex min-h-12 items-center gap-2 border-t border-line px-5 text-[0.88rem] text-gray hover:text-accent">
            <ArrowUpRight className="size-4" aria-hidden="true" /> Back to website
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
          <Link href="/" aria-label="MANTIKA CHECK home" className="flex min-h-11 items-center">
            <Logo height={30} />
          </Link>
          <div className="flex items-center gap-2">
            <CloudBadge />
            <ThemeToggle />
            <button
              type="button"
              data-tour="help"
              onClick={() => setHelp(true)}
              className="grid size-11 place-items-center rounded-[var(--radius-s)] border border-line text-ink hover:border-green hover:text-accent"
              aria-label="Help"
              aria-haspopup="dialog"
            >
              <CircleHelp className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {!online && (
          <div role="status" className="flex items-center gap-2 border-b border-st-monitor/30 bg-st-monitor-bg px-4 py-2 text-[0.88rem] text-ink lg:px-8">
            <WifiOff className="size-4 shrink-0 text-st-monitor" aria-hidden="true" />
            {copy.states.offline}
          </div>
        )}

        <div className="mx-auto hidden w-full max-w-[1320px] items-center gap-2 px-8 pt-5 lg:flex">
          {!sidebar && (
            <button
              type="button"
              onClick={() => showSidebar(true)}
              aria-label="Show sidebar"
              title="Show sidebar"
              className="fade-in inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-s)] border border-line bg-surface px-3 text-[0.9rem] font-semibold text-ink transition-colors hover:border-green hover:text-accent"
            >
              <PanelLeftOpen className="size-[1.15rem]" aria-hidden="true" />
              <span>Menu</span>
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <CloudBadge />
            <ThemeToggle />
            <HelpButton onOpen={() => setHelp(true)} />
          </div>
        </div>

        <main id="main" className="mx-auto w-full max-w-[1320px] px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-2 lg:pb-12">
          {children}
        </main>
      </div>

      <HelpDrawer open={help} onClose={() => setHelp(false)} />
      <Tour />

      <MobileNav path={path} />
    </div>
  );
}
