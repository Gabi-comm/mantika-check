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
        prev && (
          <Panel className="p-5">
            <p className="eyebrow">Previous check</p>
            <p className="mt-1 font-mono text-[0.8rem] text-gray">{fmtDateTime(prev.at)}</p>
            <p className="mt-2 text-[0.92rem] leading-snug text-ink">{eventDetail(prev)}</p>
          </Panel>
        )
      }
    >
      <section aria-labelledby="signs-h">
        <h2 id="signs-h" className="text-[1.05rem] font-bold text-ink">
          {copy.check.signsTitle}
        </h2>
        <p className="mt-0.5 mb-3 text-[0.92rem] text-gray">{copy.check.lead}</p>
        <div role="group" aria-labelledby="signs-h" className="grid gap-2.5 sm:grid-cols-2">
          {SIGNS.map((s) => (
            <CheckTile key={s} checked={signs.includes(s)} onToggle={() => toggle(s)} title={copy.signs[s].title} desc={copy.signs[s].desc} critical />
          ))}
        </div>
        {signs.length > 0 && (
          <div className="fade-up mt-3">
            <InlineNote tone="error">{copy.check.signConfirm}</InlineNote>
          </div>
        )}
      </section>
      <section aria-labelledby="habits-h" className="mt-7">
        <h2 id="habits-h" className="mb-3 text-[1.05rem] font-bold text-ink">
          {copy.check.habits}
        </h2>
        <Panel className="divide-y divide-line px-5">
          <Switch id="filtered" label={copy.check.filtered} checked={filtered} onChange={setFiltered} />
          <Switch id="covered" label={copy.check.covered} checked={covered} onChange={setCovered} />
        </Panel>
      </section>
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
