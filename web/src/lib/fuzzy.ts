// mamdani fuzzy inference (fuzzify, fire rules, defuzzify)
export type Membership = (x: number) => number;

export interface FuzzyVar {
  name: string;
  sets: Record<string, Membership>;
}

export interface Rule {
  if: [varName: string, setName: string][];
  then: string;
  weight?: number;
  label: string;
  source: string;
}

export interface FiredRule {
  label: string;
  source: string;
  strength: number;
}

export interface InferResult {
  urgency: number;
  fired: FiredRule[];
}

export function trap(x: number, a: number, b: number, c: number, d: number): number {
  if (x >= b && x <= c) return 1;
  if (x < b) {
    if (a === b) return 1;
    return x <= a ? 0 : (x - a) / (b - a);
  }
  if (c === d) return 1;
  return x >= d ? 0 : (d - x) / (d - c);
}

export function tri(x: number, a: number, b: number, c: number): number {
  if (x === b) return 1;
  if (x <= a || x >= c) return 0;
  return x < b ? (x - a) / (b - a) : (c - x) / (c - b);
}

const OUTPUT_MIN = 0;
const OUTPUT_MAX = 100;
const OUTPUT_STEP = 1;

function membershipOf(inputs: Record<string, number>, vars: Map<string, FuzzyVar>, varName: string, setName: string): number {
  const mf = vars.get(varName)?.sets[setName];
  const x = inputs[varName];
  if (!mf || x === undefined) throw new Error(`Unknown fuzzy term ${varName}.${setName}`);
  return mf(x);
}

export function infer(
  inputs: Record<string, number>,
  inputVars: FuzzyVar[],
  outputSets: Record<string, Membership>,
  rules: Rule[],
): InferResult {
  const vars = new Map(inputVars.map((v) => [v.name, v]));
  const strengths = rules.map((rule) => {
    const memberships = rule.if.map(([varName, setName]) => membershipOf(inputs, vars, varName, setName));
    return Math.min(...memberships) * (rule.weight ?? 1);
  });
  const outputs = rules.map((rule) => {
    const out = outputSets[rule.then];
    if (!out) throw new Error(`Unknown output set ${rule.then}`);
    return out;
  });

  let area = 0;
  let moment = 0;
  for (let x = OUTPUT_MIN; x <= OUTPUT_MAX; x += OUTPUT_STEP) {
    let mu = 0;
    for (let i = 0; i < rules.length; i++) mu = Math.max(mu, Math.min(strengths[i], outputs[i](x)));
    area += mu;
    moment += mu * x;
  }

  const fired = rules
    .map((rule, i) => ({ label: rule.label, source: rule.source, strength: strengths[i] }))
    .filter((f) => f.strength > 0)
    .sort((a, b) => b.strength - a.strength);

  return { urgency: area === 0 ? 0 : moment / area, fired };
}
