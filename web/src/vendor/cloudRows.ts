import type { Batch, BatchEvent, ChangeReason, HeatSource, Profile, Setup, VendorState } from "./types";
import type { OilType } from "@/lib/types";

/**
 * Pure mapping between the on-device workspace and the Supabase tables
 * (profiles, batches, batch_events; see supabase/migrations). No network here.
 * Only the vendor's own records go to the cloud: user batches, plus demo batches that hold user events.
 */
export interface BatchRow {
  id: string;
  label: string;
  started_at: string;
  ended_at: string | null;
  end_reason: ChangeReason | null;
  oil_type: OilType;
  heat_source: HeatSource;
  volume_l: number;
  price_per_l: number | null;
}
export interface EventRow {
  id: string;
  batch_id: string;
  kind: BatchEvent["kind"];
  at: string;
  data: Record<string, unknown>;
}
export interface ProfileRow {
  username?: string | null;
  stall_name: string | null;
  setup: Setup | null;
  active_batch_id: string | null;
}
export interface CloudRows {
  profile: ProfileRow;
  batches: BatchRow[];
  events: EventRow[];
}

const iso = (t: string) => new Date(t).toISOString();
const isoOrNull = (t: string | null | undefined) => (t ? iso(t) : null);

/** Batches that belong in the account, with demo events stripped out. */
export function ownRecords(s: VendorState): Batch[] {
  return s.batches
    .map((b) => ({ ...b, events: b.events.filter((e) => e.origin === "user") }))
    .filter((b) => b.origin === "user" || b.events.length > 0)
    .map((b) => ({ ...b, origin: "user" as const }));
}

export function toRows(s: VendorState): CloudRows {
  const own = ownRecords(s);
  const batches: BatchRow[] = own.map((b) => ({
    id: b.id,
    label: b.label,
    started_at: iso(b.startedAt),
    ended_at: isoOrNull(b.endedAt),
    end_reason: b.endReason ?? null,
    oil_type: b.oilType,
    heat_source: b.heatSource,
    volume_l: b.volumeL,
    price_per_l: b.pricePerL ?? null,
  }));
  const events: EventRow[] = own.flatMap((b) =>
    b.events.map((e) => {
      const { id, at, kind, origin: _origin, ...data } = e;
      void _origin;
      return { id, batch_id: b.id, kind, at: iso(at), data };
    })
  );
  const ids = new Set(own.map((b) => b.id));
  return {
    profile: {
      stall_name: s.profile?.origin === "user" ? s.profile.stallName : null,
      setup: s.setup,
      active_batch_id: s.activeBatchId && ids.has(s.activeBatchId) ? s.activeBatchId : null,
    },
    batches,
    events,
  };
}

export function fromRows(rows: CloudRows): VendorState {
  const byBatch = new Map<string, BatchEvent[]>();
  for (const r of [...rows.events].sort((a, b) => (a.at < b.at ? -1 : 1))) {
    const e = { ...r.data, id: r.id, at: iso(r.at), kind: r.kind, origin: "user" } as BatchEvent;
    byBatch.set(r.batch_id, [...(byBatch.get(r.batch_id) ?? []), e]);
  }
  const batches: Batch[] = rows.batches
    .map((r) => ({
      id: r.id,
      label: r.label,
      origin: "user" as const,
      startedAt: iso(r.started_at),
      ...(r.ended_at ? { endedAt: iso(r.ended_at) } : {}),
      ...(r.end_reason ? { endReason: r.end_reason } : {}),
      oilType: r.oil_type,
      heatSource: r.heat_source,
      volumeL: Number(r.volume_l),
      ...(r.price_per_l != null ? { pricePerL: Number(r.price_per_l) } : {}),
      events: byBatch.get(r.id) ?? [],
    }))
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  const profile: Profile | null = rows.profile.stall_name ? { stallName: rows.profile.stall_name, origin: "user" } : null;
  const active = rows.profile.active_batch_id;
  return {
    version: 2,
    profile,
    setup: rows.profile.setup,
    batches,
    activeBatchId: active && batches.some((b) => b.id === active && !b.endedAt) ? active : (batches.find((b) => !b.endedAt)?.id ?? null),
    demoScenario: null,
  };
}

/**
 * Sign-in merge: the account wins on conflicts; records made on this device before signing in are added.
 * Returns null when there is nothing of the vendor's own on either side (leave the device as it is).
 */
export function mergeIntoAccount(remote: VendorState, local: VendorState): VendorState | null {
  const mine = ownRecords(local);
  if (!remote.batches.length && !mine.length && !remote.profile) return null;
  const byId = new Map(remote.batches.map((b) => [b.id, b]));
  for (const b of mine) {
    const r = byId.get(b.id);
    if (!r) byId.set(b.id, b);
    else {
      const have = new Set(r.events.map((e) => e.id));
      byId.set(b.id, { ...r, events: [...r.events, ...b.events.filter((e) => !have.has(e.id))].sort((x, y) => (x.at < y.at ? -1 : 1)) });
    }
  }
  const batches = [...byId.values()].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  const localActive = local.activeBatchId && byId.get(local.activeBatchId) && !byId.get(local.activeBatchId)!.endedAt ? local.activeBatchId : null;
  return {
    version: 2,
    profile: remote.profile ?? (local.profile?.origin === "user" ? local.profile : null),
    setup: remote.setup ?? (mine.length ? local.setup : null),
    batches,
    activeBatchId: remote.activeBatchId ?? localActive,
    demoScenario: null,
  };
}

/** Stable per-row keys and fingerprints, so a push only sends rows that changed. */
export function fingerprints(rows: CloudRows): Map<string, string> {
  const m = new Map<string, string>();
  m.set("profile", JSON.stringify(rows.profile));
  for (const b of rows.batches) m.set(`b:${b.id}`, JSON.stringify(b));
  for (const e of rows.events) m.set(`e:${e.id}`, JSON.stringify(e));
  return m;
}
