/**
 * Data contract for the vendor workspace.
 *
 * ENGINE CONTRACT (owned by Gabriel) is imported from `@/lib/types`; do not redefine it here.
 * Field names (including `messageTaglish`) are fixed by that contract; the UI only ever renders English.
 *
 * UI RECORDS (owned by the UI). Batches, events and settings stored on this device.
 */

import type { Advice, Food, Heat, OilStatus, OilType, Sign } from "@/lib/types";

export type { Action, Advice, Heat, OilStatus, OilType, Sign } from "@/lib/types";
export type FoodId = Food;

// ---------------- UI-owned records ----------------
export type HeatSource = "lpg" | "charcoal" | "electric";
export type ChangeReason = "dark_murky" | "smoke" | "foam" | "thick" | "schedule" | "recommendation" | "other";
/** Where a record came from. Demo records are seeded and can be removed without touching user records. */
export type Origin = "demo" | "user";
export type DemoScenario = "keep" | "monitor" | "change_soon" | "change_now" | "warning";

export interface Profile {
  stallName: string;
  origin: Origin;
}

export interface Setup {
  oilType: OilType;
  volumeL: number;
  heatSource: HeatSource;
  pricePerL?: number;
}

interface EventBase {
  id: string;
  at: string; // ISO timestamp
  origin: Origin;
}
export type SessionEvent = EventBase & { kind: "session"; hours: number; heat: Heat; tempC?: number; foods: FoodId[] };
export type TopUpEvent = EventBase & { kind: "topup"; litres: number };
export type CheckEvent = EventBase & { kind: "check"; signs: Sign[]; filtered: boolean; covered: boolean };
export type ReplaceEvent = EventBase & { kind: "replaced"; reason: ChangeReason; newLitres: number; note?: string };
export type BatchEvent = SessionEvent | TopUpEvent | CheckEvent | ReplaceEvent;

export interface Batch {
  id: string;
  label: string;
  origin: Origin;
  startedAt: string;
  endedAt?: string;
  endReason?: ChangeReason;
  oilType: OilType;
  heatSource: HeatSource;
  volumeL: number;
  pricePerL?: number;
  events: BatchEvent[];
}

export interface VendorState {
  version: 2;
  profile: Profile | null;
  setup: Setup | null;
  batches: Batch[];
  activeBatchId: string | null;
  /** Which deterministic demo dataset was last loaded (null once demo data is removed). */
  demoScenario: DemoScenario | null;
}

export type StatusSource = "engine";

/** What the UI receives from useOilStatus(). */
export interface StatusResult {
  status: OilStatus;
  source: StatusSource;
  validation: "illustrative" | "validated" | "model-estimate";
}

export interface AdviceResult {
  advice: Advice | null;
  /** How the advice was obtained, for honest labelling */
  delivery: "template" | "llm" | "offline-template" | "error-template" | "missing";
}
