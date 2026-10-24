// symbolic part: hard safety rules that override everything else
import { TPC_LIMIT } from "./model";
import type { Action, Sign } from "./types";

// [S7]
export const HARD_RULE_SIGNS = "FSSAI: smoke, thick foam, dark and murky, or thickened oil — change it now.";
// [S3][S6][S7]
export const HARD_RULE_TPC = "Estimated TPC is above 25% — the limit in Thailand, India and the test-strip bands.";
// [S7]
export const ADVISORY_REUSE = "FSSAI: avoid reusing oil more than 3 times.";
// [S7]
const MAX_FRYING_DAYS = 3;

export interface SafetyResult {
  forceAction?: Action;
  hardRule?: string;
  noTopUp: boolean;
  advisories: string[];
  tips: string[];
}

export function applySafety(signs: Sign[], tpc: { est: number; high: number }, fryingDays: number): SafetyResult {
  // [S7] H3; [S7][D] H1 signs also block top-up
  const noTopUp = tpc.high >= TPC_LIMIT || signs.length > 0;
  const result: SafetyResult = { noTopUp, advisories: [], tips: noTopUp ? ["dont_top_up"] : [] };

  // [S7] H1 first, then [S3][S6][S7] H2
  const hardRule = signs.length > 0 ? HARD_RULE_SIGNS : tpc.est >= TPC_LIMIT ? HARD_RULE_TPC : undefined;
  if (hardRule) {
    result.forceAction = "change_now";
    result.hardRule = hardRule;
  }

  // [S7] H4: advisory only, never forces
  if (fryingDays > MAX_FRYING_DAYS) result.advisories.push(ADVISORY_REUSE);
  return result;
}
