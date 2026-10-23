import type { Batch, CheckEvent, FoodId, Heat, SessionEvent, VendorState } from "./types";

export const activeBatchOf = (s: VendorState): Batch | null => s.batches.find((b) => b.id === s.activeBatchId) ?? null;

export function batchTotals(b: Batch | null) {
  const hoursByHeat: Record<Heat, number> = { low: 0, medium: 0, high: 0 };
  const sessionsByHeat: Record<Heat, number> = { low: 0, medium: 0, high: 0 };
  const foodCounts: Record<FoodId, number> = { banana_cue: 0, fishball: 0, lumpia: 0, chicken_pork: 0, battered_breaded: 0 };
  let hours = 0,
    sessions = 0,
    topups = 0,
    topupLitres = 0,
    checks = 0;
  let lastAt: string | null = null;
  for (const e of b?.events ?? []) {
    if (!lastAt || e.at > lastAt) lastAt = e.at;
    if (e.kind === "session") {
      hours += e.hours;
      sessions++;
      hoursByHeat[e.heat] += e.hours;
      sessionsByHeat[e.heat]++;
      for (const f of e.foods) foodCounts[f]++;
    } else if (e.kind === "topup") {
      topups++;
      topupLitres += e.litres;
    } else if (e.kind === "check") checks++;
  }
  return { hours, sessions, topups, topupLitres, checks, hoursByHeat, sessionsByHeat, foodCounts, lastAt };
}
export type Totals = ReturnType<typeof batchTotals>;

export function latestCheck(b: Batch | null): CheckEvent | null {
  let best: CheckEvent | null = null;
  for (const e of b?.events ?? []) if (e.kind === "check" && (!best || e.at >= best.at)) best = e;
  return best;
}

/** Hours per calendar day (Asia/Manila), split by heat. Source for the usage chart. */
export function hoursByDay(b: Batch | null) {
  const map = new Map<string, Record<Heat, number>>();
  for (const e of b?.events ?? []) {
    if (e.kind !== "session") continue;
    const day = dayKey(e.at);
    const row = map.get(day) ?? { low: 0, medium: 0, high: 0 };
    row[e.heat] += e.hours;
    map.set(day, row);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, v]) => ({ day, ...v, total: v.low + v.medium + v.high }));
}

export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

export function sortedEvents(b: Batch) {
  return [...b.events].sort((x, y) => (x.at < y.at ? 1 : -1));
}

export const sessionsOf = (b: Batch) => b.events.filter((e): e is SessionEvent => e.kind === "session");

/** Distinct calendar days (Asia/Manila) with at least one logged session. */
export function fryingDays(b: Batch | null) {
  return new Set((b?.events ?? []).filter((e) => e.kind === "session").map((e) => dayKey(e.at))).size;
}
