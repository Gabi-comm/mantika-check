import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateAdvice } from "@/lib/llm";
import { SCENARIOS, runScenario } from "./scenarioRunner";

const RUN = process.env.RUN_LLM_EVAL === "1";
const ENV_FILE = join(__dirname, "..", ".env.local");
if (RUN && existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const MODELS = (process.env.HF_EVAL_MODELS ?? process.env.HF_MODEL ?? "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

type Outcome = "validated" | "schema" | "action" | "tip" | "number" | "timeout" | "error" | "empty";

interface Row {
  model: string;
  scenario: string;
  action: string;
  source: string;
  outcome: Outcome;
  reason: string;
  latencyMs: number;
}

function classify(reason: string): Outcome {
  if (reason === "validated") return "validated";
  if (reason === "empty reply") return "empty";
  if (reason.includes("schema")) return "schema";
  if (reason.includes("action ")) return "action";
  if (reason.includes("tip not allowed")) return "tip";
  if (reason.includes("number not in facts")) return "number";
  if (reason.includes("timeout")) return "timeout";
  return "error";
}

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "n/a");
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

function summary(rows: Row[]): string {
  const lines = ["# LLM advice evaluation", "", `Run: ${new Date().toISOString()}`, `Scenarios: ${SCENARIOS.length}`, ""];
  lines.push("| Model | Action consistency | Raw action mismatch | Made-up numbers | Schema fail | Fallback | Avg latency |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const model of MODELS) {
    const r = rows.filter((x) => x.model === model);
    const count = (o: Outcome) => r.filter((x) => x.outcome === o).length;
    const consistent = r.filter((x) => x.source === "template" || x.outcome === "validated").length;
    const avg = r.reduce((a, x) => a + x.latencyMs, 0) / (r.length || 1);
    lines.push(
      `| ${model} | ${pct(consistent, r.length)} | ${pct(count("action"), r.length)} | ${pct(count("number"), r.length)} | ${pct(count("schema") + count("empty"), r.length)} | ${pct(r.filter((x) => x.source !== "llm").length, r.length)} | ${Math.round(avg)} ms |`,
    );
  }
  lines.push("", "Action consistency counts the advice shown to the vendor: validated LLM replies plus template fallbacks. It must be 100%.");
  return lines.join("\n") + "\n";
}

describe.skipIf(!RUN)("LLM advice evaluation", () => {
  it(
    "keeps the engine action for every scenario and model",
    async () => {
      expect(MODELS.length, "set HF_MODEL or HF_EVAL_MODELS").toBeGreaterThan(0);
      const rows: Row[] = [];
      for (const model of MODELS) {
        for (const s of SCENARIOS) {
          const status = runScenario(s);
          const start = performance.now();
          const { advice, reason } = await generateAdvice(status, { token: process.env.HF_TOKEN, model });
          rows.push({
            model,
            scenario: s.name,
            action: status.action,
            source: advice.source,
            outcome: classify(reason),
            reason,
            latencyMs: Math.round(performance.now() - start),
          });
        }
      }
      const header = ["model", "scenario", "action", "source", "outcome", "reason", "latency_ms"];
      const csv = [header.join(","), ...rows.map((r) => [r.model, r.scenario, r.action, r.source, r.outcome, r.reason, r.latencyMs].map(csvCell).join(","))];
      writeFileSync(join(__dirname, "llm_eval.csv"), csv.join("\n") + "\n");
      writeFileSync(join(__dirname, "llm_eval_summary.md"), summary(rows));
      expect(rows.every((r) => r.source === "template" || r.outcome === "validated")).toBe(true);
    },
    30 * 60 * 1000,
  );
});
