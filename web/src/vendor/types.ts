// records saved on the device (batches, events, settings)
import type { Advice, Food, Heat, OilStatus, OilType, Sign } from "@/lib/types";

export type { Action, Advice, Heat, OilStatus, OilType, Sign } from "@/lib/types";
export type FoodId = Food;

export type HeatSource = "lpg" | "charcoal" | "electric";
export type ChangeReason = "dark_murky" | "smoke" | "foam" | "thick" | "schedule" | "recommendation" | "other";
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
  at: string;
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
  demoScenario: DemoScenario | null;
}

export type StatusSource = "engine";

export interface StatusResult {
  status: OilStatus;
  source: StatusSource;
  validation: "illustrative" | "validated" | "model-estimate";
}

export interface AdviceResult {
  advice: Advice | null;
  delivery: "template" | "llm" | "offline-template" | "error-template" | "missing";
}
