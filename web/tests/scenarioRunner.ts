// runs the scenario table through the engine
import { getOilStatus } from "@/lib/engine";
import { DEFAULT_FUZZY_PARAMS, type FuzzyParams } from "@/lib/rules";
import type { Food, Heat, OilBatch, OilStatus, OilType, Session, Sign, TopUp } from "@/lib/types";
import scenarios from "./scenarios.json";

export interface Scenario {
  name: string;
  category: string;
  oilType: string;
  litres: number;
  sessions: { date: string; hours: number; heat: string; tempC?: number; foods: string[] }[];
  topUps: { date: string; litres: number }[];
  check?: string[];
  expected: string[];
  basis: string;
}

export const SCENARIOS = scenarios as Scenario[];

export function runScenario(s: Scenario, params: FuzzyParams = DEFAULT_FUZZY_PARAMS): OilStatus {
  const batch: OilBatch = { id: "s", startDate: "2026-10-01", litres: s.litres };
  const sessions: Session[] = s.sessions.map((x) => ({ ...x, batchId: "s", heat: x.heat as Heat, foods: x.foods as Food[] }));
  const topUps: TopUp[] = s.topUps.map((x) => ({ ...x, batchId: "s" }));
  const check = s.check ? { batchId: "s", date: "2026-10-31", signs: s.check as Sign[] } : undefined;
  const profile = { oilType: s.oilType as OilType, panLitres: s.litres, heatSource: "lpg" };
  return getOilStatus(profile, batch, sessions, topUps, check, params);
}
