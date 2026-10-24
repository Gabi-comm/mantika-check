// shared types between the engine and the ui
export type Action = "keep" | "monitor" | "change_soon" | "change_now";
export type Heat = "low" | "medium" | "high";
// [S7]
export type Sign = "smoke" | "foam" | "dark_murky" | "thick";
// [S14][S15]
export type Food = "banana_cue" | "fishball" | "lumpia" | "chicken_pork" | "battered_breaded";
export type OilType = "coconut" | "palm_olein" | "generic" | "soybean" | "corn" | "sunflower";

export interface VendorProfile { oilType: OilType; panLitres: number; heatSource: string; oilPricePerLitre?: number }
export interface OilBatch { id: string; startDate: string; litres: number; changedAt?: string; changeReason?: string }
export interface Session { batchId: string; date: string; hours: number; heat: Heat; tempC?: number; foods: Food[] }
export interface TopUp { batchId: string; date: string; litres: number }
export interface Check { batchId: string; date: string; signs: Sign[]; filtered?: boolean; covered?: boolean }

export interface OilStatus {
  action: Action;
  urgency: number;
  tpc: { est: number; low: number; high: number };
  hoursUsed: number;
  fryingDays: number;
  hoursLeftNow: number;
  hoursLeftLowerHeat: number;
  beyondData: boolean;
  reasons: string[];
  hardRule?: string;
  noTopUp: boolean;
  tips: string[];
}

export interface Advice {
  headline: string;
  messageTaglish: string;
  tips: { id: string; text: string }[];
  source: "llm" | "template";
}
