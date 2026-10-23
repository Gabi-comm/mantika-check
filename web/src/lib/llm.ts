import OpenAI from "openai";
import { ADVICE_REPLY_JSON_SCHEMA, SYSTEM_RULES, buildFacts, validateReply } from "./advice";
import { templateAdvice, tipsFor } from "./templates";
import type { Advice, OilStatus } from "./types";

export const HF_BASE_URL = "https://router.huggingface.co/v1";
const TIMEOUT_MS = 8000;

export interface LlmConfig {
  token?: string;
  model?: string;
}

export interface AdviceOutcome {
  advice: Advice;
  reason: string;
}

type ChatCreate = (
  body: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  options: { signal: AbortSignal },
) => Promise<OpenAI.Chat.ChatCompletion>;

function hfChat(token: string): ChatCreate {
  const client = new OpenAI({ baseURL: HF_BASE_URL, apiKey: token });
  return (body, options) => client.chat.completions.create(body, options);
}

function fallback(status: OilStatus, reason: string): AdviceOutcome {
  return { advice: templateAdvice(status), reason };
}

export async function generateAdvice(status: OilStatus, config: LlmConfig, chat?: ChatCreate): Promise<AdviceOutcome> {
  if (!config.token || !config.model) return fallback(status, "HF_TOKEN or HF_MODEL not set");

  const facts = buildFacts(status);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const completion = await (chat ?? hfChat(config.token))(
      {
        model: config.model,
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_schema", json_schema: { name: "advice", schema: ADVICE_REPLY_JSON_SCHEMA } },
        messages: [
          { role: "system", content: SYSTEM_RULES },
          { role: "user", content: JSON.stringify(facts) },
        ],
      },
      { signal: controller.signal },
    );
    const content = completion.choices[0]?.message?.content;
    if (!content) return fallback(status, "empty reply");

    const result = validateReply(JSON.parse(content), facts);
    if (!result.ok) return fallback(status, `validation failed: ${result.reason}`);

    return {
      advice: {
        headline: result.reply.headline,
        messageTaglish: result.reply.messageTaglish,
        tips: tipsFor(result.reply.tipIds),
        source: "llm",
      },
      reason: "validated",
    };
  } catch (error) {
    const message = controller.signal.aborted ? "timeout" : error instanceof Error ? error.message : String(error);
    return fallback(status, `error: ${message}`);
  } finally {
    clearTimeout(timer);
  }
}
