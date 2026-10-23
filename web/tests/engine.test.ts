import { describe, expect, it } from "vitest";
import { getOilStatus } from "@/lib/engine";
import { ADVISORY_REUSE, HARD_RULE_SIGNS } from "@/lib/safety";
import type { Check, OilBatch, OilType, Session, VendorProfile } from "@/lib/types";

const batch: OilBatch = { id: "b1", startDate: "2026-10-01", litres: 4 };
const profile = (oilType: OilType): VendorProfile => ({ oilType, panLitres: 4, heatSource: "lpg" });
const palm = profile("palm_olein");

function session(hours: number, heat: Session["heat"], foods: Session["foods"], date = "2026-10-01"): Session {
  return { batchId: "b1", date, hours, heat, foods };
}

describe("getOilStatus", () => {
  it("fresh oil + one 2 h medium session, palm olein → keep", () => {
    const s = getOilStatus(palm, batch, [session(2, "medium", ["fishball"])], []);
    expect(s.action).toBe("keep");
    expect(s.hoursUsed).toBe(2);
    expect(s.fryingDays).toBe(1);
    expect(s.hardRule).toBeUndefined();
    expect(s.hoursLeftLowerHeat).toBeGreaterThan(s.hoursLeftNow);
  });

  it("15 h at high with battered food → change_soon or change_now", () => {
    const s = getOilStatus(palm, batch, [session(15, "high", ["battered_breaded"])], []);
    expect(["change_soon", "change_now"]).toContain(s.action);
  });

  it("a smoke check → change_now with hardRule", () => {
    const check: Check = { batchId: "b1", date: "2026-10-01", signs: ["smoke"] };
    const s = getOilStatus(palm, batch, [session(1, "low", ["banana_cue"])], [], check);
    expect(s.action).toBe("change_now");
    expect(s.hardRule).toBe(HARD_RULE_SIGNS);
    expect(s.urgency).toBeGreaterThanOrEqual(90);
    expect(s.reasons[0]).toBe(HARD_RULE_SIGNS);
    expect(s.tips).toContain("change_oil");
  });

  it("noTopUp → top_up is not in the tips", () => {
    const s = getOilStatus(palm, batch, [session(20, "high", ["chicken_pork"])], []);
    expect(s.noTopUp).toBe(true);
    expect(s.tips).not.toContain("top_up");
    expect(s.tips).toContain("dont_top_up");
  });

  it("same logs near tpc.high 18–20: soybean urgency ≥ palm olein urgency", () => {
    const logs = [session(12, "medium", ["lumpia"])];
    const soy = getOilStatus(profile("soybean"), batch, logs, []);
    const palmStatus = getOilStatus(palm, batch, logs, []);
    expect(soy.tpc.high).toBeGreaterThanOrEqual(18);
    expect(soy.tpc.high).toBeLessThanOrEqual(20);
    expect(soy.urgency).toBeGreaterThanOrEqual(palmStatus.urgency);
  });

  it("4 frying days → reuse advisory in reasons, action not forced by it", () => {
    const days = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"].map((d) => session(1, "medium", ["banana_cue"], d));
    const s = getOilStatus(palm, batch, days, []);
    expect(s.fryingDays).toBe(4);
    expect(s.reasons).toContain(ADVISORY_REUSE);
    expect(s.hardRule).toBeUndefined();
    expect(s.action).toBe("keep");
  });

  it("keeps reasons to at most 3 and unique", () => {
    const days = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"].map((d) => session(3, "high", ["battered_breaded"], d));
    const s = getOilStatus(profile("generic"), batch, days, [], { batchId: "b1", date: "2026-10-04", signs: ["foam"] });
    expect(s.reasons.length).toBeLessThanOrEqual(3);
    expect(new Set(s.reasons).size).toBe(s.reasons.length);
  });

  it("tips follow the research table", () => {
    const keep = getOilStatus(palm, batch, [session(2, "high", ["fishball"])], []);
    expect(keep.tips).toEqual(["filter_daily", "cover_overnight", "lower_heat"]);
    const lowHeat = getOilStatus(palm, batch, [session(2, "low", ["fishball"])], []);
    expect(lowHeat.tips).not.toContain("lower_heat");
    expect(lowHeat.hoursLeftLowerHeat).toBe(lowHeat.hoursLeftNow);
  });

  it("flags beyondData when hours left pass the 30 h of model data", () => {
    expect(getOilStatus(palm, batch, [session(1, "medium", ["fishball"])], []).beyondData).toBe(true);
    expect(getOilStatus(palm, batch, [session(1, "high", ["fishball"])], []).beyondData).toBe(false);
  });
});
