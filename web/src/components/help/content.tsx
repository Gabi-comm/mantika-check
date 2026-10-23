import type { ReactNode } from "react";
import { BatchDemo, CheckDemo, HistoryDemo, LogDemo, StatusDemo, TopUpDemo } from "@/components/site/FeatureDemos";

export type HelpId = "dashboard" | "log" | "check" | "history" | "topup" | "replace" | "setup" | "settings" | "color" | "about";

export interface HelpEntry {
  id: HelpId;
  title: string;
  summary: string;
  points: { t: string; d: string }[];
  demo?: ReactNode;
}

/** What each workspace section does. Shown in the help sidebar; the first five also drive the guided tour. */
export const HELP: Record<HelpId, HelpEntry> = {
  dashboard: {
    id: "dashboard",
    title: "Dashboard",
    summary: "Your oil at a glance: Ollie and the status, what the estimate is based on, and what to do next.",
    points: [
      { t: "Monitoring status", d: "One of four states. Ollie changes colour and mood with it." },
      { t: "Usage and forecast", d: "Hours used, estimated TPC range and hours left at your current heat." },
      { t: "Why this status?", d: "Up to three reasons, each tied to a source." },
      { t: "Heat simulator", d: "Hours left at each heat level and pesos saved by frying lower." },
      { t: "Guidance", d: "Short advice and tips. Wording may come from an AI; the decision never does." },
    ],
    demo: <StatusDemo />,
  },
  log: {
    id: "log",
    title: "Log Session",
    summary: "Record one frying session: choose how long and how hot, then save. Food and temperature are optional.",
    points: [
      { t: "Duration", d: "Presets from 1 to 5+ hours." },
      { t: "Heat level", d: "Low, medium or high (about 160, 175, 190 °C), or type a measured temperature." },
      { t: "Food", d: "Battered and breaded food wears oil faster, so it is worth ticking." },
    ],
    demo: <LogDemo />,
  },
  check: {
    id: "check",
    title: "Quick Check",
    summary: "Tick any warning sign you notice right now. Any sign means change the oil, whatever the estimate says.",
    points: [
      { t: "Four signs", d: "Unusual smoke, persistent foam, dark and murky, thick or sticky oil (FSSAI)." },
      { t: "Habits", d: "Whether you filtered and covered the oil. It shapes the tips you get." },
      { t: "No signs?", d: "Save anyway. A clean check is a useful record too." },
    ],
    demo: <CheckDemo />,
  },
  history: {
    id: "history",
    title: "History",
    summary: "Every batch and event recorded on this device, grouped by day.",
    points: [
      { t: "Batches", d: "Each pan of oil with its totals and why it was replaced." },
      { t: "Filters", d: "Show only sessions, checks, top-ups or replacements." },
      { t: "Search", d: "Find food, signs or reasons across all records." },
    ],
    demo: <HistoryDemo />,
  },
  color: {
    id: "color",
    title: "Color Analyzer",
    summary: "Measures the average color of a region you select in a photo and compares it with three printed swatches. Experimental; never used for the status.",
    points: [
      { t: "Pick a photo", d: "It stays in your browser." },
      { t: "Drag the box", d: "Select a patch of oil without glare." },
      { t: "Read the result", d: "Lighting and cameras change color a lot, so treat it as a curiosity." },
    ],
  },
  topup: {
    id: "topup",
    title: "Top Up",
    summary: "Record fresh oil added to the current batch. Locked when the oil is past the limit or a warning sign was recorded.",
    points: [
      { t: "Presets", d: "0.25, 0.5 or 1 L." },
      { t: "Top-up guard", d: "Fresh oil cannot rescue spent oil; replace it instead." },
    ],
    demo: <TopUpDemo />,
  },
  replace: {
    id: "replace",
    title: "Replace Oil",
    summary: "Close the current batch and start a fresh one. The old batch stays in history.",
    points: [
      { t: "Reason", d: "Say why you replaced it, so the history makes sense later." },
      { t: "New batch", d: "Then set up the fresh oil so tracking starts from zero." },
    ],
  },
  setup: {
    id: "setup",
    title: "New Batch",
    summary: "Takes under a minute. You can edit these details later.",
    points: [
      { t: "Oil type", d: "Some oils break down faster; the engine accounts for it." },
      { t: "Volume and price", d: "Price per liter unlocks peso savings in the heat simulator." },
    ],
    demo: <BatchDemo />,
  },
  settings: {
    id: "settings",
    title: "Settings",
    summary: "Demo scenarios and the data stored on this device.",
    points: [
      { t: "Demo scenarios", d: "Load a fictional dataset for each status." },
      { t: "Your data", d: "See what is stored and delete it." },
    ],
  },
  about: {
    id: "about",
    title: "About & Limits",
    summary: "What each number in the workspace means, where it comes from, and what Mantika Check cannot tell you.",
    points: [],
  },
};

export function helpForPath(path: string): HelpEntry {
  if (path.startsWith("/app/log")) return HELP.log;
  if (path.startsWith("/app/check")) return HELP.check;
  if (path.startsWith("/app/history")) return HELP.history;
  if (path.startsWith("/app/top-up")) return HELP.topup;
  if (path.startsWith("/app/replace")) return HELP.replace;
  if (path.startsWith("/app/setup")) return HELP.setup;
  if (path.startsWith("/app/settings")) return HELP.settings;
  if (path.startsWith("/app/experimental")) return HELP.color;
  if (path.startsWith("/app/about")) return HELP.about;
  return HELP.dashboard;
}

/** Guided-tour stops, in order. Settings and About & Limits are deliberately left out. */
export const TOUR_STOPS: { id: HelpId; target: string }[] = [
  { id: "dashboard", target: "dashboard" },
  { id: "log", target: "log" },
  { id: "check", target: "check" },
  { id: "history", target: "history" },
  { id: "color", target: "color" },
];
