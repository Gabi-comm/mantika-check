"use client";

import { useState } from "react";
import type { FoodId, Heat } from "@/vendor/types";
import { copy, HOUR_PRESETS } from "@/vendor/copy";
import { addEvent } from "@/vendor/store";
import { useOilStatus } from "@/vendor/useOilStatus";
import { Button, Panel } from "@/components/ui";
import { ChipToggle, Fieldset, Segmented, TextField } from "@/components/vendor/inputs";
import { FormShell, SaveError, SubmitBar, useSave } from "@/components/vendor/FormShell";
import { Timeline } from "@/components/vendor/timeline";
import { sortedEvents } from "@/vendor/selectors";

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function LogPage() {
  const { batch, totals } = useOilStatus();
  const [hours, setHours] = useState<number | null>(null);
  const [heat, setHeat] = useState<Heat | null>(null);
  const [foods, setFoods] = useState<FoodId[]>([]);
  const [temp, setTemp] = useState("");
  const [customTime, setCustomTime] = useState(false);
  const [when, setWhen] = useState("");
  const save = useSave();
  const [now] = useState(() => new Date());

  const tempC = temp.trim() === "" ? undefined : Number(temp);
  const tempErr = tempC !== undefined && (!Number.isFinite(tempC) || tempC < 100 || tempC > 230) ? copy.log.tempError : undefined;
  const whenIso = customTime && when ? new Date(when).toISOString() : undefined;
  const whenErr = customTime && when && batch && whenIso! < batch.startedAt ? "Session time cannot be before the batch started." : customTime && when && new Date(when) > now ? "Session time cannot be in the future." : undefined;
  const ready = !!hours && !!heat && !tempErr && !whenErr;

  const recentSessions = batch ? sortedEvents(batch).filter((e) => e.kind === "session").slice(0, 3) : [];

  return (
    <FormShell
      title={copy.log.title}
      lead={copy.log.lead}
      aside={
        batch && (
          <Panel aria-label="This batch so far" className="p-5">
            <p className="eyebrow">This batch so far</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink tabular">
              {totals.hours} h <span className="text-base font-medium text-gray">· {totals.sessions} sessions</span>
            </p>
            {hours && <p className="mt-1 text-[0.88rem] text-green">After saving: {totals.hours + hours} h</p>}
            <div className="-mx-5 mt-3 border-t border-line">
              <Timeline events={recentSessions} dense />
            </div>
          </Panel>
        )
      }
    >
      <Panel className="space-y-7 p-5 sm:p-6">
        <Fieldset legend={copy.log.duration}>
          <Segmented options={HOUR_PRESETS.map((h) => ({ value: h, label: h === 5 ? "5+" : String(h), sub: h === 1 ? "hour" : "hours" }))} value={hours} onChange={setHours} />
        </Fieldset>
        <Fieldset legend={copy.log.heat}>
          <Segmented options={(["low", "medium", "high"] as Heat[]).map((h) => ({ value: h, label: copy.heat[h], sub: copy.heatHint[h] }))} value={heat} onChange={setHeat} />
          <p className="mt-2 text-[0.78rem] text-gray">{copy.heatHintNote}</p>
        </Fieldset>
        <Fieldset legend={copy.log.foods} hint={copy.log.foodsHint}>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(copy.foods) as FoodId[]).map((f) => (
              <ChipToggle key={f} on={foods.includes(f)} onClick={() => setFoods((v) => (v.includes(f) ? v.filter((x) => x !== f) : [...v, f]))}>
                {copy.foods[f]}
              </ChipToggle>
            ))}
          </div>
        </Fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="temp" label={copy.log.temp} hint={copy.log.tempHint} inputMode="decimal" placeholder="e.g. 175" suffix="°C" value={temp} onChange={(e) => setTemp(e.target.value)} error={tempErr} />
          <div>
            <p className="font-semibold text-ink">{copy.log.when}</p>
            <p className="text-[0.82rem] text-gray">Defaults to the moment you save.</p>
            {customTime ? (
              <div className="mt-2">
                <label htmlFor="when" className="sr-only">
                  Session date and time
                </label>
                <input id="when" type="datetime-local" className="h-12 w-full rounded-[var(--radius-s)] border border-line-strong bg-white px-3" value={when} max={toLocalInput(now)} onChange={(e) => setWhen(e.target.value)} />
                {whenErr && <p className="mt-1.5 text-[0.85rem] font-medium text-st-replace">{whenErr}</p>}
              </div>
            ) : (
              <Button
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => {
                  setCustomTime(true);
                  setWhen(toLocalInput(new Date()));
                }}
              >
                {copy.log.whenNow} · change
              </Button>
            )}
          </div>
        </div>
      </Panel>
      {save.failed && (
        <div className="mt-4">
          <SaveError />
        </div>
      )}
      <SubmitBar>
        <Button size="lg" className="flex-1 sm:flex-none sm:px-10" disabled={!ready} onClick={() => save.run(addEvent({ kind: "session", hours: hours!, heat: heat!, foods, tempC, at: whenIso }), copy.log.saved)}>
          {copy.actions.saveSession}
        </Button>
      </SubmitBar>
    </FormShell>
  );
}
