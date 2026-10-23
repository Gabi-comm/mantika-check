import { LayoutDashboard, Timer, ClipboardCheck, History, Settings, Eye } from "lucide-react";
import { copy } from "@/vendor/copy";
import { fmtDate, fmtLitres } from "@/lib/format";
import { StatusScale } from "@/components/vendor/status";
import { UsageChart } from "@/components/vendor/charts";
import { Timeline } from "@/components/vendor/timeline";
import { Tag } from "@/components/ui";
import { demoSnapshot } from "./demoData";

function Annotation({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute hidden items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-teal xl:flex ${className}`}>
      {children}
    </span>
  );
}

/** Layered product preview built from real UI components and the deterministic demo dataset. */
export function HeroPreview() {
  const { batch, totals, days, check, events, result } = demoSnapshot();
  const a = result.status.action;
  return (
    <figure className="relative" aria-label="Preview of the MANTIKA CHECK dashboard using fictional demo data">
      {/* main window */}
      <div className="relative z-10 overflow-hidden rounded-[var(--radius-l)] border border-line-strong/70 bg-white shadow-[0_24px_60px_-28px_rgba(11,61,46,0.45)]">
        <div className="flex items-center justify-between border-b border-line bg-pale/70 px-4 py-2">
          <span className="font-mono text-[0.7rem] text-gray">mantika-check / dashboard</span>
          <Tag tone="outline">Demo data</Tag>
        </div>
        <div className="flex">
          <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-line py-4 text-gray sm:flex" aria-hidden="true">
            <LayoutDashboard className="size-4 text-green" />
            <Timer className="size-4" />
            <ClipboardCheck className="size-4" />
            <History className="size-4" />
            <Settings className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-teal">
                  {batch.label} · since {fmtDate(batch.startedAt)}
                </p>
                <p className="font-display text-lg font-extrabold text-ink">Corner Fish Ball Stand</p>
              </div>
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-s)] bg-green px-3 text-[0.78rem] font-semibold text-white">
                <Timer className="size-3.5" aria-hidden="true" /> Log Session
              </span>
            </div>

            <div className="rounded-[var(--radius-m)] border border-line">
              <div className="flex items-center gap-3 bg-st-monitor-bg px-4 py-3">
                <span className="grid size-9 place-items-center rounded-[var(--radius-s)] bg-white text-st-monitor">
                  <Eye className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[1.15rem] font-extrabold leading-tight text-st-monitor">{copy.status[a]}</p>
                  <p className="truncate text-[0.78rem] text-ink/70">{result.status.reasons[0]}</p>
                </div>
              </div>
              <div className="px-4 py-3">
                <StatusScale action={a} compact />
              </div>
            </div>

            <dl className="grid grid-cols-3 divide-x divide-line rounded-[var(--radius-m)] border border-line text-center">
              {[
                ["Frying time", `${totals.hours} h`],
                ["Sessions", String(totals.sessions)],
                ["Oil volume", fmtLitres(batch.volumeL + totals.topupLitres)],
              ].map(([k, v]) => (
                <div key={k} className="px-2 py-2.5">
                  <dt className="text-[0.68rem] text-gray">{k}</dt>
                  <dd className="font-display text-[1.1rem] font-bold text-ink tabular">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-[var(--radius-m)] border border-line px-2 pt-2">
              <p className="px-2 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-gray">Hours per day</p>
              <UsageChart data={days} height={150} table={false} />
            </div>
          </div>
        </div>
      </div>

      {/* layered cards (desktop) */}
      <div className="relative z-20 mt-4 grid gap-4 sm:grid-cols-2 lg:absolute lg:-bottom-14 lg:-left-16 lg:mt-0 lg:block lg:w-64">
        <div className="rounded-[var(--radius-m)] border border-line bg-white p-4 shadow-[0_18px_40px_-24px_rgba(20,37,54,0.5)]">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-teal">Latest quick check</p>
          <p className="mt-0.5 text-[0.75rem] text-gray">{check && fmtDate(check.at)} · reported by vendor</p>
          <ul className="mt-2 space-y-1 text-[0.82rem]">
            {(["dark_murky", "foam", "thick"] as const).map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className={check?.signs.includes(s) ? "font-semibold text-ink" : "text-gray"}>{copy.signs[s].title}</span>
                {check?.signs.includes(s) ? <Tag tone="amber">Noted</Tag> : <span className="font-mono text-[0.62rem] uppercase text-gray">No</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative z-20 mt-4 hidden w-64 overflow-hidden rounded-[var(--radius-m)] border border-line bg-white shadow-[0_18px_40px_-24px_rgba(20,37,54,0.5)] lg:absolute lg:-top-12 lg:-right-6 lg:mt-0 lg:block xl:-right-14">
        <p className="border-b border-line px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-teal">Activity</p>
        <div className="text-[0.85rem] [&_p]:text-[0.8rem]">
          <Timeline events={events.slice(0, 2)} dense />
        </div>
      </div>

      <Annotation className="-top-16 left-6">
        <span className="h-px w-8 bg-teal" /> Status source: demo heuristic, illustrative
      </Annotation>
      <Annotation className="right-0 -bottom-20">
        Every figure derives from logged records <span className="h-px w-8 bg-teal" />
      </Annotation>
      <figcaption className="sr-only">
        Example dashboard for a fictional stall: status {copy.status[a]}, {totals.hours} hours over {totals.sessions} sessions.
      </figcaption>
    </figure>
  );
}
