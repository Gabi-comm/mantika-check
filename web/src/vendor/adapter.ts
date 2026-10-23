import type { Action, Advice, AdviceResult, Batch, Heat, StatusResult, StatusSource } from "./types";
import { copy } from "./copy";
import { batchTotals, fryingDays, latestCheck } from "./selectors";

/**
 * Integration boundary for Gabriel's engine.
 *
 * Every screen gets status and advice through `useOilStatus()`, which calls ACTIVE_ADAPTER.
 * To connect the engine: implement `StatusAdapter` returning the contract shapes in types.ts,
 * then point ACTIVE_ADAPTER at it. No engine endpoint is assumed; none has been published.
 */
export interface StatusAdapter {
  id: StatusSource;
  computeStatus(batch: Batch): StatusResult;
  getAdvice(result: StatusResult, ctx: { online: boolean }): Promise<AdviceResult>;
}

// ---------------- demo heuristic: placeholder weights, published in full on /methodology ----------------
export const HEAT_WEIGHT: Record<Heat, number> = { low: 0.8, medium: 1, high: 1.3 };
/** Demo thresholds on the unitless index. */
export const THRESHOLDS = { monitor: 16, change_soon: 30, change_now: 40 } as const;
/** Upper end of logged hours covered by the reference frying data the engine is being built on. */
export const DATA_RANGE_HOURS = 30;

const ADVICE: Record<Action | "warning", Advice> = {
  keep: {
    headline: "Keep logging every session",
    messageTaglish: "Nothing in the current records calls for action. A steady log makes later recommendations more reliable.",
    tips: [
      { id: "cover", text: "Cover the pan when the stall closes." },
      { id: "filter", text: "Strain out food particles at the end of the day." },
    ],
    source: "template",
  },
  monitor: {
    headline: "Filter tonight and check again tomorrow",
    messageTaglish: "Usage is building up on this batch. Filtering removes food particles that can darken oil.",
    tips: [
      { id: "filter", text: "Strain the oil after today's last session." },
      { id: "heat", text: "Use medium heat where the food allows it." },
      { id: "check", text: "Run a quick check before tomorrow's first session." },
    ],
    source: "template",
  },
  change_soon: {
    headline: "Prepare fresh oil for the next batch",
    messageTaglish: "Records point toward replacement. Topping up old oil is not recommended at this stage.",
    tips: [
      { id: "notopup", text: "Do not add fresh oil to this batch." },
      { id: "prepare", text: "Have replacement oil ready for the next session." },
    ],
    source: "template",
  },
  change_now: {
    headline: "Replace the oil before frying again",
    messageTaglish: "Let the old oil cool, store it in a sealed container and dispose of it properly. Never pour it down the drain.",
    tips: [
      { id: "cool", text: "Cool the oil completely before handling it." },
      { id: "record", text: "Use Replace Oil to start a new batch afterwards." },
    ],
    source: "template",
  },
  warning: {
    headline: "Stop using this oil",
    messageTaglish: "You reported a warning sign. Do not top up or continue frying with this batch; replace it before the next session.",
    tips: [
      { id: "stop", text: "Turn off the heat if the oil is smoking at normal temperature." },
      { id: "replace", text: "Use Replace Oil once fresh oil is in the pan." },
    ],
    source: "template",
  },
};

function heuristicStatus(batch: Batch): StatusResult {
  const totals = batchTotals(batch);
  const days = fryingDays(batch);
  const check = latestCheck(batch);
  const short = (iso: string) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });

  // Conservative prototype rule from the plan: ANY reported warning sign in the latest check fires the hard rule.
  if (check && check.signs.length) {
    const names = check.signs.map((s) => copy.signs[s].title.toLowerCase());
    return {
      source: "demo-heuristic",
      validation: "illustrative",
      status: {
        action: "change_now",
        urgency: 100,
        tpc: null,
        hoursUsed: totals.hours,
        hoursLeftNow: null,
        hoursLeftLowerHeat: null,
        fryingDays: days,
        beyondData: false,
        reasons: [`Warning sign${check.signs.length > 1 ? "s" : ""} reported ${short(check.at)}: ${names.join(", ")}`, `${totals.hours} h logged over ${days} frying day${days === 1 ? "" : "s"}`],
        hardRule: copy.warning.body(names.join(", ")),
        noTopUp: true,
        tips: ADVICE.warning.tips.map((t) => t.id),
      },
    };
  }

  let index = 0;
  for (const h of ["low", "medium", "high"] as Heat[]) index += totals.hoursByHeat[h] * HEAT_WEIGHT[h];
  const action: Action = index >= THRESHOLDS.change_now ? "change_now" : index >= THRESHOLDS.change_soon ? "change_soon" : index >= THRESHOLDS.monitor ? "monitor" : "keep";

  const reasons: string[] = [];
  if (totals.hours) reasons.push(`${totals.hours} h of frying logged over ${days} day${days === 1 ? "" : "s"}`);
  if (totals.hoursByHeat.high) reasons.push(`${totals.hoursByHeat.high} h at high heat`);
  if (totals.hours > DATA_RANGE_HOURS) reasons.push(`Usage beyond the ${DATA_RANGE_HOURS} h covered by the reference data`);
  else if (check && !check.filtered && action !== "keep") reasons.push(`Oil not filtered at the last check (${short(check.at)})`);
  else if (check) reasons.push(`No warning signs at the last check (${short(check.at)})`);

  return {
    source: "demo-heuristic",
    validation: "illustrative",
    status: {
      action,
      urgency: Math.min(99, Math.round((index / THRESHOLDS.change_now) * 90)),
      tpc: null,
      hoursUsed: totals.hours,
      // The demo heuristic is not a degradation model, so it never produces a remaining-hours forecast.
      hoursLeftNow: null,
      hoursLeftLowerHeat: null,
      fryingDays: days,
      // beyondData describes a forecast beyond the model data; with no forecast it stays false.
      beyondData: false,
      reasons: reasons.slice(0, 3),
      noTopUp: action === "change_soon" || action === "change_now",
      tips: ADVICE[action].tips.map((t) => t.id),
    },
  };
}

export const demoAdapter: StatusAdapter = {
  id: "demo-heuristic",
  computeStatus: heuristicStatus,
  async getAdvice(result, { online }) {
    // No language-model provider is connected; guidance is always the deterministic template.
    const key = result.status.hardRule ? "warning" : result.status.action;
    const advice = ADVICE[key] ?? null;
    if (!advice) return { advice: null, delivery: "missing" };
    return { advice, delivery: online ? "template" : "offline-template" };
  },
};

export const ACTIVE_ADAPTER: StatusAdapter = demoAdapter;

/** Synchronous fallback used while advice loads or if the adapter throws. */
export const templateAdvice = (r: StatusResult): Advice | null => ADVICE[r.status.hardRule ? "warning" : r.status.action] ?? null;
