"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { Batch, BatchEvent } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { batchTotals, dayKey } from "@/vendor/selectors";
import { useVendorState } from "@/vendor/useOilStatus";
import { Panel, PageHeader, Tag, LinkButton } from "@/components/ui";
import { ChipToggle } from "@/components/vendor/inputs";
import { Timeline, eventText } from "@/components/vendor/timeline";
import { WorkspaceSkeleton } from "@/components/vendor/states";
import { cx, fmtDate, fmtDayLabel, fmtLitres } from "@/frontend/format";

type Kind = BatchEvent["kind"];
const KINDS: { k: Kind; label: string }[] = [
  { k: "session", label: "Sessions" },
  { k: "check", label: "Checks" },
  { k: "topup", label: "Top-ups" },
  { k: "replaced", label: "Replacements" },
];

export default function HistoryPage() {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <History />
    </Suspense>
  );
}

function History() {
  const state = useVendorState();
  const params = useSearchParams();
  const [batchId, setBatchId] = useState<string | null>(null);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [q, setQ] = useState("");
  const selected = batchId ?? params.get("batch") ?? "all";

  const groups = useMemo(() => {
    if (!state) return [];
    const evs: (BatchEvent & { batch: Batch })[] = [];
    for (const b of state.batches) if (selected === "all" || b.id === selected) for (const e of b.events) evs.push({ ...e, batch: b });
    const needle = q.trim().toLowerCase();
    const filtered = evs
      .filter((e) => !kinds.length || kinds.includes(e.kind))
      .filter((e) => !needle || eventText(e).includes(needle) || e.batch.label.toLowerCase().includes(needle))
      .sort((a, b) => (a.at < b.at ? 1 : -1));
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const k = dayKey(e.at);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.entries()];
  }, [state, selected, kinds, q]);

  if (!state) return <WorkspaceSkeleton />;
  const count = groups.reduce((a, [, v]) => a + v.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Records" title={copy.history.title} lead={copy.history.lead} actions={<LinkButton href="/app/setup" variant="secondary">{copy.actions.setup}</LinkButton>} />

      {state.batches.length === 0 ? (
        <Panel className="px-6 py-12 text-center text-gray">{copy.history.empty}</Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* batch list */}
          <nav aria-label="Batches" className="min-w-0">
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              <li className="shrink-0">
                <button
                  type="button"
                  aria-pressed={selected === "all"}
                  onClick={() => setBatchId("all")}
                  className={cx("min-h-12 w-full rounded-[var(--radius-s)] border px-4 text-left font-semibold", selected === "all" ? "border-forest bg-forest text-white" : "border-line bg-white text-ink hover:border-green")}
                >
                  {copy.history.all} <span className="font-mono text-[0.8rem] opacity-70">({state.batches.length})</span>
                </button>
              </li>
              {state.batches.map((b) => {
                const t = batchTotals(b);
                const on = selected === b.id;
                const active = b.id === state.activeBatchId;
                return (
                  <li key={b.id} className="w-64 shrink-0 lg:w-auto">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setBatchId(b.id)}
                      className={cx("w-full rounded-[var(--radius-m)] border p-4 text-left transition-colors", on ? "border-green bg-mint/60" : "border-line bg-white hover:border-line-strong")}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-ink">{b.label}</span>
                        <Tag tone={active ? "green" : "outline"}>{active ? copy.history.active : copy.history.closed}</Tag>
                      </span>
                      <span className="mt-0.5 block text-[0.82rem] text-gray">
                        {fmtDate(b.startedAt)} {b.endedAt ? `to ${fmtDate(b.endedAt)}` : "to now"} · {copy.oilTypes[b.oilType]}
                      </span>
                      <span className="mt-3 grid grid-cols-3 gap-2 font-mono text-[0.8rem] text-ink tabular">
                        <span>
                          {t.hours} h<span className="block text-[0.68rem] text-gray">frying</span>
                        </span>
                        <span>
                          {t.sessions}
                          <span className="block text-[0.68rem] text-gray">sessions</span>
                        </span>
                        <span>
                          {fmtLitres(b.volumeL + t.topupLitres)}
                          <span className="block text-[0.68rem] text-gray">oil used</span>
                        </span>
                      </span>
                      {b.endReason && <span className="mt-2 block text-[0.8rem] text-gray">Replaced: {copy.reasons[b.endReason]}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* events */}
          <section aria-labelledby="ev-h" className="min-w-0">
            <h2 id="ev-h" className="sr-only">
              Events
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block flex-1">
                <span className="sr-only">{copy.history.search}</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray" aria-hidden="true" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search food, sign, reason…"
                  className="h-12 w-full rounded-[var(--radius-s)] border border-line-strong bg-white pr-3 pl-9"
                />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Event types">
                {KINDS.map(({ k, label }) => (
                  <ChipToggle key={k} on={kinds.includes(k)} onClick={() => setKinds((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]))}>
                    {label}
                  </ChipToggle>
                ))}
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[0.85rem] text-gray" aria-live="polite">
              {count} event{count === 1 ? "" : "s"}
              {(kinds.length > 0 || q) && (
                <button
                  type="button"
                  onClick={() => {
                    setKinds([]);
                    setQ("");
                  }}
                  className="inline-flex min-h-11 items-center gap-1 font-medium text-green"
                >
                  <X className="size-3.5" aria-hidden="true" /> Clear filters
                </button>
              )}
            </p>

            {groups.length === 0 ? (
              <Panel className="mt-3 px-6 py-10 text-center text-gray">{copy.history.noResults}</Panel>
            ) : (
              <div className="mt-3 space-y-4">
                {groups.map(([day, evs]) => (
                  <Panel key={day} as="article" aria-label={fmtDayLabel(day)}>
                    <header className="flex items-baseline justify-between border-b border-line px-5 py-2.5">
                      <h3 className="font-display text-[0.95rem] font-bold text-ink">{fmtDayLabel(day)}</h3>
                      <span className="font-mono text-[0.75rem] text-gray">
                        {evs[0].batch.label}
                        {new Set(evs.map((e) => e.batch.id)).size > 1 ? " +" : ""}
                      </span>
                    </header>
                    <Timeline events={evs} showDate={false} />
                  </Panel>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
