"use client";

import { useState } from "react";
import type { HeatSource, OilType } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { startBatch } from "@/vendor/store";
import { useOilStatus } from "@/vendor/useOilStatus";
import { Button, Panel } from "@/components/ui";
import { Fieldset, OptionCard, Segmented, TextField } from "@/components/vendor/inputs";
import { InlineNote } from "@/components/vendor/status";
import { FormShell, SaveError, SubmitBar, useSave } from "@/components/vendor/FormShell";

const today = () => new Date().toLocaleDateString("en-CA");

export default function SetupPage() {
  const { state, batch } = useOilStatus();
  const prev = state?.setup;
  const [stall, setStall] = useState<string | null>(null);
  const [oil, setOil] = useState<OilType | null>(null);
  const [vol, setVol] = useState<string | null>(null);
  const [src, setSrc] = useState<HeatSource | null>(null);
  const [cost, setCost] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const save = useSave();

  const v = {
    stall: stall ?? (state?.profile?.origin === "user" ? state.profile.stallName : ""),
    oil: oil ?? prev?.oilType ?? null,
    vol: vol ?? String(prev?.volumeL ?? 3),
    src: src ?? prev?.heatSource ?? "lpg",
    date: date ?? today(),
  };
  const volume = Number(v.vol);
  const volErr = !Number.isFinite(volume) || volume < 0.5 || volume > 30 || v.vol.trim() === "" ? copy.setup.volumeError : undefined;
  const costS = cost ?? (prev?.pricePerL ? String(prev.pricePerL) : "");
  const costN = costS.trim() === "" ? undefined : Number(costS);
  const costErr = costN !== undefined && (!Number.isFinite(costN) || costN <= 0) ? copy.setup.costError : undefined;
  const dateErr = v.date > today() ? "Start date cannot be in the future." : undefined;
  const oilErr = !v.oil ? copy.setup.oilRequired : undefined;
  const ready = !volErr && !costErr && !dateErr && !oilErr;

  function submit() {
    setTried(true);
    if (!ready || !v.oil) return;
    const startedAt = v.date === today() ? new Date().toISOString() : new Date(`${v.date}T07:00:00`).toISOString();
    save.run(startBatch({ oilType: v.oil, volumeL: volume, heatSource: v.src, pricePerL: costN }, v.stall, startedAt), copy.setup.saved);
  }

  return (
    <FormShell title={copy.setup.title} lead={copy.setup.lead} requireBatch={false} aside={batch && <InlineNote tone="warn">{copy.setup.replaceNotice}</InlineNote>}>
      <Panel className="space-y-7 p-5 sm:p-6">
        <TextField id="stall" label={copy.setup.stall} hint={copy.setup.stallHint} placeholder="My stall" maxLength={40} value={v.stall} onChange={(e) => setStall(e.target.value)} />
        <Fieldset legend={`${copy.setup.oilType} (required)`} error={tried ? oilErr : undefined}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(copy.oilTypes) as OilType[]).map((o) => (
              <OptionCard key={o} on={v.oil === o} onClick={() => setOil(o)} title={copy.oilTypes[o]} />
            ))}
          </div>
        </Fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="vol" label={copy.setup.volume} inputMode="decimal" suffix="L" value={v.vol} onChange={(e) => setVol(e.target.value)} error={vol !== null ? volErr : undefined} />
          <TextField id="cost" label={copy.setup.cost} hint={copy.setup.costHint} inputMode="decimal" suffix="PHP/L" placeholder="e.g. 98" value={costS} onChange={(e) => setCost(e.target.value)} error={costErr} />
        </div>
        <Fieldset legend={copy.setup.heatSource}>
          <Segmented options={(Object.keys(copy.heatSources) as HeatSource[]).map((h) => ({ value: h, label: copy.heatSources[h] }))} value={v.src} onChange={setSrc} />
        </Fieldset>
        <TextField id="date" type="date" label={copy.setup.date} max={today()} value={v.date} onChange={(e) => setDate(e.target.value)} error={dateErr} />
      </Panel>
      {save.failed && (
        <div className="mt-4">
          <SaveError />
        </div>
      )}
      <SubmitBar>
        <Button size="lg" className="flex-1 sm:flex-none sm:px-10" disabled={!!volErr || !!costErr || !!dateErr} onClick={submit}>
          {copy.actions.setup}
        </Button>
      </SubmitBar>
    </FormShell>
  );
}
