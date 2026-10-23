"use client";

import Link from "next/link";
import { Timer, ClipboardCheck, Droplets, RefreshCw, Ban, ArrowRight, Eye } from "lucide-react";
import { useOilStatus } from "@/vendor/useOilStatus";
import { copy } from "@/vendor/copy";
import { HEAT_WEIGHT } from "@/vendor/adapter";
import { hoursByDay, latestCheck, sortedEvents } from "@/vendor/selectors";
import type { StatusResult } from "@/vendor/types";
import { daysBetween, fmtDate, fmtDateTime, fmtLitres, cx } from "@/frontend/format";
import { LinkButton, Metric, Panel, PanelHead, Tag } from "@/components/ui";
import { AdvicePanel, ForecastPanel, StatusPanel, WarningBanner, WhyPanel } from "@/components/vendor/status";
import { FoodBars, HeatLegend, HeatSplit, UsageChart } from "@/components/vendor/charts";
import { Timeline } from "@/components/vendor/timeline";
import { Flash, NoBatch, WorkspaceSkeleton } from "@/components/vendor/states";
import type { Totals } from "@/vendor/selectors";

export default function DashboardPage() {
  const { hydrated, state, batch, totals, result, advice, adviceLoading } = useOilStatus();
  if (!hydrated || !state) return <WorkspaceSkeleton />;
  if (!batch || !result) return <NoBatch hasHistory={state.batches.length > 0} />;

  const { status } = result;
  const lastEnd = totals.lastAt ?? batch.startedAt;
  const day = daysBetween(batch.startedAt, lastEnd);
  const check = latestCheck(batch);
  const recent = sortedEvents(batch).slice(0, 5);
  const closed = state.batches.filter((b) => b.endedAt).slice(0, 3);
  const isDemo = batch.origin === "demo";

  return (
    <div className="space-y-5">
      {status.hardRule && <WarningBanner text={status.hardRule} />}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">
            {state.profile?.stallName ?? "My stall"} · {batch.label} · Day {day} of batch
          </p>
          <h1 className="mt-1 text-[1.75rem] font-extrabold text-ink sm:text-[2.1rem]">Dashboard</h1>
          <p className="mt-1 text-gray">
            {copy.oilTypes[batch.oilType]}, {fmtLitres(batch.volumeL)} · {copy.heatSources[batch.heatSource]} · Monitoring since {fmtDate(batch.startedAt)}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <LinkButton href="/app/check" variant="secondary" size="lg" className="flex-1 sm:flex-none">
            <ClipboardCheck className="size-4" aria-hidden="true" />
            {copy.actions.check}
          </LinkButton>
          <LinkButton href="/app/log" size="lg" className="flex-1 sm:flex-none">
            <Timer className="size-4" aria-hidden="true" />
            {copy.actions.log}
          </LinkButton>
        </div>
      </header>

      <Flash />
      {isDemo && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] text-gray">
          <Tag tone="neutral">{copy.demo.badge}</Tag>
          <span className="hidden sm:inline">{copy.demo.note}</span>
          <span className="sm:hidden">Fictional records for exploration.</span>
          <Link href="/app/settings#data" className="inline-flex min-h-11 items-center font-medium text-green underline-offset-2 hover:underline">
            Manage demo data
          </Link>
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* primary column */}
        <div className="min-w-0 space-y-5">
          <StatusPanel result={result} batchLabel={batch.label} />
          <div className="space-y-5 xl:hidden">
            <WhyPanel reasons={status.reasons} idx="-m" />
            <AdvicePanel advice={advice} loading={adviceLoading} idx="-m" />
          </div>

          <ForecastPanel result={result} />

          <Panel aria-label="Usage summary">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 sm:grid-cols-4">
              <Metric label="Frying sessions" value={totals.sessions} note={`avg ${totals.sessions ? (totals.hours / totals.sessions).toFixed(1) : 0} h each`} />
              <Metric label="Oil volume" value={fmtLitres(batch.volumeL + totals.topupLitres).replace(" L", "")} unit="L" note={`${fmtLitres(batch.volumeL)} start + ${fmtLitres(totals.topupLitres)} top-up`} />
              <Metric label="Top-ups" value={totals.topups} note={totals.topups ? `${fmtLitres(totals.topupLitres)} added` : "None recorded"} />
              <Metric label="Last activity" value={totals.lastAt ? fmtDate(totals.lastAt) : "None"} note={totals.lastAt ? fmtDateTime(totals.lastAt).split(", ")[1] : "No events yet"} />
            </dl>
          </Panel>

          <Panel aria-labelledby="usage-h">
            <PanelHead id="usage-h" title="Frying hours per day" eyebrow="Usage" action={<HeatLegend />} />
            <div className="px-3 pt-3 pb-1 sm:px-5">
              <UsageChart data={hoursByDay(batch)} />
            </div>
          </Panel>

          <div className="grid items-start gap-5 md:grid-cols-2">
            <Panel aria-labelledby="heat-h">
              <PanelHead id="heat-h" title="Sessions by heat level" eyebrow="Breakdown" />
              <div className="p-5">
                <HeatSplit hours={totals.hoursByHeat} sessions={totals.sessionsByHeat} />
              </div>
            </Panel>
            <Panel aria-labelledby="food-h">
              <PanelHead id="food-h" title="Food categories" eyebrow="Breakdown" />
              <div className="p-5">
                <FoodBars counts={totals.foodCounts} sessions={totals.sessions} />
              </div>
            </Panel>
          </div>

          <Panel aria-labelledby="recent-h">
            <PanelHead
              id="recent-h"
              title="Recent activity"
              eyebrow="Timeline"
              action={
                <Link href="/app/history" className="inline-flex min-h-11 items-center gap-1 text-[0.88rem] font-medium text-green">
                  {copy.actions.viewHistory} <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
            <Timeline events={recent} />
          </Panel>
        </div>

        {/* secondary column */}
        <div className="min-w-0 space-y-5">
          <div className="hidden xl:block">
            <WhyPanel reasons={status.reasons} />
          </div>

          <Panel aria-labelledby="obs-h">
            <PanelHead id="obs-h" title="Warning observations" eyebrow="Latest quick check" action={check && <span className="font-mono text-[0.75rem] text-gray">{fmtDateTime(check.at)}</span>} />
            {check ? (
              <ul className="grid grid-cols-1 divide-y divide-line">
                {(Object.keys(copy.signs) as (keyof typeof copy.signs)[]).map((s) => {
                  const on = check.signs.includes(s);
                  return (
                    <li key={s} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[0.92rem]">
                      <span className={on ? "font-semibold text-ink" : "text-gray"}>{copy.signs[s].title}</span>
                      {on ? <Tag tone={s === "smoke" ? "red" : "amber"}>Noted</Tag> : <span className="font-mono text-[0.72rem] uppercase tracking-wider text-gray">Not noted</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-4 text-gray">No quick check recorded for this batch.</p>
            )}
            <div className="border-t border-line px-5 py-3">
              <LinkButton href="/app/check" variant="ghost" className="-ml-3">
                <Eye className="size-4" aria-hidden="true" /> Record a new check
              </LinkButton>
            </div>
          </Panel>

          <div className="hidden xl:block">
            <AdvicePanel advice={advice} loading={adviceLoading} />
          </div>

          <Panel aria-labelledby="oil-h">
            <PanelHead id="oil-h" title="Oil actions" eyebrow="Batch" />
            <div className="grid grid-cols-2 gap-2 p-4">
              <Link
                href="/app/top-up"
                className={cx(
                  "flex min-h-20 flex-col justify-between rounded-[var(--radius-s)] border p-3 text-[0.92rem] font-semibold",
                  status.noTopUp ? "border-st-replace/40 bg-st-replace-bg text-st-replace" : "border-line-strong text-ink hover:border-green"
                )}
              >
                {status.noTopUp ? <Ban className="size-5" aria-hidden="true" /> : <Droplets className="size-5 text-green" aria-hidden="true" />}
                <span>{status.noTopUp ? "Do Not Top Up" : copy.actions.topUp}</span>
              </Link>
              <Link href="/app/replace" className="flex min-h-20 flex-col justify-between rounded-[var(--radius-s)] border border-line-strong p-3 text-[0.92rem] font-semibold text-ink hover:border-green">
                <RefreshCw className="size-5 text-green" aria-hidden="true" />
                <span>{copy.actions.replace}</span>
              </Link>
            </div>
          </Panel>

          <HeatComparison result={result} totals={totals} />

          <Panel aria-labelledby="batches-h">
            <PanelHead id="batches-h" title="Previous batches" eyebrow="History" />
            {closed.length ? (
              <ul className="divide-y divide-line">
                {closed.map((b) => {
                  const hrs = b.events.reduce((a, e) => a + (e.kind === "session" ? e.hours : 0), 0);
                  return (
                    <li key={b.id}>
                      <Link href={`/app/history?batch=${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-pale">
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">{b.label}</span>
                          <span className="block text-[0.82rem] text-gray">
                            {fmtDate(b.startedAt)} to {fmtDate(b.endedAt!)} · {b.endReason ? copy.reasons[b.endReason] : "Closed"}
                          </span>
                        </span>
                        <span className="font-mono text-[0.85rem] text-ink tabular">{hrs} h</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-4 text-gray">No closed batches yet.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Demonstrates the heuristic's heat weighting using this batch's own hours. Never shown over a warning. */
function HeatComparison({ result, totals }: { result: StatusResult; totals: Totals }) {
  const blocked = !!result.status.hardRule || result.status.action === "change_now";
  const high = totals.hoursByHeat.high;
  const diff = Math.round(high * (HEAT_WEIGHT.high - HEAT_WEIGHT.medium) * 10) / 10;
  return (
    <Panel aria-labelledby="hc-h">
      <PanelHead id="hc-h" title={copy.heatCompare.title} eyebrow="Demo heuristic" action={<Tag tone="outline">{copy.illustrative}</Tag>} />
      <div className="space-y-3 p-5">
        {blocked ? (
          <p className="text-[0.92rem] font-medium text-st-replace">{copy.heatCompare.blocked}</p>
        ) : (
          <>
            <p className="text-[0.92rem] text-gray">{copy.heatCompare.lead}</p>
            <dl className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((h) => (
                <div key={h} className="rounded-[var(--radius-s)] border border-line px-3 py-2">
                  <dt className="text-[0.75rem] text-gray">1 h {copy.heat[h]}</dt>
                  <dd className="font-mono text-[1rem] font-medium text-ink tabular">×{HEAT_WEIGHT[h].toFixed(1)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[0.9rem] text-ink">
              {high > 0 ? (
                <>
                  This batch has <b>{high} h</b> at high heat. At medium heat the same hours would add <b>{diff}</b> fewer points to the demo index.
                </>
              ) : (
                "No high-heat hours logged on this batch."
              )}
            </p>
          </>
        )}
        {!blocked && <p className="text-[0.85rem] text-ink">Weekly peso savings: <span className="text-gray">not available until a validated engine is connected.</span></p>}
        <p className="text-[0.78rem] text-gray">{copy.heatCompare.note}</p>
      </div>
    </Panel>
  );
}
