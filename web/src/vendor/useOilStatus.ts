"use client";

// react hooks for the workspace data and the oil status
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AdviceResult, StatusResult, VendorState } from "./types";
import { ACTIVE_ADAPTER, templateAdvice } from "./adapter";
import { vendorStore } from "./store";
import { activeBatchOf, batchTotals } from "./selectors";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

export function useVendorState(): VendorState | null {
  return useSyncExternalStore(vendorStore.subscribe, vendorStore.getSnapshot, vendorStore.getServerSnapshot);
}

export function useOilStatus() {
  const state = useVendorState();
  const online = useOnline();
  const batch = state ? activeBatchOf(state) : null;

  const result: StatusResult | null = useMemo(
    () => (batch ? ACTIVE_ADAPTER.computeStatus(batch) : null),
    [batch]
  );
  const key = result && batch ? `${result.source}|${batch.id}|${batch.events.length}|${result.status.action}|${result.status.hardRule ?? ""}|${online}` : "none";
  const [advice, setAdvice] = useState<{ key: string; value: AdviceResult } | null>(null);

  useEffect(() => {
    if (!result) return;
    let live = true;
    ACTIVE_ADAPTER.getAdvice(result, { online })
      .catch((): AdviceResult => ({ advice: templateAdvice(result), delivery: "error-template" }))
      .then((value) => {
        if (live) setAdvice({ key, value });
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const ready = advice?.key === key;
  return {
    hydrated: state !== null,
    state,
    online,
    batch,
    totals: batchTotals(batch),
    result,
    advice: result ? (ready ? advice!.value : ({ advice: templateAdvice(result), delivery: "template" } satisfies AdviceResult)) : null,
    adviceLoading: !!result && !ready,
  };
}
