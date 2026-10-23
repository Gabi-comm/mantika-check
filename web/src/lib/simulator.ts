import { heatToC } from "./inputs";
import { MODEL, TPC_LIMIT, hoursUntil, isBeyondData } from "./model";
import type { Heat } from "./types";

const HEATS: Heat[] = ["low", "medium", "high"];
// [X] assumes the stall fries every day at its average logged hours per frying day
const DAYS_PER_WEEK = 7;

export interface SimulationInput {
  tpcHigh: number;
  hoursUsed: number;
  fryingDays: number;
  litres: number;
  currentHeat: Heat;
  pricePerL?: number;
}

export interface HeatOption {
  heat: Heat;
  tempC: number;
  hoursLeft: number;
  batchLifeHours: number;
  beyondData: boolean;
  changesPerWeek: number;
  pesoSavedPerWeek?: number;
}

export interface Simulation {
  weeklyHours: number;
  options: HeatOption[];
}

// [D] conservative: fresh oil starts at the high estimate c0 + half-width
function batchLife(tempC: number): number {
  return hoursUntil(TPC_LIMIT, MODEL.c0 + MODEL.halfWidth, tempC);
}

export function heatSimulation(input: SimulationInput): Simulation {
  const weeklyHours = input.fryingDays > 0 ? (input.hoursUsed / input.fryingDays) * DAYS_PER_WEEK : 0;
  const changesAt = (tempC: number) => weeklyHours / batchLife(tempC);
  const currentChanges = changesAt(heatToC(input.currentHeat));

  const options = HEATS.map((heat): HeatOption => {
    const tempC = heatToC(heat);
    const hoursLeft = hoursUntil(TPC_LIMIT, input.tpcHigh, tempC);
    const life = batchLife(tempC);
    const changesPerWeek = changesAt(tempC);
    return {
      heat,
      tempC,
      hoursLeft,
      batchLifeHours: life,
      beyondData: isBeyondData(input.hoursUsed + hoursLeft) || isBeyondData(life),
      changesPerWeek,
      // [S17] each change replaces the full pan volume
      ...(input.pricePerL !== undefined
        ? { pesoSavedPerWeek: input.litres * input.pricePerL * (currentChanges - changesPerWeek) }
        : {}),
    };
  });

  return { weeklyHours, options };
}
