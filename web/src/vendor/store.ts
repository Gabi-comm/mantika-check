"use client";

import type { Batch, BatchEvent, ChangeReason, DemoScenario, Setup, VendorState } from "./types";
import { demoState, emptyState } from "./seed";
import { activeBatchOf } from "./selectors";

/**
 * Local-only persistence (this browser). No server, no account.
 * First visit seeds the fictional demo dataset so the workspace is never blank.
 */
const KEY = "mantika.web.v2";

let state: VendorState | null = null;
const listeners = new Set<() => void>();

function load(): VendorState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VendorState;
      if (parsed && parsed.version === 2) return { ...emptyState, ...parsed };
    }
  } catch {
    /* fall through to seed */
  }
  const seeded = demoState();
  try {
    localStorage.setItem(KEY, JSON.stringify(seeded));
  } catch {
    /* storage blocked: work in memory */
  }
  return seeded;
}

function commit(next: VendorState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  state = next;
  listeners.forEach((l) => l());
  return true;
}

export const vendorStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        state = load();
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot(): VendorState {
    if (!state) state = load();
    return state;
  },
  /** Server render and hydration pass: no data yet, the UI shows a skeleton. */
  getServerSnapshot(): VendorState | null {
    return null;
  },
};

const get = () => vendorStore.getSnapshot();
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `u-${Date.now()}-${Math.round(performance.now())}`);
const nowIso = () => new Date().toISOString();

type NewEvent = BatchEvent extends infer E ? (E extends BatchEvent ? Omit<E, "id" | "origin" | "at"> & { at?: string } : never) : never;

export function addEvent(e: NewEvent): boolean {
  const s = get();
  const b = activeBatchOf(s);
  if (!b) return false;
  const event = { ...e, at: e.at ?? nowIso(), id: uid(), origin: "user" } as BatchEvent;
  return commit({ ...s, batches: s.batches.map((x) => (x.id === b.id ? { ...x, events: [...x.events, event] } : x)) });
}

function nextLabel(s: VendorState) {
  const nums = s.batches.map((b) => Number(b.label.replace(/\D/g, "")) || 0);
  return `Batch ${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0")}`;
}

function closeActive(s: VendorState, reason: ChangeReason, at: string, newLitres: number, note?: string): Batch[] {
  return s.batches.map((b) =>
    b.id === s.activeBatchId && !b.endedAt
      ? { ...b, endedAt: at, endReason: reason, events: [...b.events, { id: uid(), at, origin: "user", kind: "replaced", reason, newLitres, note } as BatchEvent] }
      : b
  );
}

export function startBatch(setup: Setup, stallName: string, startedAt: string): boolean {
  const s = get();
  const at = startedAt || nowIso();
  const batch: Batch = { id: uid(), label: nextLabel(s), origin: "user", startedAt: at, ...setup, events: [] };
  const batches = s.activeBatchId ? closeActive(s, "other", at, setup.volumeL) : s.batches;
  return commit({
    ...s,
    profile: { stallName: stallName.trim() || "My stall", origin: "user" },
    setup,
    batches: [batch, ...batches],
    activeBatchId: batch.id,
  });
}

export function replaceOil(reason: ChangeReason, newLitres: number, note?: string): boolean {
  const s = get();
  const old = activeBatchOf(s);
  if (!old) return false;
  const at = nowIso();
  const fresh: Batch = {
    id: uid(),
    label: nextLabel(s),
    origin: "user",
    startedAt: at,
    oilType: old.oilType,
    heatSource: old.heatSource,
    volumeL: newLitres,
    pricePerL: s.setup?.pricePerL,
    events: [],
  };
  return commit({
    ...s,
    setup: s.setup ? { ...s.setup, volumeL: newLitres } : s.setup,
    batches: [fresh, ...closeActive(s, reason, at, newLitres, note)],
    activeBatchId: fresh.id,
  });
}

/** Replaces everything on this device with one deterministic demo dataset. */
export function loadDemoScenario(scenario: DemoScenario): boolean {
  return commit(demoState(scenario));
}

export function resetDemo(): boolean {
  return commit(demoState("monitor"));
}

/** Keeps batches and events the user created; drops seeded ones. */
export function removeDemoRecords(): boolean {
  const s = get();
  const batches = s.batches
    .map((b) => ({ ...b, events: b.events.filter((e) => e.origin === "user") }))
    .filter((b) => b.origin === "user" || b.events.length > 0)
    .map((b) => (b.origin === "demo" ? { ...b, origin: "user" as const } : b));
  const activeStillThere = batches.some((b) => b.id === s.activeBatchId && !b.endedAt);
  return commit({
    ...s,
    profile: s.profile?.origin === "demo" ? null : s.profile,
    batches,
    activeBatchId: activeStillThere ? s.activeBatchId : null,
    demoScenario: null,
  });
}

export function clearAll(): boolean {
  return commit({ ...emptyState });
}
