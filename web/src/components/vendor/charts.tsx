"use client";

import { useState } from "react";
import type { FoodId, Heat } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { cx, fmtDayLabel } from "@/frontend/format";
import { useCountUp, useInView } from "@/frontend/motion";

/**
 * Small dependency-free SVG/CSS charts. Each one is drawn from real records (demo or user)
 * and ships a data table for screen readers and anyone who prefers numbers.
 * Bars grow in (transform only) when the chart scrolls into view; the hovered item lifts while the rest dim.
 */
const HEAT_FILL: Record<Heat, string> = { low: "var(--heat-low)", medium: "var(--heat-medium)", high: "var(--heat-high)" };
const HEATS: Heat[] = ["low", "medium", "high"];
const GROW = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Counts up to `value`; whole numbers stay whole, others keep one decimal. */
function Num({ value, run }: { value: number; run: boolean }) {
  const v = useCountUp(value, run);
  return <>{Number.isInteger(value) ? Math.round(v) : v.toFixed(1)}</>;
}

export function HeatLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-gray" aria-hidden="true">
      {HEATS.map((h) => (
        <li key={h} className="flex items-center gap-1.5">
          <span className="ink size-2.5 rounded-[2px]" style={{ background: HEAT_FILL[h] }} />
          {copy.heat[h]} heat
        </li>
      ))}
    </ul>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-[0.82rem]">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-accent">View data table</summary>
      <div className="overflow-x-auto">
        <table className="mt-1 w-full border-collapse text-left tabular">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line text-gray">
              {head.map((h) => (
                <th key={h} scope="col" className="py-1.5 pr-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r[0])} className="border-b border-line/60">
                {r.map((c, i) => (i === 0 ? <th key={i} scope="row" className="py-1.5 pr-3 font-medium">{c}</th> : <td key={i} className="py-1.5 pr-3">{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export type DayRow = { day: string; low: number; medium: number; high: number; total: number };

export function UsageChart({ data, height = 180, table = true }: { data: DayRow[]; height?: number; table?: boolean }) {
  const [ref, shown] = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return <p className="py-6 text-center text-[0.9rem] text-gray">No sessions logged yet.</p>;
  const max = Math.max(4, ...data.map((d) => d.total));
  const top = Math.ceil((max + 1) / 2) * 2;
  const ticks = [top, top / 2, 0];
  const total = data.reduce((a, d) => a + d.total, 0);
  const tip = hover !== null ? data[hover] : null;
  return (
    <figure>
      <div ref={ref} role="img" aria-label={`Frying hours per day, ${data.length} days, ${total} hours in total`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
        <div className="relative" style={{ height }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 font-mono text-[0.68rem] text-gray" style={{ top: `${(1 - t / top) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative" style={{ height }} aria-hidden="true" onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <span key={t} className={`absolute inset-x-0 border-t ${t === 0 ? "border-line-strong" : "border-dashed border-line"}`} style={{ top: `${(1 - t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-1.5">
            {data.map((d, i) => (
              <div
                key={d.day}
                onPointerEnter={() => setHover(i)}
                className={cx("flex h-full w-full max-w-12 flex-col items-center justify-end transition-opacity duration-200", hover !== null && hover !== i && "opacity-40")}
              >
                <span className="mb-1 font-mono text-[0.7rem] font-semibold text-ink transition-opacity duration-500" style={{ opacity: shown ? 1 : 0, transitionDelay: `${300 + i * 70}ms` }}>
                  <Num value={d.total} run={shown} />h
                </span>
                <div
                  className="ink-bar flex w-full origin-bottom flex-col-reverse gap-px overflow-hidden rounded-t-[3px]"
                  style={{
                    height: `${(d.total / top) * 100}%`,
                    transform: `scale(${hover === i ? 1.1 : 1}, ${shown ? 1 : 0})`,
                    transition: `transform 0.8s ${GROW} ${shown && hover === null ? i * 70 : 0}ms`,
                  }}
                >
                  {HEATS.map((h) => (d[h] ? <span key={h} style={{ flexGrow: d[h], background: HEAT_FILL[h] }} /> : null))}
                </div>
              </div>
            ))}
          </div>
          {tip && hover !== null && (
            <div
              key={tip.day}
              className="chart-tip pointer-events-none absolute z-10 min-w-36 rounded-[var(--radius-s)] border border-line bg-surface px-3 py-2 text-[0.78rem] shadow-card"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%`, bottom: `${Math.min(70, (tip.total / top) * 100) + 10}%` }}
            >
              <p className="font-semibold text-ink">{fmtDayLabel(tip.day)}</p>
              {HEATS.filter((h) => tip[h]).map((h) => (
                <p key={h} className="mt-0.5 flex items-center justify-between gap-3 text-gray">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-[2px]" style={{ background: HEAT_FILL[h] }} />
                    {copy.heat[h]}
                  </span>
                  <span className="font-mono text-ink tabular">{tip[h]} h</span>
                </p>
              ))}
              <p className="mt-1 flex justify-between border-t border-line pt-1 font-semibold text-ink">
                Total <span className="font-mono tabular">{tip.total} h</span>
              </p>
            </div>
          )}
        </div>
        <span />
        <div className="mt-1.5 flex justify-around gap-1.5" aria-hidden="true">
          {data.map((d, i) => (
            <span key={d.day} className={cx("w-full max-w-12 text-center text-[0.68rem] whitespace-nowrap transition-colors", hover === i ? "font-semibold text-ink" : "text-gray")}>
              {fmtDayLabel(d.day)}
            </span>
          ))}
        </div>
      </div>
      {table && (
        <DataTable
          caption="Frying hours per day by heat level"
          head={["Day", "Low", "Medium", "High", "Total"]}
          rows={data.map((d) => [fmtDayLabel(d.day), d.low, d.medium, d.high, d.total])}
        />
      )}
    </figure>
  );
}

export function HeatSplit({ hours, sessions }: { hours: Record<Heat, number>; sessions: Record<Heat, number> }) {
  const [ref, shown] = useInView<HTMLElement>();
  const [hover, setHover] = useState<Heat | null>(null);
  const total = HEATS.reduce((a, h) => a + hours[h], 0);
  if (!total) return <p className="text-[0.9rem] text-gray">No sessions logged yet.</p>;
  return (
    <figure ref={ref} onPointerLeave={() => setHover(null)}>
      <div className="h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={HEATS.map((h) => `${copy.heat[h]} ${hours[h]} hours`).join(", ")}>
        <div className="ink-bar flex h-full origin-left" style={{ transform: `scaleX(${shown ? 1 : 0})`, transition: `transform 1s ${GROW}` }}>
        {HEATS.map((h) =>
          hours[h] ? (
            <span
              key={h}
              onPointerEnter={() => setHover(h)}
              style={{ width: `${(hours[h] / total) * 100}%`, background: HEAT_FILL[h], opacity: hover && hover !== h ? 0.35 : 1, transition: "opacity 0.2s" }}
            />
          ) : null
        )}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {HEATS.map((h) => (
          <div key={h} onPointerEnter={() => setHover(h)} className={cx("min-w-0 transition-opacity duration-200", hover && hover !== h && "opacity-45")}>
            <dt className="flex items-center gap-1.5 text-[0.78rem] text-gray">
              <span className="size-2 rounded-[2px]" style={{ background: HEAT_FILL[h] }} aria-hidden="true" />
              {copy.heat[h]}
              {hover === h && <span className="fade-in font-semibold text-ink">{Math.round((hours[h] / total) * 100)}%</span>}
            </dt>
            <dd className="text-[0.95rem] font-semibold text-ink tabular">
              <Num value={hours[h]} run={shown} /> h <span className="text-gray">· {sessions[h]}×</span>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

export function FoodBars({ counts, sessions }: { counts: Record<FoodId, number>; sessions: number }) {
  const [ref, shown] = useInView<HTMLElement>();
  const [hover, setHover] = useState<FoodId | null>(null);
  const rows = (Object.keys(counts) as FoodId[]).map((f) => ({ f, n: counts[f] })).sort((a, b) => b.n - a.n);
  if (!sessions) return <p className="text-[0.9rem] text-gray">No sessions logged yet.</p>;
  return (
    <figure ref={ref} onPointerLeave={() => setHover(null)}>
      <ul className="space-y-2.5">
        {rows.map(({ f, n }, i) => (
          <li key={f} onPointerEnter={() => setHover(f)} className={cx("transition-opacity duration-200", hover && hover !== f && "opacity-45")}>
            <div className="flex justify-between gap-2 text-[0.85rem]">
              <span className={cx("truncate text-ink", hover === f && "font-semibold")}>{copy.foods[f]}</span>
              <span className="font-mono text-gray tabular">
                <Num value={n} run={shown} />/{sessions}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-line" aria-hidden="true">
              <div
                className={cx("ink-bar h-full origin-left rounded-full", hover === f ? "bg-accent" : "bg-teal")}
                style={{ width: `${(n / sessions) * 100}%`, transform: `scaleX(${shown ? 1 : 0})`, transition: `transform 0.8s ${GROW} ${i * 90}ms, background-color 0.2s` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="mt-2 text-[0.75rem] text-gray">Sessions that included each food. One session can include several.</figcaption>
    </figure>
  );
}
