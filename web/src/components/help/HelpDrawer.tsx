"use client";

// help sidebar
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, X, Compass, ChevronDown } from "@/components/icons";
import { Ollie } from "@/components/Ollie";
import { cx } from "@/frontend/format";
import { HELP, helpForPath, type HelpId } from "./content";
import { startTour } from "./tourEvents";

const ALL: HelpId[] = ["dashboard", "log", "check", "history", "topup", "replace", "setup", "color", "settings"];

export function HelpButton({ className, onOpen }: { className?: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-tour="help"
      onClick={onOpen}
      className={cx("inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-s)] border border-line bg-surface px-3 text-[0.9rem] font-semibold text-ink transition-colors hover:border-green hover:text-accent", className)}
      aria-haspopup="dialog"
    >
      <CircleHelp className="size-[1.15rem]" aria-hidden="true" />
      <span>Help</span>
    </button>
  );
}

export function HelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname() ?? "/app";
  const current = helpForPath(path);
  const [expanded, setExpanded] = useState<HelpId | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close help" onClick={onClose} className="fade-in absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <aside role="dialog" aria-modal="true" aria-labelledby="help-title" className="drawer-in absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-line bg-surface shadow-card">
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <Ollie state="keep" size={30} />
            <div>
              <p className="eyebrow">Help</p>
              <h2 id="help-title" className="text-[1.15rem] font-extrabold text-ink">
                {current.title}
              </h2>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="grid size-10 place-items-center rounded-[var(--radius-s)] text-gray hover:bg-pale hover:text-ink" aria-label="Close help">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <p key={current.id} className="fade-up text-[0.98rem] text-ink/85">
            {current.summary}
          </p>
          {current.demo && (
            <div key={`${current.id}-demo`} className="fade-up" style={{ animationDelay: "80ms" }}>
              {current.demo}
            </div>
          )}
          {current.points.length > 0 && (
            <ol className="space-y-3">
              {current.points.map((p, i) => (
                <li key={p.t} className="fade-up flex gap-3" style={{ animationDelay: `${160 + i * 90}ms` }}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-tint font-mono text-[0.75rem] font-semibold text-accent">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{p.t}</p>
                    <p className="text-[0.9rem] text-gray">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              startTour();
            }}
            className="flex w-full items-center gap-3 rounded-[var(--radius-m)] border border-dashed border-line-strong px-4 py-3 text-left transition-colors hover:border-green"
          >
            <Compass className="size-5 text-accent" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-ink">Take the guided tour</span>
              <span className="block text-[0.85rem] text-gray">A quick walk through each section.</span>
            </span>
          </button>

          <section aria-labelledby="all-h">
            <h3 id="all-h" className="eyebrow mb-2">
              All sections
            </h3>
            <ul className="divide-y divide-line rounded-[var(--radius-m)] border border-line">
              {ALL.filter((id) => id !== current.id).map((id) => {
                const h = HELP[id];
                const on = expanded === id;
                return (
                  <li key={id}>
                    <button type="button" aria-expanded={on} onClick={() => setExpanded(on ? null : id)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left font-medium text-ink hover:bg-pale">
                      {h.title}
                      <ChevronDown className={cx("size-4 text-gray transition-transform", on && "rotate-180")} aria-hidden="true" />
                    </button>
                    {on && (
                      <div className="fade-up space-y-2 px-4 pb-4">
                        <p className="text-[0.9rem] text-gray">{h.summary}</p>
                        <ul className="space-y-1 text-[0.86rem] text-ink/85">
                          {h.points.map((p) => (
                            <li key={p.t}>
                              <b className="font-semibold">{p.t}:</b> {p.d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
