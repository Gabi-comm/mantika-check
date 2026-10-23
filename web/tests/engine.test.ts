import { describe, expect, it } from "vitest";
import { getOilStatus } from "@/lib/engine";
import { HARD_RULE_FSSAI } from "@/lib/safety";
import type { Check, OilBatch, Session } from "@/lib/types";

const batch: OilBatch = { id: "b1", startDate: "2026-10-01", litres: 4 };

function session(hours: number, heat: Session["heat"], foods: Session["foods"], date = "2026-10-01"): Session {
  return { batchId: "b1", date, hours, heat, foods };
}

describe("getOilStatus", () => {
  it("fresh oil + one 2 h medium session → keep", () => {
    const s = getOilStatus(batch, [session(2, "medium", ["banana_cue"])], []);
    expect(s.action).toBe("keep");
    expect(s.hoursUsed).toBe(2);
    expect(s.hardRule).toBeUndefined();
    expect(s.hoursLeftLowerHeat).toBeGreaterThan(s.hoursLeftNow);
  });

  it("15 h at high with battered food → change_soon or change_now", () => {
    const s = getOilStatus(batch, [session(15, "high", ["battered_breaded"])], []);
    expect(["change_soon", "change_now"]).toContain(s.action);
  });

  it("a smoke check → change_now with hardRule", () => {
    const check: Check = { batchId: "b1", date: "2026-10-01", signs: ["smoke"] };
    const s = getOilStatus(batch, [session(1, "low", ["banana_cue"])], [], check);
    expect(s.action).toBe("change_now");
    expect(s.hardRule).toBe(HARD_RULE_FSSAI);
    expect(s.urgency).toBeGreaterThanOrEqual(90);
    expect(s.reasons[0]).toBe(HARD_RULE_FSSAI);
  });

  it("noTopUp → top_up is not in the tips", () => {
    const s = getOilStatus(batch, [session(15, "high", ["chicken_pork"])], []);
    expect(s.noTopUp).toBe(true);
    expect(s.tips).not.toContain("top_up");
    expect(s.tips).toContain("dont_top_up");
  });

  it("keeps reasons to at most 3 and unique", () => {
    const check: Check = { batchId: "b1", date: "2026-10-02", signs: ["dark", "sticky", "smell"] };
    const s = getOilStatus(batch, [session(12, "high", ["fishball"])], [], check);
    expect(s.reasons.length).toBeLessThanOrEqual(3);
    expect(new Set(s.reasons).size).toBe(s.reasons.length);
  });

  it("at low heat, hoursLeftLowerHeat equals hoursLeftNow", () => {
    const s = getOilStatus(batch, [session(3, "low", ["lumpia"])], []);
    expect(s.hoursLeftLowerHeat).toBe(s.hoursLeftNow);
  });

  it("foam only adds the check_heat tip", () => {
    const check: Check = { batchId: "b1", date: "2026-10-01", signs: ["foam"] };
    expect(getOilStatus(batch, [session(2, "medium", [])], [], check).tips).toContain("check_heat");
  });
});
