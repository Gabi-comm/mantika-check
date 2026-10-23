import { generateAdvice } from "@/lib/llm";
import { OilStatusSchema } from "@/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const parsed = OilStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Body must be an OilStatus", issues: parsed.error.issues }, { status: 400 });
  }

  const { advice, reason } = await generateAdvice(parsed.data, {
    token: process.env.HF_TOKEN,
    model: process.env.HF_MODEL,
  });
  console.info(`[advice] source=${advice.source} reason=${reason}`);
  return Response.json(advice);
}
