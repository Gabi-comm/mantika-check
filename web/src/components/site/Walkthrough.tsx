"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { copy } from "@/vendor/copy";
import { cx } from "@/frontend/format";

/** Static, non-interactive replicas of each workspace screen (inert), driven by an accessible tab list. */
function Seg({ items, on }: { items: string[]; on: number }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((t, i) => (
        <span key={t} className={cx("grid min-h-11 place-items-center rounded-[var(--radius-s)] border text-[0.85rem] font-semibold", i === on ? "border-forest bg-forest text-white" : "border-line-strong bg-white text-ink")}>
          {t}
        </span>
      ))}
    </div>
  );
}

function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div inert className="rounded-[var(--radius-l)] border border-line bg-canvas p-4 sm:p-5">
      <p className="mb-3 font-display font-bold text-ink">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

const L = ({ children }: { children: ReactNode }) => <p className="mb-1.5 text-[0.8rem] font-semibold text-ink">{children}</p>;

const STEPS: { id: string; tab: string; title: string; body: string; points: string[]; screen: ReactNode }[] = [
  {
    id: "setup",
    tab: "Set up",
    title: "Describe the oil once",
    body: "A batch starts with the oil type, volume and heat source. Defaults carry over from the previous batch, so a replacement takes seconds.",
    points: ["Oil type, volume, heat source", "Optional purchase cost and start date", "Inline validation as you type"],
    screen: (
      <Screen title={copy.setup.title}>
        <div>
          <L>{copy.setup.oilType}</L>
          <div className="flex flex-wrap gap-1.5">
            {["Palm oil", "Coconut oil", "Vegetable blend"].map((o, i) => (
              <span key={o} className={cx("rounded-full border px-3 py-1.5 text-[0.82rem]", i === 0 ? "border-green bg-mint text-forest" : "border-line-strong bg-white")}>
                {o}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <L>{copy.setup.volume}</L>
            <span className="flex h-11 items-center justify-between rounded-[var(--radius-s)] border border-line-strong bg-white px-3 font-mono text-[0.9rem]">
              3 <span className="text-gray">L</span>
            </span>
          </div>
          <div>
            <L>{copy.setup.heatSource}</L>
            <Seg items={["LPG", "Charcoal"]} on={0} />
          </div>
        </div>
      </Screen>
    ),
  },
  {
    id: "log",
    tab: "Log",
    title: "Three taps per session",
    body: "Pick the duration, pick the heat, save. Food categories and a thermometer reading are optional extras, never required.",
    points: ["Hour presets from 1 to 5+", "Low, medium or high heat", "Session time defaults to now"],
    screen: (
      <Screen title={copy.log.title}>
        <div>
          <L>{copy.log.duration}</L>
          <Seg items={["1", "2", "3", "4", "5+"]} on={2} />
        </div>
        <div>
          <L>{copy.log.heat}</L>
          <Seg items={["Low", "Medium", "High"]} on={1} />
        </div>
        <span className="grid h-11 place-items-center rounded-[var(--radius-s)] bg-green text-[0.9rem] font-semibold text-white">{copy.actions.saveSession}</span>
      </Screen>
    ),
  },
  {
    id: "check",
    tab: "Check",
    title: "Record what you notice",
    body: "Four large tiles cover the visible signs vendors already rely on. Any reported sign raises a critical warning immediately, as a conservative prototype rule.",
    points: ["Smoke, foaming, dark oil, thickness", "Filtered and covered toggles", "An empty check is never read as an all-clear"],
    screen: (
      <Screen title={copy.check.title}>
        <div className="grid gap-2">
          {(["smoke", "foam", "dark_murky", "thick"] as const).map((s) => (
            <span key={s} className={cx("flex items-center gap-3 rounded-[var(--radius-m)] border-2 bg-white px-3 py-2.5", s === "dark_murky" ? "border-green bg-mint" : "border-line")}>
              <span className={cx("grid size-6 place-items-center rounded-[4px] border-2", s === "dark_murky" ? "border-green bg-green text-white" : "border-line-strong")}>{s === "dark_murky" && <Check className="size-4" />}</span>
              <span>
                <span className="block text-[0.88rem] font-semibold">{copy.signs[s].title}</span>
                <span className="block text-[0.75rem] text-gray">{copy.signs[s].desc}</span>
              </span>
            </span>
          ))}
        </div>
      </Screen>
    ),
  },
  {
    id: "status",
    tab: "Status",
    title: "A status with its reasons",
    body: "Every status names its source and shows up to three contributing factors. A recorded critical sign always sits above everything else.",
    points: ["Four labelled monitoring states", "Source and validation shown on the card", "Warnings cannot be hidden by any other module"],
    screen: (
      <Screen title="Dashboard">
        <span className="flex gap-3 rounded-[var(--radius-m)] bg-critical p-3 text-white">
          <TriangleAlert className="size-5 shrink-0" />
          <span className="text-[0.82rem]">
            <b className="block">{copy.warning.title}</b>
            Unusual smoke was recorded at normal heat.
          </span>
        </span>
        <span className="block rounded-[var(--radius-m)] border border-line bg-st-replace-bg p-3">
          <span className="block font-display text-lg font-extrabold text-st-replace">{copy.status.change_now}</span>
          <span className="mt-1 flex gap-1.5">
            <span className="rounded-[3px] border border-line-strong px-1 font-mono text-[0.62rem] uppercase text-gray">Demo heuristic</span>
            <span className="rounded-[3px] border border-line-strong px-1 font-mono text-[0.62rem] uppercase text-gray">Illustrative</span>
          </span>
        </span>
      </Screen>
    ),
  },
  {
    id: "replace",
    tab: "Replace",
    title: "Close the batch, keep the record",
    body: "Replacing oil closes the current batch with a reason and opens a fresh one. Nothing is overwritten; history keeps every batch and event.",
    points: ["Reason captured for each replacement", "Top-up is blocked when replacement is due", "Searchable, filterable history"],
    screen: (
      <Screen title={copy.replace.title}>
        <div>
          <L>{copy.replace.reason}</L>
          <div className="flex flex-wrap gap-1.5">
            {["Oil turned dark", "Unusual smoke", "Planned schedule"].map((o, i) => (
              <span key={o} className={cx("rounded-full border px-3 py-1.5 text-[0.82rem]", i === 0 ? "border-green bg-mint text-forest" : "border-line-strong bg-white")}>
                {o}
              </span>
            ))}
          </div>
        </div>
        <span className="flex items-center justify-between rounded-[var(--radius-s)] border border-line bg-white px-3 py-2 text-[0.82rem]">
          <span>Batch 06 · Oct 12 to Oct 16</span>
          <span className="font-mono">17 h</span>
        </span>
      </Screen>
    ),
  },
];

export function Walkthrough() {
  const [i, setI] = useState(1);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + STEPS.length) % STEPS.length;
    setI(n);
    refs.current[n]?.focus();
  };
  const s = STEPS[i];
  return (
    <div>
      <div role="tablist" tabIndex={-1} aria-label="Workspace walkthrough" className="flex gap-1 overflow-x-auto border-b border-line" onKeyDown={onKey}>
        {STEPS.map((st, k) => (
          <button
            key={st.id}
            ref={(el) => {
              refs.current[k] = el;
            }}
            role="tab"
            id={`wt-tab-${st.id}`}
            aria-selected={k === i}
            aria-controls={`wt-panel-${st.id}`}
            tabIndex={k === i ? 0 : -1}
            onClick={() => setI(k)}
            className={cx("relative min-h-12 shrink-0 px-4 text-[0.92rem] font-semibold", k === i ? "text-forest after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-green" : "text-gray hover:text-ink")}
          >
            <span className="mr-1.5 font-mono text-[0.72rem] text-teal">0{k + 1}</span>
            {st.tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`wt-panel-${s.id}`} aria-labelledby={`wt-tab-${s.id}`} className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <h3 className="text-[1.6rem] font-extrabold text-ink">{s.title}</h3>
          <p className="mt-3 max-w-md text-[1.02rem] text-gray">{s.body}</p>
          <ul className="mt-5 space-y-2">
            {s.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-ink">
                <Check className="mt-1 size-4 shrink-0 text-green" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-md">{s.screen}</div>
      </div>
    </div>
  );
}
