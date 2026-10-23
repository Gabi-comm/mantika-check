import modelExport from "../data/model_export.json";
import { heatToC } from "./inputs";
import type { Heat, OilBatch, Session, TopUp } from "./types";

const kinetic = modelExport.models.C_kinetic;

// [D] Model C fitted on [S1]
export const MODEL = {
  c0: kinetic.params.c0,
  lnA: kinetic.params.lnA,
  Ea: kinetic.params.Ea_J_per_mol,
  n: kinetic.params.n,
  R: kinetic.R,
  Tref: kinetic.T_ref_K,
  halfWidth: modelExport.interval_halfwidth_90.C_kinetic,
} as const;

// [S3][S6][S7]
export const TPC_LIMIT = modelExport.threshold_tpc_pct;
// [D] [S1] data covers 0–30 h
export const DATA_MAX_HOURS = modelExport.valid_domain.hour[1];
// [S8]
export const DEFAULT_HEAT: Heat = "medium";

export function k(tempC: number): number {
  const { lnA, Ea, R, Tref } = MODEL;
  return Math.exp(lnA - (Ea / R) * (1 / (tempC + 273.15) - 1 / Tref));
}

export function tpcAt(hours: number, tempC: number): number {
  return MODEL.c0 + k(tempC) * Math.pow(hours, MODEL.n);
}

export function eqHours(tpc: number, tempC: number): number {
  if (tpc <= MODEL.c0) return 0;
  return Math.pow((tpc - MODEL.c0) / k(tempC), 1 / MODEL.n);
}

export function advance(tpc: number, hours: number, tempC: number): number {
  return tpcAt(eqHours(tpc, tempC) + hours, tempC);
}

// [S17]
export function topUp(tpc: number, vOld: number, vAdd: number, tpcFresh: number = MODEL.c0): number {
  return (tpc * vOld + tpcFresh * vAdd) / (vOld + vAdd);
}

export function hoursUntil(threshold: number, tpc: number, tempC: number): number {
  return Math.max(0, eqHours(threshold, tempC) - eqHours(tpc, tempC));
}

export function isBeyondData(totalHours: number): boolean {
  return totalHours > DATA_MAX_HOURS;
}

export interface OilState {
  est: number;
  low: number;
  high: number;
  hoursUsed: number;
  fryingDays: number;
  lastTempC: number;
  lastHeat: Heat;
}

type OilEvent = { kind: "session"; date: string; session: Session } | { kind: "topUp"; date: string; topUp: TopUp };

function eventsInOrder(batchId: string, sessions: Session[], topUps: TopUp[]): OilEvent[] {
  const events: OilEvent[] = [
    ...sessions.filter((s) => s.batchId === batchId).map((s): OilEvent => ({ kind: "session", date: s.date, session: s })),
    ...topUps.filter((t) => t.batchId === batchId).map((t): OilEvent => ({ kind: "topUp", date: t.date, topUp: t })),
  ];
  return events.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export function computeState(batch: OilBatch, sessions: Session[], topUps: TopUp[]): OilState {
  let tpc: number = MODEL.c0;
  let volume = batch.litres;
  let hoursUsed = 0;
  let lastHeat: Heat = DEFAULT_HEAT;
  let lastTempC = heatToC(DEFAULT_HEAT);
  const days = new Set<string>();

  for (const event of eventsInOrder(batch.id, sessions, topUps)) {
    if (event.kind === "session") {
      const tempC = heatToC(event.session.heat, event.session.tempC);
      tpc = advance(tpc, event.session.hours, tempC);
      hoursUsed += event.session.hours;
      lastTempC = tempC;
      lastHeat = event.session.heat;
      days.add(event.session.date.slice(0, 10));
    } else {
      tpc = topUp(tpc, volume, event.topUp.litres);
      volume += event.topUp.litres;
    }
  }

  return {
    est: tpc,
    low: tpc - MODEL.halfWidth,
    high: tpc + MODEL.halfWidth,
    hoursUsed,
    fryingDays: days.size,
    lastTempC,
    lastHeat,
  };
}
