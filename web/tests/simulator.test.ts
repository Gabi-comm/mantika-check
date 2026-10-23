import { describe, expect, it } from "vitest";
import { heatSimulation } from "@/lib/simulator";

const base = { tpcHigh: 18, hoursUsed: 12, fryingDays: 3, litres: 4, pricePerL: 90 };

describe("heatSimulation", () => {
  it("gives more hours left and a longer batch life at lower heat", () => {
    const [low, medium, high] = heatSimulation({ ...base, currentHeat: "high" }).options;
    expect(low.hoursLeft).toBeGreaterThan(medium.hoursLeft);
    expect(medium.hoursLeft).toBeGreaterThan(high.hoursLeft);
    expect(low.batchLifeHours).toBeGreaterThan(high.batchLifeHours);
    expect([low.tempC, medium.tempC, high.tempC]).toEqual([160, 175, 190]);
  });

  it("saves pesos when frying at a lower heat than now, and none at the current heat", () => {
    const sim = heatSimulation({ ...base, currentHeat: "high" });
    const [low, medium, high] = sim.options;
    expect(sim.weeklyHours).toBe(28);
    expect(high.pesoSavedPerWeek).toBe(0);
    expect(medium.pesoSavedPerWeek).toBeGreaterThan(0);
    expect(low.pesoSavedPerWeek!).toBeGreaterThan(medium.pesoSavedPerWeek!);
  });

  it("matches litres × price × (changes now − changes at the chosen heat)", () => {
    const [, medium, high] = heatSimulation({ ...base, currentHeat: "high" }).options;
    expect(medium.pesoSavedPerWeek).toBeCloseTo(4 * 90 * (high.changesPerWeek - medium.changesPerWeek), 9);
  });

  it("omits peso values without a price", () => {
    const { options } = heatSimulation({ ...base, pricePerL: undefined, currentHeat: "medium" });
    expect(options.every((o) => o.pesoSavedPerWeek === undefined)).toBe(true);
  });

  it("flags heat options whose batch life passes the 30 h of model data", () => {
    const [low, , high] = heatSimulation({ ...base, currentHeat: "medium" }).options;
    expect(low.beyondData).toBe(true);
    expect(high.beyondData).toBe(false);
  });

  it("has no weekly hours before any frying day", () => {
    const sim = heatSimulation({ ...base, hoursUsed: 0, fryingDays: 0, currentHeat: "low" });
    expect(sim.weeklyHours).toBe(0);
    expect(sim.options.every((o) => o.changesPerWeek === 0)).toBe(true);
  });
});
