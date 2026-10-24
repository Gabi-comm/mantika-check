// zod schemas for the api
import { z } from "zod";
import { ACTIONS } from "./advice";
import type { OilStatus } from "./types";

export const OilStatusSchema = z.object({
  action: z.enum(ACTIONS),
  urgency: z.number().min(0).max(100),
  tpc: z.object({ est: z.number(), low: z.number(), high: z.number() }),
  hoursUsed: z.number().min(0),
  fryingDays: z.number().int().min(0),
  hoursLeftNow: z.number().min(0),
  hoursLeftLowerHeat: z.number().min(0),
  beyondData: z.boolean(),
  reasons: z.array(z.string()).max(3),
  hardRule: z.string().optional(),
  noTopUp: z.boolean(),
  tips: z.array(z.string()),
}) satisfies z.ZodType<OilStatus>;
