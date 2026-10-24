// fake demo batches for each status
import type { Batch, BatchEvent, DemoScenario, FoodId, Heat, Sign, VendorState } from "./types";

const END = "2026-10-22";
const DAY = 86_400_000;
const dayStr = (offset: number) => new Date(Date.parse(`${END}T00:00:00Z`) - offset * DAY).toISOString().slice(0, 10);
const at = (offset: number, time: string) => `${dayStr(offset)}T${time}:00+08:00`;

type Draft = BatchEvent extends infer E ? (E extends BatchEvent ? Omit<E, "id" | "origin"> : never) : never;
type S = [hours: number, heat: Heat, foods: FoodId[], tempC?: number];
type Spec = {
  label: string;
  days: { off: number; s?: S; topup?: number; check?: { signs: Sign[]; filtered: boolean; covered: boolean } }[];
};

function build(id: string, spec: Spec, oil: Batch["oilType"], volumeL: number, pricePerL: number, closeAt?: { off: number; reason: Batch["endReason"] }): Batch {
  let n = 0;
  const ev = (e: Draft): BatchEvent => ({ ...e, id: `${id}-${String(++n).padStart(2, "0")}`, origin: "demo" }) as BatchEvent;
  const events: BatchEvent[] = [];
  for (const d of spec.days) {
    if (d.topup) events.push(ev({ kind: "topup", at: at(d.off, "14:20"), litres: d.topup }));
    if (d.s) events.push(ev({ kind: "session", at: at(d.off, "15:00"), hours: d.s[0], heat: d.s[1], foods: d.s[2], ...(d.s[3] ? { tempC: d.s[3] } : {}) } as Draft));
    if (d.check) events.push(ev({ kind: "check", at: at(d.off, "19:30"), ...d.check }));
  }
  const first = spec.days[0].off;
  const batch: Batch = { id, label: spec.label, origin: "demo", startedAt: at(first, "07:30"), oilType: oil, heatSource: "lpg", volumeL, pricePerL, events };
  if (closeAt) {
    batch.endedAt = at(closeAt.off, "19:50");
    batch.endReason = closeAt.reason;
    events.push(ev({ kind: "replaced", at: batch.endedAt, reason: closeAt.reason!, newLitres: volumeL }));
  }
  return batch;
}

const F = { b: "banana_cue", f: "fishball", l: "lumpia", c: "chicken_pork", x: "battered_breaded" } as const;

const ACTIVE: Record<DemoScenario, Spec> = {
  keep: {
    label: "Batch 08",
    days: [
      { off: 1, s: [3, "medium", [F.f, F.b]] },
      { off: 0, s: [2, "low", [F.b]], check: { signs: [], filtered: true, covered: true } },
    ],
  },
  monitor: {
    label: "Batch 08",
    days: [
      { off: 5, s: [3, "medium", [F.f, F.b]] },
      { off: 4, s: [3, "high", [F.f, F.l]] },
      { off: 3, s: [2, "medium", [F.b, F.l]], topup: 0.5 },
      { off: 2, s: [2, "low", [F.b]], check: { signs: [], filtered: true, covered: true } },
      { off: 1, s: [3, "medium", [F.c, F.x], 176], topup: 0.5 },
      { off: 0, s: [2, "medium", [F.f, F.x]], check: { signs: [], filtered: false, covered: true } },
    ],
  },
  change_soon: {
    label: "Batch 08",
    days: [
      { off: 6, s: [2, "high", [F.f, F.x]] },
      { off: 5, s: [2, "high", [F.f, F.l]] },
      { off: 4, s: [3, "medium", [F.b, F.l]], topup: 0.5 },
      { off: 3, s: [3, "high", [F.c, F.x], 191], check: { signs: [], filtered: true, covered: true } },
      { off: 2, s: [3, "high", [F.f, F.x]] },
      { off: 1, s: [2, "medium", [F.b]], topup: 0.5 },
      { off: 0, s: [3, "high", [F.c, F.x]], check: { signs: [], filtered: false, covered: true } },
    ],
  },
  change_now: {
    label: "Batch 08",
    days: [
      { off: 8, s: [3, "high", [F.f, F.x]] },
      { off: 7, s: [3, "high", [F.f, F.l]] },
      { off: 6, s: [3, "medium", [F.b, F.l]], topup: 0.5 },
      { off: 5, s: [3, "high", [F.c, F.x]] },
      { off: 4, s: [3, "high", [F.f, F.x]], check: { signs: [], filtered: true, covered: true } },
      { off: 3, s: [3, "high", [F.c, F.x]], topup: 0.5 },
      { off: 2, s: [3, "medium", [F.b, F.f]] },
      { off: 1, s: [2, "high", [F.f, F.x]], topup: 0.5 },
      { off: 0, s: [2, "high", [F.c, F.x]], check: { signs: [], filtered: false, covered: false } },
    ],
  },
  warning: {
    label: "Batch 08",
    days: [
      { off: 3, s: [3, "medium", [F.f, F.b]] },
      { off: 2, s: [3, "high", [F.c, F.x], 192] },
      { off: 1, s: [3, "medium", [F.f, F.l]], check: { signs: [], filtered: true, covered: true } },
      { off: 0, s: [3, "high", [F.f, F.x]], check: { signs: ["smoke", "dark_murky"], filtered: false, covered: true } },
    ],
  },
};

function closedBefore(activeStartOff: number): Batch {
  const o = activeStartOff + 1;
  return build(
    "demo-batch-07",
    {
      label: "Batch 07",
      days: [
        { off: o + 4, s: [3, "medium", [F.f, F.b]] },
        { off: o + 3, s: [4, "high", [F.f, F.l]] },
        { off: o + 2, s: [3, "medium", [F.b, F.l]], topup: 0.5, check: { signs: [], filtered: true, covered: true } },
        { off: o + 1, s: [4, "high", [F.c, F.x], 188] },
        { off: o, s: [3, "medium", [F.f, F.x]], check: { signs: ["dark_murky", "thick"], filtered: false, covered: true } },
      ],
    },
    "palm_olein",
    3,
    95,
    { off: o, reason: "dark_murky" }
  );
}

export function demoState(scenario: DemoScenario = "monitor"): VendorState {
  const spec = ACTIVE[scenario];
  const active = build("demo-batch-08", spec, "palm_olein", 3, 98);
  const closed = closedBefore(spec.days[0].off);
  return {
    version: 2,
    profile: { stallName: "Corner Fishball Stand", origin: "demo" },
    setup: { oilType: "palm_olein", volumeL: 3, heatSource: "lpg", pricePerL: 98 },
    batches: [active, closed],
    activeBatchId: active.id,
    demoScenario: scenario,
  };
}

export const emptyState: VendorState = {
  version: 2,
  profile: null,
  setup: null,
  batches: [],
  activeBatchId: null,
  demoScenario: null,
};
