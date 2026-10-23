import { describe, expect, it } from "vitest";
import { getOilStatus } from "@/lib/engine";
import type { Action, Food, Heat, OilBatch, Session, Sign, TopUp } from "@/lib/types";
import scenarios from "./scenarios.json";

interface Scenario {
  name: string;
  category: string;
  litres: number;
  sessions: { date: string; hours: number; heat: string; tempC?: number; foods: string[] }[];
  topUps: { date: string; litres: number }[];
  check?: string[];
  expected: string[];
}

const MIN_AGREEMENT = 0.8;

function run(s: Scenario) {
  const batch: OilBatch = { id: "s", startDate: "2026-10-01", litres: s.litres };
  const sessions: Session[] = s.sessions.map((x) => ({ ...x, batchId: "s", heat: x.heat as Heat, foods: x.foods as Food[] }));
  const topUps: TopUp[] = s.topUps.map((x) => ({ ...x, batchId: "s" }));
  const check = s.check ? { batchId: "s", date: "2026-10-31", signs: s.check as Sign[] } : undefined;
  return getOilStatus(batch, sessions, topUps, check);
}

describe("scenario agreement", () => {
  const list = scenarios as Scenario[];

  it("has 25 scenarios", () => expect(list).toHaveLength(25));

  it(`agrees with common-sense guidance on at least ${MIN_AGREEMENT * 100}%`, () => {
    const rows = list.map((s) => {
      const status = run(s);
      return {
        scenario: s.name,
        category: s.category,
        expected: s.expected.join("|"),
        got: status.action,
        urgency: Number(status.urgency.toFixed(1)),
        tpcHigh: Number(status.tpc.high.toFixed(1)),
        agree: s.expected.includes(status.action as Action),
      };
    });
    const agreement = rows.filter((r) => r.agree).length / rows.length;

    console.table(rows);
    console.log(`Scenario agreement: ${(agreement * 100).toFixed(0)}% (${rows.filter((r) => r.agree).length}/${rows.length})`);
    const misses = rows.filter((r) => !r.agree);
    for (const m of misses) {
      console.log(`DISAGREE: ${m.scenario} — expected ${m.expected}, got ${m.got} (urgency ${m.urgency}, tpc.high ${m.tpcHigh})`);
    }

    expect(agreement).toBeGreaterThanOrEqual(MIN_AGREEMENT);
  });
});
