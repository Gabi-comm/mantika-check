import { describe, expect, it } from "vitest";
import type { Action } from "@/lib/types";
import { SCENARIOS, runScenario } from "./scenarioRunner";

const MIN_AGREEMENT = 0.8;

describe("scenario agreement", () => {
  it("has 25 scenarios, each citing a basis", () => {
    expect(SCENARIOS).toHaveLength(25);
    expect(SCENARIOS.every((s) => /S\d+/.test(s.basis))).toBe(true);
  });

  it(`agrees with guideline-based expectations on at least ${MIN_AGREEMENT * 100}%`, () => {
    const rows = SCENARIOS.map((s) => {
      const status = runScenario(s);
      return {
        scenario: s.name,
        expected: s.expected.join("|"),
        got: status.action,
        urgency: Number(status.urgency.toFixed(1)),
        tpcHigh: Number(status.tpc.high.toFixed(1)),
        basis: s.basis,
        agree: s.expected.includes(status.action as Action),
      };
    });
    const agreed = rows.filter((r) => r.agree).length;
    const agreement = agreed / rows.length;

    console.table(rows.map((r) => ({ scenario: r.scenario, expected: r.expected, got: r.got, urgency: r.urgency, tpcHigh: r.tpcHigh, agree: r.agree })));
    console.log(`Scenario agreement: ${(agreement * 100).toFixed(0)}% (${agreed}/${rows.length})`);
    for (const m of rows.filter((r) => !r.agree)) {
      console.log(`DISAGREE: ${m.scenario} — expected ${m.expected} (${m.basis}), got ${m.got} (urgency ${m.urgency}, tpc.high ${m.tpcHigh})`);
    }

    expect(agreement).toBeGreaterThanOrEqual(MIN_AGREEMENT);
  });
});
