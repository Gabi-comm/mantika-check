import { TPC_LIMIT } from "./model";
import type { Action, Sign } from "./types";

export const HARD_RULE_FSSAI = "Hard rule (FSSAI): usok, bula o maitim na mantika — palitan na.";
const FORCE_SIGN_COUNT = 3;

export interface SafetyResult {
  forceAction?: Action;
  hardRule?: string;
  noTopUp: boolean;
  tips: string[];
}

export function applySafety(signs: Sign[], tpcHigh: number): SafetyResult {
  const result: SafetyResult = { noTopUp: tpcHigh >= TPC_LIMIT, tips: [] };
  if (signs.includes("smoke") || signs.length >= FORCE_SIGN_COUNT) {
    result.forceAction = "change_now";
    result.hardRule = HARD_RULE_FSSAI;
  }
  if (signs.length === 1 && signs[0] === "foam") result.tips.push("check_heat");
  return result;
}
