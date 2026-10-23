import { z } from "zod";
import { TPC_LIMIT } from "./model";
import type { Action, OilStatus } from "./types";

export const ACTIONS = ["keep", "monitor", "change_soon", "change_now"] as const satisfies readonly Action[];

export const AdviceReply = z.object({
  headline: z.string().max(60),
  action: z.enum(ACTIONS),
  reasons: z.array(z.string()).max(3),
  tipIds: z.array(z.string()),
  messageTaglish: z.string().max(300),
});

export type AdviceReply = z.infer<typeof AdviceReply>;

export const ADVICE_REPLY_JSON_SCHEMA = z.toJSONSchema(AdviceReply);

export const SYSTEM_RULES =
  "You explain a decision already made by a rule engine. Use only the facts given. Never change the action. " +
  "No health or medical claims. Do not add new numbers. At most 3 sentences. Write in Taglish. Reply only with the JSON.";

export interface AdviceFacts {
  action: Action;
  urgency: number;
  estRange: [number, number];
  hoursLeftNow: number;
  hoursLeftLowerHeat: number;
  thresholdTpc: number;
  reasons: string[];
  allowedTips: string[];
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export function buildFacts(status: OilStatus): AdviceFacts {
  return {
    action: status.action,
    urgency: round1(status.urgency),
    estRange: [round1(status.tpc.low), round1(status.tpc.high)],
    hoursLeftNow: round1(status.hoursLeftNow),
    hoursLeftLowerHeat: round1(status.hoursLeftLowerHeat),
    thresholdTpc: TPC_LIMIT,
    reasons: status.reasons,
    allowedTips: status.tips,
  };
}

const NUMBER_PATTERN = /\d+(?:\.\d+)?/g;

function numbersIn(text: string): number[] {
  return (text.match(NUMBER_PATTERN) ?? []).map(Number);
}

function allowedNumbers(facts: AdviceFacts): Set<number> {
  const values = [
    facts.urgency,
    ...facts.estRange,
    facts.hoursLeftNow,
    facts.hoursLeftLowerHeat,
    facts.thresholdTpc,
    ...facts.reasons.flatMap(numbersIn),
  ];
  return new Set(values.map(round1));
}

export type Validation = { ok: true; reply: AdviceReply } | { ok: false; reason: string };

export function validateReply(reply: unknown, facts: AdviceFacts): Validation {
  const parsed = AdviceReply.safeParse(reply);
  if (!parsed.success) return { ok: false, reason: `schema: ${parsed.error.issues[0]?.message ?? "invalid"}` };
  const r = parsed.data;
  if (r.action !== facts.action) return { ok: false, reason: `action ${r.action} != ${facts.action}` };
  const unknownTip = r.tipIds.find((id) => !facts.allowedTips.includes(id));
  if (unknownTip) return { ok: false, reason: `tip not allowed: ${unknownTip}` };
  const allowed = allowedNumbers(facts);
  const madeUp = [...numbersIn(r.headline), ...numbersIn(r.messageTaglish)].find((n) => !allowed.has(round1(n)));
  if (madeUp !== undefined) return { ok: false, reason: `number not in facts: ${madeUp}` };
  return { ok: true, reply: r };
}
