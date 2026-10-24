// small animated demos for the features page
import type { CSSProperties, ReactNode } from "react";
import { Check, Ban, TriangleAlert, Droplets, CircleCheck, Timer, RefreshCw, ClipboardCheck } from "@/components/icons";
import { Ollie } from "@/components/Ollie";
import { copy } from "@/vendor/copy";
import type { Action } from "@/vendor/types";

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div aria-hidden="true" className="relative overflow-hidden rounded-[var(--radius-l)] border border-line bg-canvas p-5 shadow-card">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="ml-2 font-mono text-[0.65rem] text-gray">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function BatchDemo() {
  return (
    <Frame label="setup / new batch">
      <p className="text-[0.75rem] font-semibold text-gray">Oil type</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {["Palm Olein", "Coconut", "Soybean"].map((o, i) => (
          <span key={o} className={`demo-tap rounded-[var(--radius-s)] border px-2 py-2 text-center text-[0.75rem] font-semibold ${i === 0 ? "border-green bg-tint text-accent" : "border-line text-ink"}`} style={d(i === 0 ? 0.6 : 99)}>
            {o}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[0.75rem] font-semibold text-gray">Starting volume</p>
      <div className="mt-2 h-10 rounded-[var(--radius-s)] border border-line bg-surface px-3 py-2 font-mono text-[0.85rem] text-ink">
        <span className="demo-step inline-block" style={d(0.4)}>
          4 L
        </span>
      </div>
      <div className="demo-step mt-4 flex items-center gap-2 rounded-[var(--radius-s)] bg-green px-3 py-2 text-[0.8rem] font-semibold text-white" style={d(1.4)}>
        <CircleCheck className="size-4" /> New batch started
      </div>
    </Frame>
  );
}

export function LogDemo() {
  return (
    <Frame label="log / frying session">
      <p className="text-[0.75rem] font-semibold text-gray">How long?</p>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {["1 h", "2 h", "3 h", "4 h", "5+ h"].map((h, i) => (
          <span key={h} className={`demo-tap rounded-[var(--radius-s)] border py-2 text-center font-mono text-[0.75rem] ${i === 2 ? "border-green bg-tint text-accent" : "border-line text-ink"}`} style={d(i === 2 ? 0.3 : 99)}>
            {h}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[0.75rem] font-semibold text-gray">Heat</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {(["low", "medium", "high"] as const).map((h) => (
          <span key={h} className={`demo-tap rounded-[var(--radius-s)] border py-2 text-center text-[0.75rem] font-semibold ${h === "medium" ? "border-green bg-tint text-accent" : "border-line text-ink"}`} style={d(h === "medium" ? 1 : 99)}>
            {copy.heat[h]}
          </span>
        ))}
      </div>
      <div className="demo-step mt-4 flex items-center gap-2 text-[0.8rem] font-semibold text-st-continue" style={d(1.8)}>
        <Timer className="size-4" /> Session saved · 3 taps
      </div>
    </Frame>
  );
}

export function CheckDemo() {
  const signs = ["smoke", "foam", "dark_murky", "thick"] as const;
  return (
    <Frame label="quick check">
      <ul className="space-y-1.5">
        {signs.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 rounded-[var(--radius-s)] border border-line bg-surface px-3 py-2 text-[0.8rem] text-ink">
            <span className="grid size-4 place-items-center rounded-[3px] border border-line-strong">{i === 0 && <Check className="demo-tick size-3 text-st-replace" />}</span>
            {copy.signs[s].title}
          </li>
        ))}
      </ul>
      <div className="demo-step mt-3 flex items-start gap-2 rounded-[var(--radius-s)] bg-critical px-3 py-2 text-[0.78rem] text-white" style={d(2.4)}>
        <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Critical warning: change the oil now. Overrides every other status.
      </div>
    </Frame>
  );
}

export function StatusDemo() {
  const states: Action[] = ["keep", "monitor", "change_soon", "change_now"];
  return (
    <Frame label="dashboard / status">
      <div className="relative grid h-44 place-items-center">
        {states.map((a, i) => (
          <div key={a} className="demo-cycle absolute inset-0 flex flex-col items-center justify-center gap-3" style={d(i * 2)}>
            <Ollie state={a} size={74} scene />
            <span className="font-display text-[1rem] font-extrabold text-ink">{copy.status[a]}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {states.map((a, i) => (
          <span key={a} className={`h-1.5 rounded-full ${["bg-st-continue", "bg-st-monitor", "bg-st-recommend", "bg-st-replace"][i]}`} />
        ))}
      </div>
    </Frame>
  );
}

export function SimulatorDemo() {
  const rows = [
    { h: "low", w: "100%", v: "30+ h", c: "var(--heat-low)" },
    { h: "medium", w: "62%", v: "11.1 h", c: "var(--heat-medium)" },
    { h: "high", w: "40%", v: "7.8 h", c: "var(--heat-high)" },
  ] as const;
  return (
    <Frame label="heat simulator">
      <p className="text-[0.75rem] font-semibold text-gray">Hours left at each heat</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <li key={r.h} className="grid grid-cols-[4.2rem_minmax(0,1fr)_3.2rem] items-center gap-2 text-[0.78rem]">
            <span className="text-ink">{copy.heat[r.h]}</span>
            <span className="h-3 rounded-full bg-line">
              <span className="demo-grow block h-full rounded-full" style={{ width: r.w, background: r.c, ...d(i * 0.25) }} />
            </span>
            <span className="text-right font-mono text-ink">{r.v}</span>
          </li>
        ))}
      </ul>
      <p className="demo-step mt-4 rounded-[var(--radius-s)] bg-tint px-3 py-2 text-[0.78rem] font-semibold text-accent" style={d(1.6)}>
        Fry one level lower: PHP 68 saved per week
      </p>
    </Frame>
  );
}

export function TopUpDemo() {
  return (
    <Frame label="top up">
      <div className="flex items-end gap-5">
        <div className="relative h-32 w-20 overflow-hidden rounded-b-[18px] rounded-t-[6px] border-2 border-line-strong">
          <div className="demo-rise absolute inset-x-0 bottom-0 bg-ollie-used/80" />
          <Droplets className="demo-step absolute top-2 left-1/2 size-4 -translate-x-1/2 text-ollie-fresh" style={d(0.2)} />
        </div>
        <div className="flex-1 space-y-2">
          {["0.25 L", "0.5 L", "1 L"].map((l, i) => (
            <span key={l} className={`demo-tap block rounded-[var(--radius-s)] border px-3 py-1.5 text-center font-mono text-[0.75rem] ${i === 1 ? "border-green bg-tint text-accent" : "border-line text-ink"}`} style={d(i === 1 ? 0.3 : 99)}>
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="demo-step mt-4 flex items-center gap-2 rounded-[var(--radius-s)] border border-st-replace/40 bg-st-replace-bg px-3 py-2 text-[0.78rem] font-semibold text-st-replace" style={d(2.6)}>
        <Ban className="size-4" /> Past 25% TPC: Do Not Top Up
      </div>
    </Frame>
  );
}

export function HistoryDemo() {
  const items = [
    { icon: ClipboardCheck, t: "Quick check · no signs", w: "Oct 22" },
    { icon: Timer, t: "2 h session · Medium heat", w: "Oct 22" },
    { icon: Droplets, t: "Top-up · 0.5 L", w: "Oct 21" },
    { icon: RefreshCw, t: "Batch 07 replaced", w: "Oct 16" },
  ];
  return (
    <Frame label="history">
      <ol className="relative space-y-2 border-l border-line pl-4">
        {items.map(({ icon: Icon, t, w }, i) => (
          <li key={t} className="demo-step flex items-center justify-between gap-3 rounded-[var(--radius-s)] border border-line bg-surface px-3 py-2 text-[0.78rem]" style={d(i * 0.35)}>
            <span className="flex items-center gap-2 text-ink">
              <Icon className="size-3.5 text-accent" /> {t}
            </span>
            <span className="font-mono text-gray">{w}</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
