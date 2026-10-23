import { describe, expect, it } from "vitest";
import { breadedShare, heatToC, lowerHeat, oilCox } from "@/lib/inputs";
import type { Session } from "@/lib/types";

describe("heatToC", () => {
  it("maps heat levels", () => {
    expect(heatToC("low")).toBe(160);
    expect(heatToC("medium")).toBe(175);
    expect(heatToC("high")).toBe(190);
  });
  it("uses tempC clamped to 160–220", () => {
    expect(heatToC("low", 200)).toBe(200);
    expect(heatToC("high", 250)).toBe(220);
    expect(heatToC("medium", 120)).toBe(160);
  });
});

describe("lowerHeat", () => {
  it("steps down one level and floors at low", () => {
    expect(lowerHeat("high")).toBe("medium");
    expect(lowerHeat("medium")).toBe("low");
    expect(lowerHeat("low")).toBe("low");
  });
});

describe("breadedShare", () => {
  const s = (hours: number, breaded: boolean): Session => ({
    batchId: "b",
    date: "2026-10-01",
    hours,
    heat: "medium",
    foods: breaded ? ["battered_breaded", "fishball"] : ["fishball"],
  });
  it("is 0 with no sessions", () => expect(breadedShare([])).toBe(0));
  it("is the share of hours in sessions with battered_breaded", () => {
    expect(breadedShare([s(3, true), s(1, false)])).toBe(0.75);
    expect(breadedShare([s(2, false)])).toBe(0);
    expect(breadedShare([s(2, true)])).toBe(1);
  });
});

describe("oilCox", () => {
  it.each([
    ["coconut", 0.28],
    ["palm_olein", 1.7],
    ["corn", 5.66],
    ["sunflower", 6.6],
    ["soybean", 7.42],
    ["generic", 7.42],
  ] as const)("%s → %f", (oil, expected) => {
    expect(Math.abs(oilCox(oil) - expected)).toBeLessThanOrEqual(0.01);
  });
});
