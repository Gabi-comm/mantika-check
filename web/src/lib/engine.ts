import { foodLoad, heatToC, lowerHeat } from "./inputs";
import { TPC_LIMIT, computeState, hoursUntil } from "./model";
import { inferUrgency, urgencyToAction } from "./rules";
import { applySafety } from "./safety";
import type { TipId } from "./tips";
import type { Action, Check, OilBatch, OilStatus, Session, TopUp } from "./types";

const BASE_TIPS: Record<Action, TipId[]> = {
  keep: ["filter_daily", "cover_overnight"],
  monitor: ["filter_daily", "lower_heat", "top_up"],
  change_soon: ["lower_heat", "filter_daily", "top_up"],
  change_now: ["change_oil", "dont_top_up"],
};

const FORCED_MIN_URGENCY = 90;
const MAX_REASONS = 3;

function lastSessionOf(batchId: string, sessions: Session[]): Session | undefined {
  return sessions
    .filter((s) => s.batchId === batchId)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .at(-1);
}

function buildTips(action: Action, safetyTips: string[], noTopUp: boolean): string[] {
  const tips = new Set<string>([...BASE_TIPS[action], ...safetyTips]);
  if (noTopUp) {
    tips.delete("top_up");
    tips.add("dont_top_up");
  }
  return [...tips];
}

export function getOilStatus(batch: OilBatch, sessions: Session[], topUps: TopUp[], latestCheck?: Check): OilStatus {
  const state = computeState(batch, sessions, topUps);
  const tpc = { est: state.est, low: state.low, high: state.high };
  const signs = [...new Set(latestCheck?.signs ?? [])];
  const safety = applySafety(signs, tpc.high);

  const last = lastSessionOf(batch.id, sessions);
  const { urgency: fuzzyUrgency, fired } = inferUrgency({
    tpc: tpc.high,
    signs: signs.length,
    food: foodLoad(last?.foods ?? []),
  });

  const action = safety.forceAction ?? urgencyToAction(fuzzyUrgency);
  const urgency = safety.forceAction ? Math.max(fuzzyUrgency, FORCED_MIN_URGENCY) : fuzzyUrgency;

  const heat = last?.heat ?? "medium";
  const hoursLeftNow = hoursUntil(TPC_LIMIT, tpc.high, state.lastTempC);
  const hoursLeftLowerHeat =
    heat === "low" ? hoursLeftNow : hoursUntil(TPC_LIMIT, tpc.high, heatToC(lowerHeat(heat)));

  const reasons = [...new Set([...(safety.hardRule ? [safety.hardRule] : []), ...fired.map((f) => f.label)])].slice(
    0,
    MAX_REASONS,
  );

  return {
    action,
    urgency,
    tpc,
    hoursUsed: state.hoursUsed,
    hoursLeftNow,
    hoursLeftLowerHeat,
    reasons,
    ...(safety.hardRule ? { hardRule: safety.hardRule } : {}),
    noTopUp: safety.noTopUp,
    tips: buildTips(action, safety.tips, safety.noTopUp),
  };
}
