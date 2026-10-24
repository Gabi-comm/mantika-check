"use client";

// first-time guided tour
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Ollie } from "@/components/Ollie";
import { cx } from "@/frontend/format";
import type { Action } from "@/vendor/types";
import { HELP, TOUR_STOPS } from "./content";
import { TOUR_EVENT, TOUR_KEY } from "./tourEvents";

interface Stop {
  target: string;
  title: string;
  body: string;
  points: string[];
}

const HELP_STOP: Stop = { target: "help", title: "Help is always here", body: "Open Help on any screen to see what that section does, with a short animated example.", points: [] };
const MOODS: Action[] = ["keep", "monitor", "change_soon", "keep", "monitor", "keep"];

function visible(target: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function buildStops(): Stop[] {
  const stops: Stop[] = TOUR_STOPS.map(({ id, target }) => ({
    target,
    title: HELP[id].title,
    body: HELP[id].summary,
    points: HELP[id].points.slice(0, 2).map((p) => p.t),
  }));
  return [...stops, HELP_STOP].filter((s) => visible(s.target));
}

export function Tour() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [i, setI] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const begin = useCallback(() => {
    const go = (s: Stop[]) => {
      setStops(s);
      setI(0);
    };
    const s = buildStops();
    if (s.length) return go(s);
    setTimeout(() => {
      const later = buildStops();
      if (later.length) go(later);
    }, 400);
  }, []);

  const finish = useCallback(() => {
    setI(null);
    try {
      localStorage.setItem(TOUR_KEY, "done");
    } catch {}
  }, []);

  useEffect(() => {
    window.addEventListener(TOUR_EVENT, begin);
    let seen = true;
    try {
      seen = !!localStorage.getItem(TOUR_KEY);
    } catch {}
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!seen) {
      const wait = () => {
        if (document.documentElement.dataset.intro === "play") timer = setTimeout(wait, 400);
        else timer = setTimeout(begin, 500);
      };
      wait();
    }
    return () => {
      window.removeEventListener(TOUR_EVENT, begin);
      clearTimeout(timer);
    };
  }, [begin]);

  useLayoutEffect(() => {
    if (i === null) return;
    const measure = () => {
      const el = visible(stops[i].target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    visible(stops[i].target)?.scrollIntoView({ block: "nearest" });
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [i, stops]);

  useEffect(() => {
    if (i === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((v) => (v === null ? v : Math.min(v + 1, stops.length - 1)));
      if (e.key === "ArrowLeft") setI((v) => (v === null ? v : Math.max(v - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, stops.length, finish]);

  if (i === null || !rect) return null;
  const stop = stops[i];
  const last = i === stops.length - 1;
  const pad = 6;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(340, vw - 32);
  const side = rect.right + cardW + 24 < vw && rect.left < vw / 3;
  const below = !side && rect.top < vh / 2;
  const left = side ? rect.right + 18 : Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 16);
  const pos = side
    ? { left, top: Math.min(Math.max(16, rect.top - 24), vh - 300) }
    : below
      ? { left, top: rect.bottom + 18 }
      : { left, bottom: vh - rect.top + 18 };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="absolute inset-0" onClick={finish} aria-hidden="true" />
      <div
        className="tour-ring pointer-events-none absolute rounded-[10px] ring-2 ring-ollie-fresh"
        style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        aria-hidden="true"
      />
      <div key={i} className="fade-up absolute rounded-[var(--radius-l)] border border-line bg-surface p-5 shadow-card" style={{ width: cardW, ...pos }}>
        <div className="flex items-start gap-3">
          <Ollie state={MOODS[i % MOODS.length]} size={46} />
          <div className="min-w-0">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-teal">
              Step {i + 1} of {stops.length}
            </p>
            <h2 id="tour-title" className="mt-0.5 text-[1.15rem] font-extrabold text-ink">
              {stop.title}
            </h2>
          </div>
        </div>
        <p className="mt-3 text-[0.92rem] text-ink/85">{stop.body}</p>
        {stop.points.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {stop.points.map((p) => (
              <li key={p} className="rounded-full bg-tint px-2.5 py-1 text-[0.75rem] font-medium text-accent">
                {p}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden="true">
            {stops.map((s, k) => (
              <span key={s.target} className={cx("h-1.5 rounded-full transition-all", k === i ? "w-5 bg-green" : "w-1.5 bg-line-strong")} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {i === 0 ? (
              <button type="button" onClick={finish} className="min-h-10 px-3 text-[0.88rem] font-medium text-gray hover:text-ink">
                Skip
              </button>
            ) : (
              <button type="button" onClick={() => setI(i - 1)} className="grid size-10 place-items-center rounded-[var(--radius-s)] text-gray hover:bg-pale hover:text-ink" aria-label="Previous step">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              autoFocus
              onClick={() => (last ? finish() : setI(i + 1))}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-s)] bg-green px-4 text-[0.88rem] font-semibold text-white hover:bg-forest"
            >
              {last ? "Got it" : "Next"} {!last && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
