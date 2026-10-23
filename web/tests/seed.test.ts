import { describe, expect, it } from "vitest";
import { engineAdapter } from "@/vendor/adapter";
import { demoState } from "@/vendor/seed";
import { activeBatchOf } from "@/vendor/selectors";
import type { DemoScenario } from "@/vendor/types";

const EXPECTED: Record<DemoScenario, { action: string; hardRule: boolean }> = {
  keep: { action: "keep", hardRule: false },
  monitor: { action: "monitor", hardRule: false },
  change_soon: { action: "change_soon", hardRule: false },
  change_now: { action: "change_now", hardRule: false },
  warning: { action: "change_now", hardRule: true },
};

describe("demo scenarios through the real engine", () => {
  it.each(Object.entries(EXPECTED) as [DemoScenario, (typeof EXPECTED)[DemoScenario]][])(
    "%s scenario gives its named status",
    (scenario, expected) => {
      const batch = activeBatchOf(demoState(scenario));
      expect(batch).not.toBeNull();
      const { status, source, validation } = engineAdapter.computeStatus(batch!);
      expect(source).toBe("engine");
      expect(validation).toBe("model-estimate");
      expect(status.action).toBe(expected.action);
      expect(Boolean(status.hardRule)).toBe(expected.hardRule);
    },
  );
});
