import { describe, expect, it } from "vitest";
import { MODEL, advance, computeState, hoursUntil, isBeyondData, tpcAt, topUp } from "@/lib/model";
import type { OilBatch, Session, TopUp } from "@/lib/types";

const TEMPS = [160, 175, 190, 220];

describe("kinetic model", () => {
  it("loads the v3 parameters", () => {
    expect(MODEL.c0).toBeCloseTo(11.1685, 4);
    expect(MODEL.lnA).toBeCloseTo(-0.72319, 5);
    expect(MODEL.Ea).toBeCloseTo(43612.5, 0);
    expect(MODEL.n).toBeCloseTo(1.08224, 5);
    expect(MODEL.halfWidth).toBeCloseTo(2.9785, 4);
  });

  it.each(TEMPS)("tpcAt(0, %i) equals c0", (T) => {
    expect(tpcAt(0, T)).toBe(MODEL.c0);
  });

  it.each(TEMPS)("tpcAt(hoursUntil(25)) round-trips to 25 at %i °C", (T) => {
    expect(Math.abs(tpcAt(hoursUntil(25, MODEL.c0, T), T) - 25)).toBeLessThan(1e-6);
  });

  it.each(TEMPS)("two 3 h sessions equal one 6 h session at %i °C", (T) => {
    const twice = advance(advance(MODEL.c0, 3, T), 3, T);
    expect(Math.abs(twice - tpcAt(6, T))).toBeLessThan(1e-9);
  });

  it("a top-up always lowers TPC above c0", () => {
    for (const tpc of [12, 18, 25, 32]) {
      for (const [vOld, vAdd] of [[5, 0.5], [3, 1], [10, 2]]) {
        expect(topUp(tpc, vOld, vAdd)).toBeLessThan(tpc);
      }
    }
  });

  it("crosses 25% at 220 °C after 11.7 ± 0.2 h", () => {
    expect(Math.abs(hoursUntil(25, MODEL.c0, 220) - 11.7)).toBeLessThanOrEqual(0.2);
  });

  it("crosses 25% at 190 °C after 22.1 ± 0.3 h", () => {
    expect(Math.abs(hoursUntil(25, MODEL.c0, 190) - 22.1)).toBeLessThanOrEqual(0.3);
  });

  it("crosses 25% at 175 °C after 31.4 ± 0.5 h, beyond the 30 h of data", () => {
    const h = hoursUntil(25, MODEL.c0, 175);
    expect(Math.abs(h - 31.4)).toBeLessThanOrEqual(0.5);
    expect(isBeyondData(h)).toBe(true);
    expect(isBeyondData(hoursUntil(25, MODEL.c0, 190))).toBe(false);
  });

  it("higher temperature gives fewer hours until 25%", () => {
    for (let T = 160; T < 220; T += 5) {
      expect(hoursUntil(25, MODEL.c0, T + 5)).toBeLessThan(hoursUntil(25, MODEL.c0, T));
    }
  });
});

describe("computeState", () => {
  const batch: OilBatch = { id: "b1", startDate: "2026-10-01", litres: 4 };

  it("returns fresh oil at medium heat with no sessions", () => {
    const s = computeState(batch, [], []);
    expect(s.est).toBe(MODEL.c0);
    expect(s.hoursUsed).toBe(0);
    expect(s.fryingDays).toBe(0);
    expect(s.lastTempC).toBe(175);
    expect(s.lastHeat).toBe("medium");
    expect(s.high - s.est).toBeCloseTo(MODEL.halfWidth, 9);
    expect(s.est - s.low).toBeCloseTo(MODEL.halfWidth, 9);
  });

  it("applies events in date order regardless of input order", () => {
    const sessions: Session[] = [
      { batchId: "b1", date: "2026-10-03", hours: 4, heat: "low", foods: [] },
      { batchId: "b1", date: "2026-10-01", hours: 4, heat: "high", foods: [] },
    ];
    const topUps: TopUp[] = [{ batchId: "b1", date: "2026-10-02", litres: 1 }];
    let expected = advance(MODEL.c0, 4, 190);
    expected = topUp(expected, 4, 1);
    expected = advance(expected, 4, 160);
    const s = computeState(batch, sessions, topUps);
    expect(s.est).toBeCloseTo(expected, 12);
    expect(s.hoursUsed).toBe(8);
    expect(s.lastTempC).toBe(160);
    expect(s.lastHeat).toBe("low");
  });

  it("counts distinct session dates as frying days", () => {
    const sessions: Session[] = [
      { batchId: "b1", date: "2026-10-01T08:00", hours: 2, heat: "medium", foods: [] },
      { batchId: "b1", date: "2026-10-01T15:00", hours: 2, heat: "medium", foods: [] },
      { batchId: "b1", date: "2026-10-02T08:00", hours: 2, heat: "medium", foods: [] },
    ];
    expect(computeState(batch, sessions, []).fryingDays).toBe(2);
  });

  it("counts frying days by Asia/Manila calendar day", () => {
    const sessions: Session[] = [
      { batchId: "b1", date: "2026-10-01T10:00:00Z", hours: 2, heat: "medium", foods: [] },
      { batchId: "b1", date: "2026-10-01T23:30:00Z", hours: 2, heat: "medium", foods: [] },
      { batchId: "b1", date: "2026-10-02T07:00:00+08:00", hours: 2, heat: "medium", foods: [] },
    ];
    expect(computeState(batch, sessions, []).fryingDays).toBe(2);
  });

  it("ignores events from other batches", () => {
    const sessions: Session[] = [{ batchId: "other", date: "2026-10-01", hours: 10, heat: "high", foods: [] }];
    expect(computeState(batch, sessions, []).est).toBe(MODEL.c0);
  });
});
