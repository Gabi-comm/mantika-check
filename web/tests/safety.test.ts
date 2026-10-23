import { describe, expect, it } from "vitest";
import { HARD_RULE_FSSAI, applySafety } from "@/lib/safety";

describe("applySafety", () => {
  it("no signs → no force, no tips", () => {
    const r = applySafety([], 15);
    expect(r.forceAction).toBeUndefined();
    expect(r.hardRule).toBeUndefined();
    expect(r.noTopUp).toBe(false);
    expect(r.tips).toEqual([]);
  });

  it("smoke alone forces change_now with the FSSAI hard rule", () => {
    const r = applySafety(["smoke"], 14);
    expect(r.forceAction).toBe("change_now");
    expect(r.hardRule).toBe(HARD_RULE_FSSAI);
  });

  it("three signs force change_now", () => {
    const r = applySafety(["dark", "sticky", "smell"], 14);
    expect(r.forceAction).toBe("change_now");
    expect(r.hardRule).toBe(HARD_RULE_FSSAI);
  });

  it("two non-smoke signs do not force", () => {
    expect(applySafety(["dark", "smell"], 14).forceAction).toBeUndefined();
  });

  it("tpcHigh ≥ 25 blocks top-ups", () => {
    expect(applySafety([], 25).noTopUp).toBe(true);
    expect(applySafety([], 30).noTopUp).toBe(true);
    expect(applySafety([], 24.99).noTopUp).toBe(false);
  });

  it("foam only adds check_heat and does not force", () => {
    const r = applySafety(["foam"], 14);
    expect(r.tips).toEqual(["check_heat"]);
    expect(r.forceAction).toBeUndefined();
  });

  it("foam with another sign does not add check_heat", () => {
    expect(applySafety(["foam", "dark"], 14).tips).toEqual([]);
  });
});
