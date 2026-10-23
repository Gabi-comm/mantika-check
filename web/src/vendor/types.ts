/**
 * Data contract for the vendor workspace.
 *
 * ENGINE CONTRACT (owned by Gabriel). Mirrored from the revised MANTIKA_CHECK_UI_Plan because no
 * shared `web/src/lib/types.ts` exists in the repository yet. When the engine's shared types land,
 * import them from there, delete this block, and report any mismatch rather than editing his file.
 * Field names (including `messageTaglish`) are kept exactly as specified; the UI only ever renders
 * English, through the presentation layer in copy.ts / adapter.ts.
 *
 * UI RECORDS (owned by the UI). Batches, events and settings stored on this device.
 */

// ---------------- engine contract (mirror) ----------------
export type Action = "keep" | "monitor" | "change_soon" | "change_now";
export type Heat = "low" | "medium" | "high";
export type Sign = "smoke" | "foam" | "dark_murky" | "thick";
export type FoodId = "banana_cue" | "fishball" | "lumpia" | "chicken_pork" | "battered_breaded";
export type OilType = "coconut" | "palm_olein" | "generic" | "soybean" | "corn" | "sunflower";

export interface OilStatus {
  action: Action;
  /** 0 to 100, presentation only */
  urgency: number;
  /** Model TPC estimate and range. `null` until a validated engine supplies it; the UI never invents one. */
  tpc: { est: number; low: number; high: number } | null;
  hoursUsed: number;
  /** Remaining-hours forecasts. `null` when the source cannot substantiate them. */
  hoursLeftNow: number | null;
  hoursLeftLowerHeat: number | null;
  /** Distinct calendar days with at least one logged session */
  fryingDays: number;
  /** True when the remaining-hours forecast exceeds the model data range; shown as "30+ h" instead of a number */
  beyondData: boolean;
  /** Up to three short reasons, already decided by the engine */
  reasons: string[];
  /** Present when a hard rule fired. Always shown first and overrides everything else. */
  hardRule?: string;
  noTopUp: boolean;
  /** Tip ids */
  tips: string[];
}

export interface Advice {
  headline: string;
  /** Field name fixed by the engine contract. In this UI its content is always English. */
  messageTaglish: string;
  tips: { id: string; text: string }[];
  source: "llm" | "template";
}

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

export type StatusSource = "demo-heuristic" | "engine";

/** What the UI receives from useOilStatus(). */
export interface StatusResult {
  status: OilStatus;
  source: StatusSource;
  /** "illustrative" until an engine reports validated output. */
  validation: "illustrative" | "validated";
}

export interface AdviceResult {
  advice: Advice | null;
  /** How the advice was obtained, for honest labelling */
  delivery: "template" | "llm" | "offline-template" | "error-template" | "missing";
}
