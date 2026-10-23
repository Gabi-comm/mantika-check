import { breadedShare, heatToC, lowerHeat, oilCox } from "./inputs";
import { TPC_LIMIT, computeState, hoursUntil, isBeyondData } from "./model";
import { DEFAULT_FUZZY_PARAMS, inferUrgency, urgencyToAction, type FuzzyParams } from "./rules";
import { applySafety } from "./safety";
import type { TipId } from "./tips";
import type { Action, Check, Heat, OilBatch, OilStatus, Session, TopUp, VendorProfile } from "./types";

// [X]
const FORCED_MIN_URGENCY = 90;
const MAX_REASONS = 3;

function buildTips(action: Action, lastHeat: Heat, noTopUp: boolean): TipId[] {
  const tips: TipId[] = [];
  // [S2][S7]
  if (action === "change_now") tips.push("change_oil");
  // [S7]
  if (noTopUp) tips.push("dont_top_up");
  // [S7]
  if (action !== "change_now") tips.push("filter_daily");
  // [S16]
  if (action !== "change_now") tips.push("cover_overnight");
  // [S16]
  if (action !== "change_now" && lastHeat !== "low") tips.push("lower_heat");
  // [S4][S17]
  if (action === "change_soon" && !noTopUp) tips.push("top_up");
  return tips;
}

export function getOilStatus(
  profile: VendorProfile,
  batch: OilBatch,
  sessions: Session[],
  topUps: TopUp[],
  latestCheck?: Check,
  params: FuzzyParams = DEFAULT_FUZZY_PARAMS,
): OilStatus {
  const state = computeState(batch, sessions, topUps);
  const tpc = { est: state.est, low: state.low, high: state.high };
  const signs = [...new Set(latestCheck?.signs ?? [])];
  const safety = applySafety(signs, tpc, state.fryingDays);

  const { urgency: fuzzyUrgency, fired } = inferUrgency(
    {
      tpc: tpc.high,
      breaded: breadedShare(sessions.filter((s) => s.batchId === batch.id)),
      cox: oilCox(profile.oilType),
    },
    params,
  );

  const action = safety.forceAction ?? urgencyToAction(fuzzyUrgency, params.cuts);
  const urgency = safety.forceAction ? Math.max(fuzzyUrgency, FORCED_MIN_URGENCY) : fuzzyUrgency;

  const hoursLeftNow = hoursUntil(TPC_LIMIT, tpc.high, state.lastTempC);
  const hoursLeftLowerHeat =
    state.lastHeat === "low" ? hoursLeftNow : hoursUntil(TPC_LIMIT, tpc.high, heatToC(lowerHeat(state.lastHeat)));
  const beyondData = isBeyondData(state.hoursUsed + hoursLeftNow) || isBeyondData(state.hoursUsed + hoursLeftLowerHeat);

  const reasons = [
    ...new Set([...(safety.hardRule ? [safety.hardRule] : []), ...safety.advisories, ...fired.map((f) => f.label)]),
  ].slice(0, MAX_REASONS);

  return {
    action,
    urgency,
    tpc,
    hoursUsed: state.hoursUsed,
    fryingDays: state.fryingDays,
    hoursLeftNow,
    hoursLeftLowerHeat,
    beyondData,
    reasons,
    ...(safety.hardRule ? { hardRule: safety.hardRule } : {}),
    noTopUp: safety.noTopUp,
    tips: buildTips(action, state.lastHeat, safety.noTopUp),
  };
}
