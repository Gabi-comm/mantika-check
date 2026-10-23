"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Accessibility, FlaskConical, HardDrive, ArrowRight } from "lucide-react";
import type { DemoScenario } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { clearAll, loadDemoScenario, removeDemoRecords, resetDemo } from "@/vendor/store";
import { useVendorState } from "@/vendor/useOilStatus";
import { useSettings, type TextSize } from "@/frontend/settings";
import { Button, Panel, PanelHead, PageHeader, Tag } from "@/components/ui";
import { Segmented, Switch } from "@/components/vendor/inputs";
import { InlineNote } from "@/components/vendor/status";
import { WorkspaceSkeleton } from "@/components/vendor/states";

const SCENARIOS = Object.entries(copy.demo.scenarios) as [DemoScenario, string][];

export default function SettingsPage() {
  const state = useVendorState();
  const { settings, update } = useSettings();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const run = (ok: boolean, text: string) => setMsg(ok ? { text, ok } : { text: `${copy.states.error} ${copy.states.errorDetail}`, ok: false });

  if (!state) return <WorkspaceSkeleton />;
  const demoBatches = state.batches.filter((b) => b.origin === "demo").length;
  const userEvents = state.batches.reduce((a, b) => a + b.events.filter((e) => e.origin === "user").length, 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Preferences" title="Settings" lead="Display preferences, demo controls and the data stored on this device." />
      {msg && <InlineNote tone={msg.ok ? "ok" : "error"}>{msg.text}</InlineNote>}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel aria-labelledby="acc-h">
          <PanelHead id="acc-h" title="Accessibility" eyebrow="Display" action={<Accessibility className="size-5 text-teal" aria-hidden="true" />} />
          <div className="divide-y divide-line px-5">
            <Switch id="motion" label="Reduce motion" desc="Turns off animated transitions and loading pulses." checked={settings.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
            <Switch id="contrast" label="Higher contrast" desc="Darkens secondary text and borders." checked={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
            <div className="py-4">
              <p className="font-medium text-ink" id="text-l">
                Text size
              </p>
              <p className="mb-2 text-[0.85rem] text-gray">Scales all text and controls in the workspace and website.</p>
              <div role="group" aria-labelledby="text-l">
                <Segmented<TextSize>
                  options={[
                    { value: "normal", label: "A", sub: "Default" },
                    { value: "large", label: <span className="text-[1.3rem]">A</span>, sub: "Large" },
                    { value: "xlarge", label: <span className="text-[1.5rem]">A</span>, sub: "Extra large" },
                  ]}
                  value={settings.textSize}
                  onChange={(v) => update({ textSize: v })}
                />
              </div>
            </div>
          </div>
        </Panel>

        <Panel aria-labelledby="demo-h">
          <PanelHead id="demo-h" title="Demo mode" eyebrow="Demonstration" action={<FlaskConical className="size-5 text-teal" aria-hidden="true" />} />
          <div className="space-y-4 p-5">
            <div>
              <p className="font-medium text-ink" id="scn-l">
                Demo scenario
              </p>
              <p className="mb-2 text-[0.85rem] text-gray">
                Loads a complete, consistent fictional dataset (batch, sessions, checks and history) that produces this state. Replaces all data on this device.
              </p>
              <div role="radiogroup" aria-labelledby="scn-l" className="grid gap-2 sm:grid-cols-2">
                {SCENARIOS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={state.demoScenario === value}
                    onClick={() => run(loadDemoScenario(value), `Loaded demo scenario: ${label}.`)}
                    className={
                      state.demoScenario === value
                        ? "min-h-12 rounded-[var(--radius-s)] border border-forest bg-forest px-3 text-left text-[0.88rem] font-semibold text-white"
                        : "min-h-12 rounded-[var(--radius-s)] border border-line-strong bg-white px-3 text-left text-[0.88rem] font-medium text-ink hover:border-green"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button variant="secondary" onClick={() => run(resetDemo(), copy.demo.resetDone)}>
                {copy.demo.reset}
              </Button>
              <Button variant="secondary" disabled={!demoBatches} onClick={() => run(removeDemoRecords(), copy.demo.removeDone)}>
                {copy.demo.removeDemo}
              </Button>
            </div>
            <p className="text-[0.82rem] text-gray">Reset loads the default demo scenario (Monitor Closely) and replaces everything on this device, including your own entries.</p>
          </div>
        </Panel>

        <Panel aria-labelledby="data-h" id="data">
          <PanelHead id="data-h" title="Data on this device" eyebrow="Data management" action={<Database className="size-5 text-teal" aria-hidden="true" />} />
          <div className="p-5">
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-[0.78rem] text-gray">Batches</dt>
                <dd className="font-display text-xl font-bold tabular">{state.batches.length}</dd>
              </div>
              <div>
                <dt className="text-[0.78rem] text-gray">Demo batches</dt>
                <dd className="font-display text-xl font-bold tabular">{demoBatches}</dd>
              </div>
              <div>
                <dt className="text-[0.78rem] text-gray">Your entries</dt>
                <dd className="font-display text-xl font-bold tabular">{userEvents}</dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-line pt-4">
              {confirmClear ? (
                <div className="space-y-3">
                  <p className="text-[0.92rem] font-medium text-st-replace">Delete every batch, event and profile on this device? This cannot be undone.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      onClick={() => {
                        run(clearAll(), copy.demo.clearDone);
                        setConfirmClear(false);
                      }}
                    >
                      Yes, delete all data
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                      {copy.actions.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setConfirmClear(true)}>
                  {copy.demo.clearAll}
                </Button>
              )}
            </div>
          </div>
        </Panel>

        <Panel aria-labelledby="store-h">
          <PanelHead id="store-h" title="Local storage disclosure" eyebrow="Privacy" action={<HardDrive className="size-5 text-teal" aria-hidden="true" />} />
          <div className="space-y-2 p-5 text-[0.92rem] text-ink/85">
            <p>All records and preferences are stored in this browser&apos;s local storage. Nothing is sent to a server, and there is no account.</p>
            <p>Clearing browser data, using a private window or switching devices will remove or hide your records.</p>
            <p className="flex flex-wrap gap-1.5 pt-1">
              <Tag tone="outline">mantika.web.v2</Tag>
              <Tag tone="outline">mantika.settings.v2</Tag>
              <Tag tone="outline">mantika.history</Tag>
            </p>
          </div>
        </Panel>
      </div>

      <div className="flex flex-wrap gap-4 lg:hidden">
        <Link href="/app/about" className="inline-flex min-h-11 items-center gap-1 font-medium text-green">
          {copy.nav.about} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link href="/app/experimental/color" className="inline-flex min-h-11 items-center gap-1 font-medium text-green">
          {copy.nav.experimental} (experimental) <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
