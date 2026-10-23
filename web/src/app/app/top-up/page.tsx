"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { copy, TOPUP_PRESETS } from "@/vendor/copy";
import { addEvent } from "@/vendor/store";
import { useOilStatus } from "@/vendor/useOilStatus";
import { Button, LinkButton, Panel, Tag } from "@/components/ui";
import { Fieldset, Segmented } from "@/components/vendor/inputs";
import { FormShell, SaveError, SubmitBar, useSave } from "@/components/vendor/FormShell";
import { fmtLitres } from "@/frontend/format";

export default function TopUpPage() {
  const { batch, totals, result } = useOilStatus();
  const [litres, setLitres] = useState<number | null>(null);
  const save = useSave();
  const blocked = !!result?.status.noTopUp;

  return (
    <FormShell
      title={copy.topUp.title}
      lead={copy.topUp.lead}
      aside={
        batch && (
          <Panel className="p-5">
            <p className="eyebrow">Volume in this batch</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink tabular">{fmtLitres(batch.volumeL + totals.topupLitres)}</p>
            <p className="text-[0.88rem] text-gray">
              {fmtLitres(batch.volumeL)} at start · {totals.topups} top-up{totals.topups === 1 ? "" : "s"} ({fmtLitres(totals.topupLitres)})
            </p>
          </Panel>
        )
      }
    >
      {blocked && result && (
        <div role="alert" className="mb-5 flex gap-3 rounded-[var(--radius-m)] border-2 border-st-replace bg-st-replace-bg p-4 text-st-replace">
          <Ban className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-display text-lg font-bold">{copy.topUp.blockedTitle}</p>
            <p className="text-ink">{copy.topUp.blocked}</p>
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.8rem] text-gray">
              Restriction from <Tag tone="outline">{copy.source[result.source]}</Tag> · status: {copy.status[result.status.action]}
            </p>
          </div>
        </div>
      )}
      <Panel className="p-5 sm:p-6">
        <Fieldset legend={copy.topUp.amount}>
          <Segmented options={TOPUP_PRESETS.map((l) => ({ value: l, label: fmtLitres(l) }))} value={litres} onChange={setLitres} disabled={blocked} />
        </Fieldset>
      </Panel>
      {save.failed && (
        <div className="mt-4">
          <SaveError />
        </div>
      )}
      <SubmitBar>
        <Button size="lg" className="flex-1 sm:flex-none sm:px-10" disabled={blocked || !litres} onClick={() => save.run(addEvent({ kind: "topup", litres: litres! }), copy.topUp.saved)}>
          {copy.actions.saveTopUp}
        </Button>
        {blocked && (
          <LinkButton href="/app/replace" variant="secondary" size="lg" className="flex-1 sm:flex-none">
            {copy.actions.replace}
          </LinkButton>
        )}
      </SubmitBar>
    </FormShell>
  );
}
