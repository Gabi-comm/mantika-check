// all ui text in one place
import type { Action, ChangeReason, FoodId, Heat, HeatSource, OilType, Sign, StatusSource } from "./types";

export const copy = {
  product: "MANTIKA CHECK",

  status: {
    keep: "Continue Monitoring",
    monitor: "Monitor Closely",
    change_soon: "Replacement Recommended",
    change_now: "Replace Oil",
  } satisfies Record<Action, string>,
  statusDetail: {
    keep: "No logged pattern currently calls for action. Keep recording sessions and checks.",
    monitor: "Usage is building up. Filter the oil and run a quick check before the next session.",
    change_soon: "Plan to replace this batch. Avoid topping up old oil.",
    change_now: "Replace the oil before the next session.",
  } satisfies Record<Action, string>,

  source: {
    engine: "Engine",
  } satisfies Record<StatusSource, string>,
  sourceDetail: {
    engine: "Calculated in your browser from your logs: TPC model trained on lab frying data, FSSAI safety rules and fuzzy rules. An estimate, not a lab test.",
  } satisfies Record<StatusSource, string>,
  illustrative: "Model estimate",

  warning: {
    title: "Critical warning recorded",
    body: (signs: string) => `You reported: ${signs}. Replace the oil before the next session, regardless of any other indicator.`,
  },

  why: "Why this status?",
  whyEmpty: "No contributing factors yet.",

  nav: {
    dashboard: "Dashboard",
    log: "Log Session",
    check: "Quick Check",
    history: "History",
    settings: "Settings",
    about: "About & Limits",
    experimental: "Color Analyzer",
    home: "Home",
  },

  actions: {
    log: "Log Session",
    topUp: "Top Up",
    check: "Quick Check",
    replace: "Replace Oil",
    setup: "Start New Batch",
    save: "Save",
    saveSession: "Save Session",
    saveCheck: "Save Check",
    saveTopUp: "Record Top-Up",
    confirmReplace: "Close Batch and Start New",
    cancel: "Cancel",
    back: "Back to dashboard",
    viewHistory: "View full history",
  },

  heat: { low: "Low", medium: "Medium", high: "High" } satisfies Record<Heat, string>,
  heatHint: { low: "about 160 °C", medium: "about 175 °C", high: "about 190 °C" } satisfies Record<Heat, string>,

  foods: {
    banana_cue: "Banana cue / Turon",
    fishball: "Fishball / Kikiam",
    lumpia: "Lumpia",
    chicken_pork: "Chicken / Pork",
    battered_breaded: "Battered or Breaded Foods",
  } satisfies Record<FoodId, string>,

  signs: {
    smoke: { title: "Unusual smoke", desc: "Blue-gray smoke at normal frying heat" },
    foam: { title: "Persistent foaming", desc: "Thick foam that does not go away" },
    dark_murky: { title: "Dark and murky oil", desc: "Dark and cloudy; you cannot see through it" },
    thick: { title: "Thick or sticky oil", desc: "Oil has become thick or sticky" },
  } satisfies Record<Sign, { title: string; desc: string }>,

  oilTypes: {
    coconut: "Coconut Oil",
    palm_olein: "Palm Olein",
    soybean: "Soybean Oil",
    corn: "Corn Oil",
    sunflower: "Sunflower Oil",
    generic: "Unknown / Repacked Oil",
  } satisfies Record<OilType, string>,
  heatSources: { lpg: "LPG burner", charcoal: "Charcoal", electric: "Electric" } satisfies Record<HeatSource, string>,
  reasons: {
    dark_murky: "Dark and murky",
    smoke: "Unusual smoke",
    foam: "Persistent foaming",
    thick: "Thick or sticky",
    schedule: "Planned schedule",
    recommendation: "Followed recommendation",
    other: "Other",
  } satisfies Record<ChangeReason, string>,

  log: {
    title: "Log a frying session",
    lead: "Choose duration and heat, then save. Food and temperature are optional.",
    duration: "Duration",
    heat: "Heat level",
    foods: "Food cooked",
    foodsHint: "Optional. Select all that apply. Battered or breaded includes kwek-kwek, tokneneng and breaded chicken or fish.",
    temp: "Measured oil temperature",
    tempHint: "Optional. Only if you used a thermometer.",
    tempError: "Enter a temperature between 100 and 230 °C.",
    when: "Session time",
    whenNow: "Just now",
    saved: "Session saved.",
  },
  check: {
    title: "Quick condition check",
    lead: "Select anything you notice right now.",
    signsTitle: "Warning signs",
    habits: "Handling",
    filtered: "Filtered today",
    covered: "Covered overnight",
    saved: "Check saved.",
    signConfirm: "Saving with a warning sign selected raises a critical warning and recommends replacing the oil. This is a conservative safety rule.",
  },
  setup: {
    title: "Start a new oil batch",
    lead: "Takes under a minute. You can edit these details later.",
    stall: "Stall name",
    stallHint: "Shown only on this device.",
    oilType: "Oil type",
    volume: "Initial oil volume",
    volumeError: "Enter a volume between 0.5 and 30 litres.",
    heatSource: "Heat source",
    cost: "Oil price per liter",
    costHint: "Optional. Used to estimate weekly peso savings in the heat simulator.",
    oilRequired: "Choose an oil type.",
    costError: "Enter an amount greater than 0, or leave it blank.",
    date: "Start date",
    saved: "New batch started.",
    replaceNotice: "Your current batch will be closed and kept in history.",
  },
  topUp: {
    title: "Top up oil",
    lead: "Record fresh oil added to the current batch.",
    amount: "Amount added",
    blockedTitle: "Do Not Top Up",
    blocked: "Adding fresh oil to this batch is not recommended. Replace the oil instead.",
    saved: "Top-up recorded.",
  },
  replace: {
    title: "Replace oil",
    lead: "Close the current batch and start a fresh one. The old batch stays in history.",
    reason: "Reason for replacement",
    newVolume: "New oil volume",
    note: "Note",
    noteHint: "Optional.",
    saved: "Oil replaced. A new batch has started.",
  },
  history: {
    title: "History",
    lead: "Every batch and event recorded on this device.",
    search: "Search events",
    all: "All batches",
    active: "Active",
    closed: "Closed",
    noResults: "No events match these filters.",
    empty: "No batches yet.",
  },
  heatCompare: {
    title: "Heat simulator",
    lead: "Model estimate of how long this oil lasts at each heat level, and what frying at a lower heat saves.",
    noPrice: "Add an oil price per liter in Setup to see peso savings.",
    savedWeek: "saved per week",
    extraWeek: "extra cost per week",
    current: "Current",
    hoursLeft: "hours left",
    blocked: "Not shown while a critical warning or a Replace Oil status is active.",
  },
  states: {
    offline: "You are offline. Records still save on this device; advice is shown from built-in templates.",
    error: "This could not be saved.",
    errorDetail: "Your browser blocked local storage or it is full. Free some space and try again.",
    emptyTitle: "No active oil batch",
    emptyLead: "Start a batch to begin logging frying sessions and checks.",
    loading: "Loading workspace",
  },
  demo: {
    badge: "Demo data",
    note: "This workspace is pre-filled with fictional demo records so you can explore it. Your own entries are marked separately.",
    reset: "Reset demo data",
    resetDone: "Demo data restored.",
    scenarios: {
      keep: "Continue Monitoring",
      monitor: "Monitor Closely",
      change_soon: "Replacement Recommended",
      change_now: "Replace Oil",
      warning: "Critical Warning Override",
    },
    removeDemo: "Remove demo records",
    removeDone: "Demo records removed. Your own entries were kept.",
    clearAll: "Delete all data",
    clearDone: "All local data deleted.",
    userBadge: "Your entry",
  },
} as const;

export const HOUR_PRESETS = [1, 2, 3, 4, 5] as const;
export const TOPUP_PRESETS = [0.25, 0.5, 1] as const;

export const forecastCopy = {
  title: "Usage and forecast",
  fryingDays: "Frying days",
  hoursUsed: "Hours used",
  remaining: "Remaining hours",
  remainingLower: "At lower heat",
  tpc: "Polar compounds (TPC)",
  unavailable: "Unavailable",
  unavailableWhy: "Log a frying session to see a forecast.",
  beyond: "30+ h",
  beyondWhy: "The forecast extends beyond the data the model was built on, so no exact number is shown.",
  warningWhy: "Not shown while a critical warning is active.",
  modelEstimate: "Model estimate",
};

export const adviceCopy = {
  title: "Guidance",
  template: "Template",
  llm: "AI-worded",
  llmTitle: "Reworded by a language model from the decided status. It does not make the decision.",
  templateTitle: "Fixed wording selected by the status. It never decides the status.",
  offline: "Offline: built-in guidance",
  error: "Guidance service unavailable: built-in guidance shown",
  missing: "No guidance is available for this status.",
  loading: "Loading guidance…",
};
