import { describe, expect, it } from "vitest";
import { infer, trap, tri } from "@/lib/fuzzy";
import { TPC_VAR, inferUrgency, ruleBase, urgencyToAction } from "@/lib/rules";

const TOL = 1e-6;
const { vars, outputs, rules } = ruleBase();
const [, BREADED, COX] = vars;

describe("membership functions", () => {
  it("trap is 0 outside, 1 on the plateau, linear on slopes", () => {
    expect(trap(0, 1, 2, 3, 4)).toBe(0);
    expect(trap(1, 1, 2, 3, 4)).toBe(0);
    expect(trap(1.5, 1, 2, 3, 4)).toBe(0.5);
    expect(trap(2, 1, 2, 3, 4)).toBe(1);
    expect(trap(3, 1, 2, 3, 4)).toBe(1);
    expect(trap(4, 1, 2, 3, 4)).toBe(0);
    expect(trap(5, 1, 2, 3, 4)).toBe(0);
  });

  it("trap handles left and right shoulders", () => {
    expect(trap(0, 0, 0, 19, 21)).toBe(1);
    expect(trap(-1, 0, 0, 19, 21)).toBe(1);
    expect(trap(21, 0, 0, 19, 21)).toBe(0);
    expect(trap(40, 23, 25, 40, 40)).toBe(1);
    expect(trap(45, 23, 25, 40, 40)).toBe(1);
    expect(trap(23, 23, 25, 40, 40)).toBe(0);
  });

  it("tri peaks at b and is 0 at a and c", () => {
    expect(tri(25, 25, 45, 60)).toBe(0);
    expect(tri(45, 25, 45, 60)).toBe(1);
    expect(tri(60, 25, 45, 60)).toBe(0);
    expect(tri(35, 25, 45, 60)).toBe(0.5);
  });

  it("tpc sets cross at 20% and 24%, fully critical at 25%", () => {
    const { good, approaching, critical } = TPC_VAR.sets;
    expect(good(19)).toBe(1);
    expect(good(20)).toBe(0.5);
    expect(approaching(20)).toBe(0.5);
    expect(good(21)).toBe(0);
    expect(approaching(21)).toBe(1);
    expect(approaching(23)).toBe(1);
    expect(approaching(24)).toBe(0.5);
    expect(critical(24)).toBe(0.5);
    expect(approaching(25)).toBe(0);
    expect(critical(25)).toBe(1);
  });

  it("breaded and cox sets hit 0 and 1 at their breakpoints", () => {
    expect(BREADED.sets.low(0.25)).toBe(1);
    expect(BREADED.sets.low(0.5)).toBe(0);
    expect(BREADED.sets.high(0.25)).toBe(0);
    expect(BREADED.sets.high(0.5)).toBe(1);
    expect(COX.sets.stable(2)).toBe(1);
    expect(COX.sets.stable(4)).toBe(0);
    expect(COX.sets.less_stable(2)).toBe(0);
    expect(COX.sets.less_stable(4)).toBe(1);
    expect(COX.sets.stable(3)).toBe(0.5);
    expect(COX.sets.less_stable(3)).toBe(0.5);
  });

  it("output sets hit 0 and 1 at the right points", () => {
    expect(outputs.keep(20)).toBe(1);
    expect(outputs.keep(40)).toBe(0);
    expect(outputs.monitor(45)).toBe(1);
    expect(outputs.soon(70)).toBe(1);
    expect(outputs.now(90)).toBe(1);
    expect(outputs.now(75)).toBe(0);
  });
});

describe("infer", () => {
  it("returns 0 urgency and no fired rules when nothing fires", () => {
    const v = [{ name: "tpc", sets: { low: (x: number) => trap(x, 0, 1, 10, 20) } }];
    const r = infer({ tpc: 50 }, v, outputs, [{ if: [["tpc", "low"]], then: "keep", label: "low", source: "test" }]);
    expect(r.urgency).toBe(0);
    expect(r.fired).toEqual([]);
  });

  it("sorts fired rules by strength, drops zeros, carries sources", () => {
    const r = inferUrgency({ tpc: 20, breaded: 1, cox: 7.42 });
    expect(r.fired.length).toBeGreaterThan(1);
    for (let i = 1; i < r.fired.length; i++) expect(r.fired[i - 1].strength).toBeGreaterThanOrEqual(r.fired[i].strength);
    expect(r.fired.every((f) => f.strength > 0 && f.source.startsWith("[S"))).toBe(true);
  });

  it("has the 5 rules, each with a source", () => {
    expect(rules).toHaveLength(5);
    expect(rules.every((r) => /^\[S\d+\]/.test(r.source))).toBe(true);
  });
});

describe("monotonicity", () => {
  function nonDecreasing(values: { u: number; at: string }[]): string[] {
    const bad: string[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i].u < values[i - 1].u - TOL) bad.push(`${values[i].at}: ${values[i - 1].u.toFixed(4)} -> ${values[i].u.toFixed(4)}`);
    }
    return bad;
  }

  it("urgency never decreases as tpc rises (breaded 0/1, cox 0.28/7.42)", () => {
    const bad: string[] = [];
    for (const breaded of [0, 1]) {
      for (const cox of [0.28, 7.42]) {
        const sweep = Array.from({ length: 101 }, (_, i) => 10 + i * 0.25).map((tpc) => ({
          u: inferUrgency({ tpc, breaded, cox }).urgency,
          at: `tpc ${tpc} breaded ${breaded} cox ${cox}`,
        }));
        bad.push(...nonDecreasing(sweep));
      }
    }
    expect(bad, bad.join("\n")).toEqual([]);
  });

  it("urgency never decreases as breaded (0→1) or cox (0→8) rises at tpc 12/18/22", () => {
    const bad: string[] = [];
    for (const tpc of [12, 18, 22]) {
      for (const cox of [0.28, 7.42]) {
        const sweep = Array.from({ length: 21 }, (_, i) => i / 20).map((breaded) => ({
          u: inferUrgency({ tpc, breaded, cox }).urgency,
          at: `breaded ${breaded} tpc ${tpc} cox ${cox}`,
        }));
        bad.push(...nonDecreasing(sweep));
      }
      for (const breaded of [0, 1]) {
        const sweep = Array.from({ length: 33 }, (_, i) => i / 4).map((cox) => ({
          u: inferUrgency({ tpc, breaded, cox }).urgency,
          at: `cox ${cox} tpc ${tpc} breaded ${breaded}`,
        }));
        bad.push(...nonDecreasing(sweep));
      }
    }
    expect(bad, bad.join("\n")).toEqual([]);
  });

  it("modifiers can only raise urgency", () => {
    for (let tpc = 10; tpc <= 35; tpc += 0.5) {
      for (const cox of [0.28, 7.42]) {
        expect(inferUrgency({ tpc, breaded: 1, cox }).urgency).toBeGreaterThanOrEqual(inferUrgency({ tpc, breaded: 0, cox }).urgency - TOL);
      }
      for (const breaded of [0, 1]) {
        expect(inferUrgency({ tpc, breaded, cox: 7.42 }).urgency).toBeGreaterThanOrEqual(
          inferUrgency({ tpc, breaded, cox: 0.28 }).urgency - TOL,
        );
      }
    }
  });
});

describe("corners", () => {
  const action = (tpc: number, breaded: number, cox: number) => urgencyToAction(inferUrgency({ tpc, breaded, cox }).urgency);
  it("(14, 0, palm olein) → keep", () => expect(action(14, 0, 1.7)).toBe("keep"));
  it("(22, 0, palm olein) → change_soon", () => expect(action(22, 0, 1.7)).toBe("change_soon"));
  it("(26, 0, palm olein) → change_now", () => expect(action(26, 0, 1.7)).toBe("change_now"));
  it("(14, 1, soybean) → keep or monitor", () => expect(["keep", "monitor"]).toContain(action(14, 1, 7.42)));
});

describe("urgencyToAction", () => {
  it("uses 30/55/75 cut points", () => {
    expect(urgencyToAction(29.9)).toBe("keep");
    expect(urgencyToAction(30)).toBe("monitor");
    expect(urgencyToAction(54.9)).toBe("monitor");
    expect(urgencyToAction(55)).toBe("change_soon");
    expect(urgencyToAction(74.9)).toBe("change_soon");
    expect(urgencyToAction(75)).toBe("change_now");
  });
});
