// runs the engine in the browser and fetches the advice
import { getOilStatus } from "@/lib/engine";
import { DATA_MAX_HOURS } from "@/lib/model";
import { templateAdvice as engineTemplate } from "@/lib/templates";
import type { Check, OilBatch, OilStatus, Session, TopUp, VendorProfile } from "@/lib/types";
import type { Advice, AdviceResult, Batch, StatusResult, StatusSource } from "./types";
import { latestCheck } from "./selectors";

export interface StatusAdapter {
  id: StatusSource;
  computeStatus(batch: Batch): StatusResult;
  getAdvice(result: StatusResult, ctx: { online: boolean }): Promise<AdviceResult>;
}

export const DATA_RANGE_HOURS = DATA_MAX_HOURS;

const round1 = (x: number) => Math.round(x * 10) / 10;

export function engineInputs(batch: Batch) {
  const profile: VendorProfile = {
    oilType: batch.oilType,
    panLitres: batch.volumeL,
    heatSource: batch.heatSource,
    ...(batch.pricePerL !== undefined ? { oilPricePerLitre: batch.pricePerL } : {}),
  };
  const oilBatch: OilBatch = { id: batch.id, startDate: batch.startedAt, litres: batch.volumeL };
  const sessions: Session[] = [];
  const topUps: TopUp[] = [];
  for (const e of batch.events) {
    if (e.kind === "session") {
      sessions.push({ batchId: batch.id, date: e.at, hours: e.hours, heat: e.heat, foods: e.foods, ...(e.tempC !== undefined ? { tempC: e.tempC } : {}) });
    } else if (e.kind === "topup") {
      topUps.push({ batchId: batch.id, date: e.at, litres: e.litres });
    }
  }
  const last = latestCheck(batch);
  const check: Check | undefined = last
    ? { batchId: batch.id, date: last.at, signs: last.signs, filtered: last.filtered, covered: last.covered }
    : undefined;
  return { profile, oilBatch, sessions, topUps, check };
}

function forDisplay(s: OilStatus): OilStatus {
  return {
    ...s,
    urgency: Math.round(s.urgency),
    tpc: { est: round1(s.tpc.est), low: round1(s.tpc.low), high: round1(s.tpc.high) },
    hoursLeftNow: round1(s.hoursLeftNow),
    hoursLeftLowerHeat: round1(s.hoursLeftLowerHeat),
  };
}

function engineStatus(batch: Batch): StatusResult {
  const { profile, oilBatch, sessions, topUps, check } = engineInputs(batch);
  const status = getOilStatus(profile, oilBatch, sessions, topUps, check);
  return { source: "engine", validation: "model-estimate", status: forDisplay(status) };
}

export const templateAdvice = (r: StatusResult): Advice => engineTemplate(r.status);

export const engineAdapter: StatusAdapter = {
  id: "engine",
  computeStatus: engineStatus,
  async getAdvice(result, { online }) {
    if (!online) return { advice: templateAdvice(result), delivery: "offline-template" };
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.status),
      });
      if (!res.ok) return { advice: templateAdvice(result), delivery: "error-template" };
      const advice = (await res.json()) as Advice;
      return { advice, delivery: advice.source === "llm" ? "llm" : "template" };
    } catch {
      return { advice: templateAdvice(result), delivery: "error-template" };
    }
  },
};

export const ACTIVE_ADAPTER: StatusAdapter = engineAdapter;
