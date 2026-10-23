"use client";

import { useState } from "react";
import type { ChangeReason } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { replaceOil } from "@/vendor/store";
import { useOilStatus } from "@/vendor/useOilStatus";
import { Button, Panel } from "@/components/ui";
import { ChipToggle, Fieldset, TextField } from "@/components/vendor/inputs";
import { FormShell, SaveError, SubmitBar, useSave } from "@/components/vendor/FormShell";
import { fmtDate, fmtLitres } from "@/frontend/format";

export default function ReplacePage() {
  const { batch, totals, state } = useOilStatus();
  const [reason, setReason] = useState<ChangeReason | null>(null);
  const [vol, setVol] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const save = useSave();
  const volume = vol ?? String(state?.setup?.volumeL ?? batch?.volumeL ?? "");
  const n = Number(volume);
  const volErr = volume.trim() !== "" && (!Number.isFinite(n) || n < 0.5 || n > 30) ? copy.setup.volumeError : undefined;
  const ready = !!reason && volume.trim() !== "" && !volErr;

  return (
    <FormShell
      title={copy.replace.title}
      lead={copy.replace.lead}
      aside={
        batch && (
          <Panel className="p-5">
            <p className="eyebrow">Closing {batch.label}</p>
            <dl className="mt-2 space-y-1.5 text-[0.92rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-gray">Started</dt>
                <dd className="text-ink">{fmtDate(batch.startedAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray">Frying time</dt>
                <dd className="font-mono text-ink">{totals.hours} h</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray">Sessions</dt>
                <dd className="font-mono text-ink">{totals.sessions}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray">Top-ups</dt>
                <dd className="font-mono text-ink">{fmtLitres(totals.topupLitres)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.82rem] text-gray">This batch and all its records stay in History.</p>
          </Panel>
        )
      }
    >
      <Panel className="space-y-7 p-5 sm:p-6">
        <Fieldset legend={copy.replace.reason}>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(copy.reasons) as ChangeReason[]).map((r) => (
              <ChipToggle key={r} on={reason === r} onClick={() => setReason(r)}>
                {copy.reasons[r]}
              </ChipToggle>
            ))}
          </div>
        </Fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="newvol" label={copy.replace.newVolume} inputMode="decimal" suffix="L" value={volume} onChange={(e) => setVol(e.target.value)} error={volErr} />
          <TextField id="note" label={copy.replace.note} hint={copy.replace.noteHint} maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </Panel>
      {save.failed && (
        <div className="mt-4">
          <SaveError />
        </div>
      )}
      <SubmitBar>
        <Button size="lg" className="flex-1 sm:flex-none sm:px-8" disabled={!ready} onClick={() => save.run(replaceOil(reason!, n, note.trim() || undefined), copy.replace.saved)}>
          {copy.actions.confirmReplace}
        </Button>
      </SubmitBar>
    </FormShell>
  );
}
