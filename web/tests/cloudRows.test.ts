import { describe, expect, it } from "vitest";
import { demoState, emptyState } from "@/vendor/seed";
import { fingerprints, fromRows, mergeIntoAccount, ownRecords, toRows } from "@/vendor/cloudRows";
import type { Batch, VendorState } from "@/vendor/types";

const userBatch: Batch = {
  id: "u-1",
  label: "Batch 07",
  origin: "user",
  startedAt: "2026-10-20T01:00:00.000Z",
  oilType: "palm_olein",
  heatSource: "lpg",
  volumeL: 3,
  pricePerL: 90,
  events: [
    { id: "e-1", at: "2026-10-20T02:00:00.000Z", origin: "user", kind: "session", hours: 2.5, heat: "medium", foods: ["fishball"] },
    { id: "e-2", at: "2026-10-20T05:00:00.000Z", origin: "user", kind: "topup", litres: 0.5 },
  ],
};
const withUser = (s: VendorState): VendorState => ({
  ...s,
  profile: { stallName: "Kanto Fishball", origin: "user" },
  setup: { oilType: "palm_olein", volumeL: 3, heatSource: "lpg", pricePerL: 90 },
  batches: [userBatch, ...s.batches],
  activeBatchId: "u-1",
});

describe("cloud rows", () => {
  it("never sends demo records", () => {
    const rows = toRows(demoState("monitor"));
    expect(rows.batches).toHaveLength(0);
    expect(rows.events).toHaveLength(0);
    expect(rows.profile.stall_name).toBeNull();
  });

  it("round-trips the vendor's own records", () => {
    const local = withUser(emptyState);
    const back = fromRows(toRows(local));
    expect(back.batches).toEqual([userBatch]);
    expect(back.activeBatchId).toBe("u-1");
    expect(back.profile).toEqual(local.profile);
    expect(back.setup).toEqual(local.setup);
  });

  it("normalises server timestamps so unchanged rows are not re-sent", () => {
    const rows = toRows(withUser(emptyState));
    const fromServer = { ...rows, events: rows.events.map((e) => ({ ...e, at: e.at.replace(".000Z", "+00:00") })) };
    expect(fingerprints(toRows(fromRows(fromServer)))).toEqual(fingerprints(rows));
  });

  it("adopts a demo batch the vendor logged into, without its demo events", () => {
    const s = demoState("monitor");
    const active = s.batches.find((b) => b.id === s.activeBatchId)!;
    const logged: VendorState = {
      ...s,
      batches: s.batches.map((b) => (b.id === active.id ? { ...b, events: [...b.events, { id: "mine", at: "2026-10-24T01:00:00.000Z", origin: "user", kind: "topup", litres: 1 }] } : b)),
    };
    const own = ownRecords(logged);
    expect(own).toHaveLength(1);
    expect(own[0].events.map((e) => e.id)).toEqual(["mine"]);
    expect(toRows(logged).profile.active_batch_id).toBe(active.id);
  });

  it("merges device records into the account; the account wins on conflicts", () => {
    const remote = fromRows(toRows(withUser(emptyState)));
    const extra: Batch = { ...userBatch, id: "u-2", label: "Batch 08", startedAt: "2026-10-22T01:00:00.000Z", events: [] };
    const localEdit = { ...userBatch, label: "renamed on phone", events: [...userBatch.events, { id: "e-3", at: "2026-10-21T01:00:00.000Z", origin: "user" as const, kind: "topup" as const, litres: 1 }] };
    const merged = mergeIntoAccount(remote, { ...emptyState, batches: [extra, localEdit], activeBatchId: "u-2" })!;
    expect(merged.batches.map((b) => b.id)).toEqual(["u-2", "u-1"]);
    const u1 = merged.batches.find((b) => b.id === "u-1")!;
    expect(u1.label).toBe("Batch 07");
    expect(u1.events.map((e) => e.id)).toEqual(["e-1", "e-2", "e-3"]);
    expect(merged.activeBatchId).toBe("u-1");
  });

  it("leaves the device alone when neither side has the vendor's records", () => {
    expect(mergeIntoAccount(fromRows(toRows(emptyState)), demoState("keep"))).toBeNull();
  });
});
