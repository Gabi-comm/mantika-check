// sample statuses for tests and demos
import { getOilStatus } from "./engine";
import { templateAdvice } from "./templates";
import type { Advice, Check, Food, Heat, OilBatch, OilStatus, VendorProfile } from "./types";

export interface MockCase {
  status: OilStatus;
  advice: Advice;
}

const profile: VendorProfile = { oilType: "palm_olein", panLitres: 4, heatSource: "lpg", oilPricePerLitre: 90 };
const batch: OilBatch = { id: "mock", startDate: "2026-10-01", litres: 4 };

function mock(hours: number, heat: Heat, foods: Food[], check?: Check["signs"]): MockCase {
  const sessions = [{ batchId: batch.id, date: "2026-10-01", hours, heat, foods }];
  const latestCheck = check ? { batchId: batch.id, date: "2026-10-01", signs: check } : undefined;
  const status = getOilStatus(profile, batch, sessions, [], latestCheck);
  return { status, advice: templateAdvice(status) };
}

export const mockKeep = mock(2, "medium", ["fishball"]);
export const mockMonitor = mock(14, "medium", ["lumpia"]);
export const mockChangeSoon = mock(13, "high", ["fishball"]);
export const mockChangeNow = mock(16, "high", ["chicken_pork"]);
export const mockHardRuleSmoke = mock(3, "medium", ["banana_cue"], ["smoke"]);

export const MOCKS = {
  keep: mockKeep,
  monitor: mockMonitor,
  change_soon: mockChangeSoon,
  change_now: mockChangeNow,
  hard_rule_smoke: mockHardRuleSmoke,
} as const;
