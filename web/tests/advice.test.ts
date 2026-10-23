import { describe, expect, it } from "vitest";
import { buildFacts, validateReply, type AdviceReply } from "@/lib/advice";
import { generateAdvice } from "@/lib/llm";
import { MOCKS } from "@/lib/mocks";
import { OilStatusSchema } from "@/lib/schemas";
import { TIP_TEXT, templateAdvice } from "@/lib/templates";
import { isTipId } from "@/lib/tips";
import type { OilStatus } from "@/lib/types";

const status = MOCKS.monitor.status;
const facts = buildFacts(status);

const good: AdviceReply = {
  headline: "Bantayan ang mantika",
  action: "monitor",
  reasons: ["Papalapit na sa limitasyon ang TPC"],
  tipIds: ["filter_daily", "lower_heat"],
  messageTaglish: `Papalapit na ang TPC, mga ${facts.estRange[0]}–${facts.estRange[1]}%. Mga ${facts.hoursLeftNow} oras pa bago umabot ng 25%.`,
};

function chatReturning(content: string) {
  return async () => ({
    id: "x",
    object: "chat.completion" as const,
    created: 0,
    model: "m",
    choices: [{ index: 0, finish_reason: "stop" as const, logprobs: null, message: { role: "assistant" as const, content, refusal: null } }],
  });
}

describe("buildFacts", () => {
  it("rounds numbers to 0.1 and carries no identifiers", () => {
    const f = buildFacts({ ...status, tpc: { est: 17.44, low: 14.461, high: 20.449 }, hoursLeftNow: 6.4321 });
    expect(f.estRange).toEqual([14.5, 20.4]);
    expect(f.hoursLeftNow).toBe(6.4);
    expect(Object.keys(f).sort()).toEqual(
      ["action", "allowedTips", "estRange", "hoursLeftLowerHeat", "hoursLeftNow", "reasons", "thresholdTpc", "urgency"].sort(),
    );
  });
});

describe("validateReply", () => {
  it("accepts a good reply", () => expect(validateReply(good, facts)).toEqual({ ok: true, reply: good }));
  it("rejects a wrong action", () => expect(validateReply({ ...good, action: "keep" }, facts).ok).toBe(false));
  it("rejects an unknown tip", () => expect(validateReply({ ...good, tipIds: ["change_oil"] }, facts).ok).toBe(false));
  it("rejects a made-up number", () =>
    expect(validateReply({ ...good, messageTaglish: "Mga 42 oras pa ang natitira." }, facts).ok).toBe(false));
  it("rejects a schema violation", () => {
    expect(validateReply({ ...good, headline: "x".repeat(61) }, facts).ok).toBe(false);
    expect(validateReply("not json", facts).ok).toBe(false);
  });
});

describe("templateAdvice", () => {
  it.each(["keep", "monitor", "change_soon", "change_now"] as const)("returns a message for %s", (action) => {
    const advice = templateAdvice({ ...status, action });
    expect(advice.source).toBe("template");
    expect(advice.headline.length).toBeGreaterThan(0);
    expect(advice.messageTaglish.length).toBeGreaterThan(0);
  });

  it("maps every tip id to Taglish text", () => {
    const advice = templateAdvice(status);
    expect(advice.tips.map((t) => t.id)).toEqual(status.tips);
    for (const t of advice.tips) expect(t.text).toBe(TIP_TEXT[t.id as keyof typeof TIP_TEXT]);
  });
});

describe("generateAdvice (no network)", () => {
  it("uses the template when env is missing", async () => {
    const r = await generateAdvice(status, {});
    expect(r.advice.source).toBe("template");
  });

  it("uses the LLM reply when it validates", async () => {
    const r = await generateAdvice(status, { token: "t", model: "m" }, chatReturning(JSON.stringify(good)));
    expect(r.advice.source).toBe("llm");
    expect(r.advice.tips.map((t) => t.id)).toEqual(good.tipIds);
  });

  it("falls back on a failed validation, bad JSON, or a thrown error", async () => {
    const wrong = await generateAdvice(status, { token: "t", model: "m" }, chatReturning(JSON.stringify({ ...good, action: "keep" })));
    expect(wrong.advice.source).toBe("template");
    const junk = await generateAdvice(status, { token: "t", model: "m" }, chatReturning("{oops"));
    expect(junk.advice.source).toBe("template");
    const boom = await generateAdvice(status, { token: "t", model: "m" }, async () => {
      throw new Error("503");
    });
    expect(boom.advice.source).toBe("template");
  });
});

describe("mocks", () => {
  it.each(Object.entries(MOCKS))("%s is a valid OilStatus with known tips", (_, mock) => {
    const s: OilStatus = mock.status;
    expect(OilStatusSchema.safeParse(s).success).toBe(true);
    expect(s.tips.every(isTipId)).toBe(true);
    expect(mock.advice.tips.every((t) => isTipId(t.id))).toBe(true);
  });
});
