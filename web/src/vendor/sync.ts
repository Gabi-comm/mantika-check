"use client";

import { useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/supabase/client";
import { SUPABASE_CONFIGURED } from "@/supabase/config";
import { clearAll, hydrate, resetDemo, vendorStore } from "./store";
import { fingerprints, fromRows, mergeIntoAccount, toRows, type BatchRow, type CloudRows, type EventRow, type ProfileRow } from "./cloudRows";

/**
 * Mirrors the signed-in vendor's workspace to Supabase.
 * Sign-in pulls the account and merges it with records made on this device; every later change is pushed
 * (debounced, only rows that changed). Offline changes stay on the device and go up when the connection returns.
 */
export type CloudStatus = "local" | "signed-out" | "loading" | "synced" | "saving" | "offline" | "error";
export interface CloudState {
  status: CloudStatus;
  email: string | null;
  username: string | null;
  lastSyncedAt: string | null;
}

let cloud: CloudState = { status: SUPABASE_CONFIGURED ? "loading" : "local", email: null, username: null, lastSyncedAt: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<CloudState>) => {
  cloud = { ...cloud, ...patch };
  listeners.forEach((l) => l());
};

let userId: string | null = null;
let pushed = new Map<string, string>();
let ready = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let pushing: Promise<void> | null = null;
let started = 0;

async function pull(sb: SupabaseClient, uid: string): Promise<CloudRows> {
  const [p, b, e] = await Promise.all([
    sb.from("profiles").select("username, stall_name, setup, active_batch_id").eq("id", uid).maybeSingle(),
    sb.from("batches").select("id, label, started_at, ended_at, end_reason, oil_type, heat_source, volume_l, price_per_l"),
    sb.from("batch_events").select("id, batch_id, kind, at, data"),
  ]);
  const err = p.error ?? b.error ?? e.error;
  if (err) throw err;
  return {
    profile: (p.data as ProfileRow | null) ?? { stall_name: null, setup: null, active_batch_id: null },
    batches: (b.data ?? []) as BatchRow[],
    events: (e.data ?? []) as EventRow[],
  };
}

async function connect(sb: SupabaseClient, uid: string, email: string | null) {
  userId = uid;
  ready = false;
  set({ status: "loading", email });
  try {
    const rows = await pull(sb, uid);
    if (userId !== uid) return;
    const remote = fromRows(rows);
    pushed = fingerprints(toRows(remote));
    const merged = mergeIntoAccount(remote, vendorStore.getSnapshot());
    if (merged) hydrate(merged);
    ready = true;
    set({ username: rows.profile.username ?? null, status: "synced", lastSyncedAt: new Date().toISOString() });
    schedulePush(0);
  } catch {
    if (userId === uid) set({ status: navigator.onLine ? "error" : "offline" });
  }
}

async function push(sb: SupabaseClient) {
  if (!ready || !userId) return;
  const uid = userId;
  const rows = toRows(vendorStore.getSnapshot());
  const next = fingerprints(rows);
  const batches = rows.batches.filter((b) => pushed.get(`b:${b.id}`) !== next.get(`b:${b.id}`));
  const events = rows.events.filter((e) => pushed.get(`e:${e.id}`) !== next.get(`e:${e.id}`));
  const profileChanged = pushed.get("profile") !== next.get("profile");
  if (!batches.length && !events.length && !profileChanged) return;

  set({ status: "saving" });
  try {
    // Batches before events: events reference their batch.
    if (batches.length) {
      const { error } = await sb.from("batches").upsert(batches.map((b) => ({ ...b, user_id: uid })), { onConflict: "user_id,id" });
      if (error) throw error;
    }
    if (events.length) {
      const { error } = await sb.from("batch_events").upsert(events.map((e) => ({ ...e, user_id: uid })), { onConflict: "user_id,id" });
      if (error) throw error;
    }
    if (profileChanged) {
      const { error } = await sb.from("profiles").update(rows.profile).eq("id", uid);
      if (error) throw error;
    }
    if (userId !== uid) return;
    for (const b of batches) pushed.set(`b:${b.id}`, next.get(`b:${b.id}`)!);
    for (const e of events) pushed.set(`e:${e.id}`, next.get(`e:${e.id}`)!);
    if (profileChanged) pushed.set("profile", next.get("profile")!);
    set({ status: "synced", lastSyncedAt: new Date().toISOString() });
  } catch {
    if (userId === uid) set({ status: navigator.onLine ? "error" : "offline" });
  }
}

function schedulePush(delay = 700) {
  const sb = supabaseBrowser();
  if (!sb || !ready) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    timer = null;
    await pushing;
    pushing = push(sb);
    await pushing;
    pushing = null;
  }, delay);
}

/** Starts the sync once per tab (AppShell mounts it). Returns a cleanup. */
export function startCloudSync(): () => void {
  const sb = supabaseBrowser();
  if (!sb) return () => {};
  if (started++ > 0) return () => void started--;

  const { data } = sb.auth.onAuthStateChange((event, session) => {
    // Supabase calls must not run inside this callback; defer them.
    setTimeout(() => {
      const uid = session?.user.id ?? null;
      if (!uid) {
        const wasSignedIn = userId !== null;
        userId = null;
        ready = false;
        pushed = new Map();
        set({ status: "signed-out", email: null, username: null, lastSyncedAt: null });
        // Do not leave a vendor's records on a shared phone after they sign out.
        if (wasSignedIn && event === "SIGNED_OUT") resetDemo();
        return;
      }
      if (uid !== userId) void connect(sb, uid, session?.user.email ?? null);
    }, 0);
  });
  const unsubscribeStore = vendorStore.subscribe(() => schedulePush());
  const onOnline = () => (ready ? schedulePush(0) : userId && void connect(sb, userId, cloud.email));
  window.addEventListener("online", onOnline);

  return () => {
    started--;
    data.subscription.unsubscribe();
    unsubscribeStore();
    window.removeEventListener("online", onOnline);
  };
}

/** Deletes the vendor's batches and events in the account, then on this device. Profile row stays. */
export async function clearEverywhere(): Promise<boolean> {
  const sb = supabaseBrowser();
  if (sb && userId) {
    const uid = userId;
    ready = false;
    const { error } = await sb.from("batches").delete().eq("user_id", uid);
    const { error: pErr } = await sb.from("profiles").update({ stall_name: null, setup: null, active_batch_id: null }).eq("id", uid);
    if (error || pErr) {
      ready = true;
      return false;
    }
    pushed = fingerprints(toRows({ version: 2, profile: null, setup: null, batches: [], activeBatchId: null, demoScenario: null }));
    const ok = clearAll();
    ready = true;
    return ok;
  }
  return clearAll();
}

export const cloudStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  get: () => cloud,
};

export function useCloud(): CloudState {
  return useSyncExternalStore(cloudStore.subscribe, cloudStore.get, cloudStore.get);
}
