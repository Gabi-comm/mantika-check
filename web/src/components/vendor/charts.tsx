import type { FoodId, Heat } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { fmtDayLabel } from "@/frontend/format";

/**
 * Small dependency-free SVG charts. Each one is drawn from real records (demo or user)
 * and ships a data table for screen readers and anyone who prefers numbers.
 */
const HEAT_FILL: Record<Heat, string> = { low: "var(--heat-low)", medium: "var(--heat-medium)", high: "var(--heat-high)" };
const HEATS: Heat[] = ["low", "medium", "high"];

export function HeatLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-gray" aria-hidden="true">
      {HEATS.map((h) => (
        <li key={h} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px]" style={{ background: HEAT_FILL[h] }} />
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
  if (!data.length) return <p className="py-6 text-center text-[0.9rem] text-gray">No sessions logged yet.</p>;
  const max = Math.max(4, ...data.map((d) => d.total));
  const top = Math.ceil((max + 1) / 2) * 2;
  const ticks = [top, top / 2, 0];
  const total = data.reduce((a, d) => a + d.total, 0);
  return (
    <figure>
      <div role="img" aria-label={`Frying hours per day, ${data.length} days, ${total} hours in total`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
        <div className="relative" style={{ height }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 font-mono text-[0.68rem] text-gray" style={{ top: `${(1 - t / top) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative" style={{ height }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className={`absolute inset-x-0 border-t ${t === 0 ? "border-line-strong" : "border-dashed border-line"}`} style={{ top: `${(1 - t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-1.5">
            {data.map((d) => (
              <div key={d.day} className="flex h-full w-full max-w-12 flex-col items-center justify-end">
                <span className="mb-1 font-mono text-[0.7rem] font-semibold text-ink">{d.total}h</span>
                <div className="flex w-full flex-col-reverse gap-px overflow-hidden rounded-t-[3px]" style={{ height: `${(d.total / top) * 100}%` }}>
                  {HEATS.map((h) => (d[h] ? <span key={h} style={{ flexGrow: d[h], background: HEAT_FILL[h] }} /> : null))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <span />
        <div className="mt-1.5 flex justify-around gap-1.5" aria-hidden="true">
          {data.map((d) => (
            <span key={d.day} className="w-full max-w-12 text-center text-[0.68rem] whitespace-nowrap text-gray">
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
  const total = HEATS.reduce((a, h) => a + hours[h], 0);
  if (!total) return <p className="text-[0.9rem] text-gray">No sessions logged yet.</p>;
  return (
    <figure>
      <div className="flex h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={HEATS.map((h) => `${copy.heat[h]} ${hours[h]} hours`).join(", ")}>
        {HEATS.map((h) => (hours[h] ? <span key={h} style={{ width: `${(hours[h] / total) * 100}%`, background: HEAT_FILL[h] }} /> : null))}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {HEATS.map((h) => (
          <div key={h} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[0.78rem] text-gray">
              <span className="size-2 rounded-[2px]" style={{ background: HEAT_FILL[h] }} aria-hidden="true" />
              {copy.heat[h]}
            </dt>
            <dd className="text-[0.95rem] font-semibold text-ink tabular">
              {hours[h]} h <span className="text-gray">· {sessions[h]}×</span>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

export function FoodBars({ counts, sessions }: { counts: Record<FoodId, number>; sessions: number }) {
  const rows = (Object.keys(counts) as FoodId[]).map((f) => ({ f, n: counts[f] })).sort((a, b) => b.n - a.n);
  if (!sessions) return <p className="text-[0.9rem] text-gray">No sessions logged yet.</p>;
  return (
    <figure>
      <ul className="space-y-2.5">
        {rows.map(({ f, n }) => (
          <li key={f}>
            <div className="flex justify-between gap-2 text-[0.85rem]">
              <span className="truncate text-ink">{copy.foods[f]}</span>
              <span className="font-mono text-gray tabular">
                {n}/{sessions}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-line" aria-hidden="true">
              <div className="h-full rounded-full bg-teal" style={{ width: `${(n / sessions) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="mt-2 text-[0.75rem] text-gray">Sessions that included each food. One session can include several.</figcaption>
    </figure>
  );
}
