import { demoState } from "@/vendor/seed";
import { engineAdapter } from "@/vendor/adapter";
import { activeBatchOf, batchTotals, hoursByDay, latestCheck, sortedEvents } from "@/vendor/selectors";

/** Website previews render the same deterministic demo dataset the workspace starts with. */
export function demoSnapshot() {
  const state = demoState();
  const batch = activeBatchOf(state)!;
  const closed = state.batches.find((b) => b.endedAt)!;
  return {
    state,
    batch,
    closed,
    totals: batchTotals(batch),
    closedTotals: batchTotals(closed),
    days: hoursByDay(batch),
    check: latestCheck(batch),
    events: sortedEvents(batch),
    result: engineAdapter.computeStatus(batch),
  };
}
