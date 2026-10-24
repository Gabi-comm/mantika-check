// symbolic part: fuzzy membership sets and the rule base
import { infer, trap, tri, type FuzzyVar, type InferResult, type Membership, type Rule } from "./fuzzy";
import type { Action } from "./types";

type Trap = [number, number, number, number];
type Tri = [number, number, number];

export interface FuzzyParams {
  output: { keep: Trap; monitor: Tri; soon: Tri; now: Trap };
  weights: { R4: number; R5: number };
  cuts: [keep: number, monitor: number, soon: number];
  breaded: [start: number, end: number];
  cox: [start: number, end: number];
}

// [X] design choices, checked in tests/scenarios + tests/sensitivity
export const DEFAULT_FUZZY_PARAMS: FuzzyParams = {
  output: { keep: [0, 0, 20, 40], monitor: [25, 45, 60], soon: [50, 70, 85], now: [75, 90, 100, 100] },
  weights: { R4: 0.5, R5: 0.5 },
  cuts: [30, 55, 75],
  breaded: [0.25, 0.5],
  cox: [2, 4],
};

// [S2][S3][S4] 20% crossover; [S2][S5][S6][S7] 24% crossover, fully critical at 25%
export const TPC_VAR: FuzzyVar = {
  name: "tpc",
  sets: {
    good: (x) => trap(x, 0, 0, 19, 21),
    approaching: (x) => trap(x, 19, 21, 23, 25),
    critical: (x) => trap(x, 23, 25, 40, 40),
  },
};

// [S14][S15] direction; [X] breakpoints
function breadedVar([a, b]: FuzzyParams["breaded"]): FuzzyVar {
  return { name: "breaded", sets: { low: (x) => trap(x, 0, 0, a, b), high: (x) => trap(x, a, b, 1, 1) } };
}

// [S10][S11] Cox values; [X] breakpoints
function coxVar([a, b]: FuzzyParams["cox"]): FuzzyVar {
  return { name: "cox", sets: { stable: (x) => trap(x, 0, 0, a, b), less_stable: (x) => trap(x, a, b, 8, 8) } };
}

// [X]
function outputSets({ keep, monitor, soon, now }: FuzzyParams["output"]): Record<string, Membership> {
  return {
    keep: (x) => trap(x, ...keep),
    monitor: (x) => tri(x, ...monitor),
    soon: (x) => tri(x, ...soon),
    now: (x) => trap(x, ...now),
  };
}

const CORE_RULE_COUNT = 3;

function rules({ R4, R5 }: FuzzyParams["weights"]): Rule[] {
  return [
    { if: [["tpc", "good"]], then: "keep", weight: 1, label: "Estimated TPC is still fine (< 20%)", source: "[S2][S3]" },
    {
      if: [["tpc", "approaching"]],
      then: "soon",
      weight: 1,
      label: "Close to the limit (20–24% TPC): plan a change or filter the oil",
      source: "[S2][S3][S4]",
    },
    { if: [["tpc", "critical"]], then: "now", weight: 1, label: "Past the 24–25% TPC limit", source: "[S2][S5][S6][S7]" },
    {
      if: [["tpc", "good"], ["breaded", "high"]],
      then: "monitor",
      weight: R4,
      label: "Frequent battered/breaded frying: the oil breaks down faster",
      source: "[S14][S15]",
    },
    {
      if: [["tpc", "good"], ["cox", "less_stable"]],
      then: "monitor",
      weight: R5,
      label: "This type of oil breaks down more easily (high in PUFA)",
      source: "[S10][S12][S13]",
    },
  ];
}

export function ruleBase(params: FuzzyParams = DEFAULT_FUZZY_PARAMS) {
  return {
    vars: [TPC_VAR, breadedVar(params.breaded), coxVar(params.cox)],
    outputs: outputSets(params.output),
    rules: rules(params.weights),
  };
}

export function coreRules(all: Rule[]): Rule[] {
  return all.slice(0, CORE_RULE_COUNT);
}

export interface OilInputs {
  tpc: number;
  breaded: number;
  cox: number;
}

export function inferUrgency(inputs: OilInputs, params: FuzzyParams = DEFAULT_FUZZY_PARAMS): InferResult {
  const { vars, outputs, rules: rs } = ruleBase(params);
  const full = infer({ ...inputs }, vars, outputs, rs);
  const base = infer({ ...inputs }, vars, outputs, coreRules(rs));
  return { urgency: Math.max(base.urgency, full.urgency), fired: full.fired };
}

// [X]
export function urgencyToAction(u: number, [keep, monitor, soon]: FuzzyParams["cuts"] = DEFAULT_FUZZY_PARAMS.cuts): Action {
  if (u < keep) return "keep";
  if (u < monitor) return "monitor";
  if (u < soon) return "change_soon";
  return "change_now";
}
