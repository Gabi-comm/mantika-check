"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronRight, ClipboardCheck, Compass, Droplets, History, Info, LayoutDashboard, MoreHorizontal, Plus, RefreshCw, ScanLine, Settings, Timer, X } from "@/components/icons";
import { cx } from "@/frontend/format";
import { copy } from "@/vendor/copy";
import { startTour } from "./help/tourEvents";

type Sheet = "report" | "more" | null;

const REPORTS = [
  { href: "/app/log", label: copy.nav.log, desc: "How long and how hot", icon: Timer },
  { href: "/app/check", label: copy.nav.check, desc: "Smoke, foam, colour", icon: ClipboardCheck },
  { href: "/app/top-up", label: "Top Up", desc: "Fresh oil added", icon: Droplets },
  { href: "/app/replace", label: "Replace Oil", desc: "Start a fresh batch", icon: RefreshCw },
];
const MORE = [
  { href: "/app/settings", label: copy.nav.settings, icon: Settings },
  { href: "/app/about", label: copy.nav.about, icon: Info },
  { href: "/app/experimental/color", label: copy.nav.experimental, icon: ScanLine },
  { href: "/", label: "Back to website", icon: ArrowUpRight },
];

const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

/** Phone navigation: Dashboard, History, a central Report button that opens every way to record something, Quick Check and More. */
export function MobileNav({ path }: { path: string }) {
  const [sheet, setSheet] = useState<Sheet>(null);

  // Close whichever sheet is open once the route changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSheet(null), [path]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const reporting = REPORTS.some((r) => path.startsWith(r.href)) || path.startsWith("/app/setup");
  const inMore = MORE.some((m) => m.href !== "/" && path.startsWith(m.href));

  return (
    <>
      {sheet && (
        <BottomSheet title={sheet === "report" ? "Report" : "More"} onClose={() => setSheet(null)}>
          {sheet === "report" ? (
            <>
              <ul className="grid grid-cols-2 gap-2.5">
                {REPORTS.map(({ href, label, desc, icon: Icon }, i) => (
                  <li key={href} className="fade-up" style={{ animationDelay: `${60 + i * 40}ms` }}>
                    <Link href={href} className="flex h-full flex-col gap-2 rounded-[var(--radius-m)] border border-line bg-canvas p-4 transition-colors active:border-green">
                      <span className="grid size-10 place-items-center rounded-[var(--radius-s)] bg-tint text-accent">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-semibold text-ink">{label}</span>
                        <span className="block text-[0.8rem] leading-snug text-gray">{desc}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/app/history" className="fade-up mt-3 flex min-h-14 items-center gap-3 rounded-[var(--radius-m)] border border-line px-4 font-semibold text-ink" style={{ animationDelay: "220ms" }}>
                <History className="size-5 text-accent" aria-hidden="true" />
                <span className="flex-1">
                  See your reports
                  <span className="block text-[0.8rem] font-normal text-gray">Every session, check and top-up</span>
                </span>
                <ChevronRight className="size-4 text-gray" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-m)] border border-line">
              {MORE.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-14 items-center gap-3 px-4 font-medium text-ink active:bg-pale">
                    <Icon className="size-5 text-gray" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight className="size-4 text-gray" aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSheet(null);
                    startTour();
                  }}
                  className="flex min-h-14 w-full items-center gap-3 px-4 text-left font-medium text-ink active:bg-pale"
                >
                  <Compass className="size-5 text-gray" aria-hidden="true" />
                  <span className="flex-1">Take the guided tour</span>
                </button>
              </li>
            </ul>
          )}
        </BottomSheet>
      )}

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden" aria-label="Workspace navigation">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          <Tab href="/app" label="Dashboard" icon={LayoutDashboard} on={isActive(path, "/app")} tour="dashboard" />
          <Tab href="/app/history" label="History" icon={History} on={isActive(path, "/app/history")} tour="history" />
          <li className="flex justify-center">
            <button
              type="button"
              data-tour="log"
              onClick={() => setSheet(sheet === "report" ? null : "report")}
              aria-expanded={sheet === "report"}
              aria-haspopup="dialog"
              className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-heading"
            >
              <span
                className={cx(
                  "-mt-5 grid size-13 place-items-center rounded-full border-4 border-surface text-white shadow-md transition-transform duration-300",
                  reporting || sheet === "report" ? "bg-forest" : "bg-green",
                  sheet === "report" && "rotate-45"
                )}
              >
                <Plus className="size-6" aria-hidden="true" />
              </span>
              Report
            </button>
          </li>
          <Tab href="/app/check" label="Check" icon={ClipboardCheck} on={isActive(path, "/app/check")} tour="check" />
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => setSheet(sheet === "more" ? null : "more")}
              aria-expanded={sheet === "more"}
              aria-haspopup="dialog"
              className={cx("flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium", inMore || sheet === "more" ? "font-semibold text-heading" : "text-gray")}
            >
              <MoreHorizontal className="size-[1.35rem]" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

function Tab({ href, label, icon: Icon, on, tour }: { href: string; label: string; icon: typeof Timer; on: boolean; tour?: string }) {
  return (
    <li className="flex justify-center">
      <Link
        href={href}
        data-tour={tour}
        aria-current={on ? "page" : undefined}
        className={cx("relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium transition-colors", on ? "font-semibold text-heading" : "text-gray")}
      >
        <span className={cx("absolute top-0 h-0.5 rounded-full bg-green transition-all duration-300", on ? "w-8 opacity-100" : "w-0 opacity-0")} aria-hidden="true" />
        <Icon className="size-[1.35rem]" aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[35] lg:hidden">
      <button type="button" aria-label="Close" onClick={onClose} className="fade-in absolute inset-0 bg-black/50" />
      <div role="dialog" aria-modal="true" aria-label={title} className="sheet-in absolute inset-x-0 bottom-0 rounded-t-[var(--radius-l)] border-t border-line bg-surface px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] shadow-card">
        <span className="mx-auto block h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        <div className="mt-3 mb-4 flex items-center justify-between">
          <h2 className="text-[1.15rem] font-extrabold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} className="grid size-10 place-items-center rounded-[var(--radius-s)] text-gray hover:bg-pale hover:text-ink">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
