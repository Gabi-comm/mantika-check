import type { Heat, OilType, Session } from "./types";

// [S8][S9]
const HEAT_C: Record<Heat, number> = { low: 160, medium: 175, high: 190 };
// [D] Model C training range [S1]
const TEMP_MIN_C = 160;
const TEMP_MAX_C = 220;

const LOWER: Record<Heat, Heat> = { high: "medium", medium: "low", low: "low" };

export function heatToC(heat: Heat, tempC?: number): number {
  if (tempC === undefined) return HEAT_C[heat];
  return Math.min(TEMP_MAX_C, Math.max(TEMP_MIN_C, tempC));
}

export function lowerHeat(heat: Heat): Heat {
  return LOWER[heat];
}

// [S14][S15]
export function breadedShare(sessions: Session[]): number {
  const total = sessions.reduce((sum, s) => sum + s.hours, 0);
  if (total <= 0) return 0;
  const breaded = sessions.filter((s) => s.foods.includes("battered_breaded")).reduce((sum, s) => sum + s.hours, 0);
  return breaded / total;
}

interface FattyAcids {
  oleic: number;
  linoleic: number;
  linolenic: number;
}

// [S11] Codex STAN 210-1999 midpoints
const FATTY_ACID_MIDPOINTS: Record<Exclude<OilType, "generic">, FattyAcids> = {
  coconut: { oleic: 7.5, linoleic: 1.75, linolenic: 0.1 },
  palm_olein: { oleic: 42.9, linoleic: 11.75, linolenic: 0.3 },
  corn: { oleic: 31.1, linoleic: 49.8, linolenic: 1.0 },
  sunflower: { oleic: 26.7, linoleic: 61.15, linolenic: 0.15 },
  soybean: { oleic: 23.5, linoleic: 53.5, linolenic: 7.75 },
};

// [S10]
function cox({ oleic, linoleic, linolenic }: FattyAcids): number {
  return (oleic + 10.3 * linoleic + 21.6 * linolenic) / 100;
}

// Fuzzy layer only; never fed to the kinetic TPC model, which was trained on one oil [S1]
export function oilCox(oilType: OilType): number {
  // [S10][S11] generic = least stable common oil (precautionary)
  const acids = FATTY_ACID_MIDPOINTS[oilType === "generic" ? "soybean" : oilType];
  return cox(acids);
}
