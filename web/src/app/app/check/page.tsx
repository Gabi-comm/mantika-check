"use client";

import { useState } from "react";
import type { Sign } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { addEvent } from "@/vendor/store";
import { useOilStatus } from "@/vendor/useOilStatus";
import { latestCheck } from "@/vendor/selectors";
import { Button, Panel } from "@/components/ui";
import { CheckTile, Switch } from "@/components/vendor/inputs";
import { InlineNote } from "@/components/vendor/status";
import { FormShell, SaveError, SubmitBar, useSave } from "@/components/vendor/FormShell";
import { eventDetail } from "@/components/vendor/timeline";
import { fmtDateTime } from "@/frontend/format";

const SIGNS = Object.keys(copy.signs) as Sign[];

export default function CheckPage() {
  const { batch } = useOilStatus();
  const [signs, setSigns] = useState<Sign[]>([]);
  const [filtered, setFiltered] = useState(false);
  const [covered, setCovered] = useState(false);
  const save = useSave();
  const prev = latestCheck(batch);
  const toggle = (s: Sign) => setSigns((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]));

  return (
    <FormShell
      title={copy.check.title}
      lead={copy.check.lead}
      aside={
        <>
          <InlineNote>{copy.check.note}</InlineNote>
          {prev && (
            <Panel className="p-5">
              <p className="eyebrow">Previous check</p>
              <p className="mt-1 font-mono text-[0.8rem] text-gray">{fmtDateTime(prev.at)}</p>
              <p className="mt-1 text-[0.92rem] text-ink">{eventDetail(prev)}</p>
            </Panel>
          )}
        </>
      }
    >
      <div role="group" aria-label="Warning signs" className="grid gap-2.5 md:grid-cols-2">
        {SIGNS.map((s) => (
          <CheckTile key={s} checked={signs.includes(s)} onToggle={() => toggle(s)} title={copy.signs[s].title} desc={copy.signs[s].desc} critical />
        ))}
      </div>
      {signs.length > 0 && (
        <div className="mt-3">
          <InlineNote tone="error">{copy.check.signConfirm}</InlineNote>
        </div>
      )}
      <Panel className="mt-5 divide-y divide-line px-5">
        <p className="pt-4 pb-1 font-semibold text-ink">{copy.check.habits}</p>
        <Switch id="filtered" label={copy.check.filtered} checked={filtered} onChange={setFiltered} />
        <Switch id="covered" label={copy.check.covered} checked={covered} onChange={setCovered} />
      </Panel>
      {save.failed && (
        <div className="mt-4">
          <SaveError />
        </div>
      )}
      <SubmitBar>
        <Button size="lg" className="flex-1 sm:flex-none sm:px-10" onClick={() => save.run(addEvent({ kind: "check", signs, filtered, covered }), copy.check.saved)}>
          {copy.actions.saveCheck}
        </Button>
      </SubmitBar>
    </FormShell>
  );
}
