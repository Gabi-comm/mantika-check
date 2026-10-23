import { describe, expect, it } from "vitest";
import { ADVISORY_REUSE, HARD_RULE_SIGNS, HARD_RULE_TPC, applySafety } from "@/lib/safety";
import type { Sign } from "@/lib/types";

const low = { est: 14, high: 17 };

describe("applySafety", () => {
  it("no signs and low TPC → nothing forced", () => {
    const r = applySafety([], low, 1);
    expect(r.forceAction).toBeUndefined();
    expect(r.hardRule).toBeUndefined();
    expect(r.noTopUp).toBe(false);
    expect(r.advisories).toEqual([]);
    expect(r.tips).toEqual([]);
  });

  it.each(["smoke", "foam", "dark_murky", "thick"] as Sign[])("H1: %s alone forces change_now", (sign) => {
    const r = applySafety([sign], low, 1);
    expect(r.forceAction).toBe("change_now");
    expect(r.hardRule).toBe(HARD_RULE_SIGNS);
  });

  it("H2: est ≥ 25 forces change_now", () => {
    const r = applySafety([], { est: 25, high: 28 }, 1);
    expect(r.forceAction).toBe("change_now");
    expect(r.hardRule).toBe(HARD_RULE_TPC);
    expect(applySafety([], { est: 24.9, high: 27.9 }, 1).forceAction).toBeUndefined();
  });

  it("H1 and H2 together → one hardRule, H1 text", () => {
    const r = applySafety(["smoke"], { est: 26, high: 29 }, 1);
    expect(r.forceAction).toBe("change_now");
    expect(r.hardRule).toBe(HARD_RULE_SIGNS);
  });

  it("H3: high ≥ 25 blocks top-ups and adds dont_top_up", () => {
    const r = applySafety([], { est: 22, high: 25 }, 1);
    expect(r.noTopUp).toBe(true);
    expect(r.tips).toEqual(["dont_top_up"]);
    expect(r.forceAction).toBeUndefined();
    expect(applySafety([], { est: 22, high: 24.99 }, 1).noTopUp).toBe(false);
  });

  it("H4: more than 3 frying days adds the advisory without forcing", () => {
    const r = applySafety([], low, 4);
    expect(r.advisories).toEqual([ADVISORY_REUSE]);
    expect(r.forceAction).toBeUndefined();
    expect(applySafety([], low, 3).advisories).toEqual([]);
  });

  it.each(["smoke", "foam", "dark_murky", "thick"] as Sign[])("H1: %s also blocks top-up at low TPC", (sign) => {
    const r = applySafety([sign], { est: 12, high: 15 }, 1);
    expect(r.noTopUp).toBe(true);
    expect(r.tips).toContain("dont_top_up");
  });
});
