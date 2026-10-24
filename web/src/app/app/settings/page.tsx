"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, FlaskConical, ArrowRight, Cloud, CloudOff, LogIn, LogOut, Loader2 } from "@/components/icons";
import type { DemoScenario } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { loadDemoScenario, removeDemoRecords, resetDemo } from "@/vendor/store";
import { clearEverywhere, useCloud, type CloudState } from "@/vendor/sync";
import { signOut } from "@/frontend/auth";
import { btn } from "@/components/ui";
import { useVendorState } from "@/vendor/useOilStatus";
import { Button, Panel, PanelHead, PageHeader } from "@/components/ui";
import { InlineNote } from "@/components/vendor/status";
import { WorkspaceSkeleton } from "@/components/vendor/states";
import { cx } from "@/frontend/format";

const SCENARIOS = Object.entries(copy.demo.scenarios) as [DemoScenario, string][];

const SYNC_TEXT: Record<CloudState["status"], string> = {
  local: "",
  "signed-out": "",
  loading: "Loading your account…",
  saving: "Saving changes…",
  synced: "All changes saved to your account.",
  offline: "You're offline. Changes are kept on this phone and saved when you reconnect.",
  error: "Couldn't reach your account. Changes are kept on this phone; we'll retry.",
};

function AccountPanel() {
  const cloud = useCloud();
  const [busy, setBusy] = useState(false);
  const signedIn = cloud.email !== null;
  const SyncIcon = cloud.status === "offline" || cloud.status === "error" ? CloudOff : cloud.status === "synced" ? Cloud : Loader2;
  return (
    <Panel aria-labelledby="account-h" id="account" className="xl:col-span-2">
      <PanelHead id="account-h" title="Account" eyebrow="Sign-in and sync" action={<Cloud className="size-5 text-teal" aria-hidden="true" />} />
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        {cloud.status === "local" ? (
          <p className="text-[0.92rem] text-gray">Accounts aren&apos;t switched on for this app yet. Everything you log stays on this device.</p>
        ) : signedIn ? (
          <>
            <div className="min-w-0">
              <p className="font-semibold text-ink">{cloud.username ? `@${cloud.username}` : cloud.email}</p>
              {cloud.username && <p className="text-[0.85rem] text-gray">{cloud.email}</p>}
              <p className="mt-2 flex items-center gap-2 text-[0.85rem] text-gray" role="status">
                <SyncIcon className={cx("size-4 shrink-0", (cloud.status === "loading" || cloud.status === "saving") && "animate-spin")} aria-hidden="true" />
                {SYNC_TEXT[cloud.status]}
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await signOut();
                setBusy(false);
              }}
            >
              <LogOut className="size-4" aria-hidden="true" /> Sign out
            </Button>
          </>
        ) : (
          <>
            <p className="max-w-prose text-[0.92rem] text-gray">Sign in to save your batches to an account, so they&apos;re safe if this phone is lost and open on any device.</p>
            <Link href="/#signin" className={btn("primary")}>
              <LogIn className="size-4" aria-hidden="true" /> Sign in
            </Link>
          </>
        )}
      </div>
    </Panel>
  );
}

export default function SettingsPage() {
  const state = useVendorState();
  const signedIn = useCloud().email !== null;
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const run = (ok: boolean, text: string) => setMsg(ok ? { text, ok } : { text: `${copy.states.error} ${copy.states.errorDetail}`, ok: false });

  if (!state) return <WorkspaceSkeleton />;
  const demoBatches = state.batches.filter((b) => b.origin === "demo").length;
  const userEvents = state.batches.reduce((a, b) => a + b.events.filter((e) => e.origin === "user").length, 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Preferences" title="Settings" />
      {msg && <InlineNote tone={msg.ok ? "ok" : "error"}>{msg.text}</InlineNote>}

      <div className="grid gap-5 xl:grid-cols-2">
        <AccountPanel />

        <Panel aria-labelledby="demo-h">
          <PanelHead id="demo-h" title="Demo mode" eyebrow="Demonstration" action={<FlaskConical className="size-5 text-teal" aria-hidden="true" />} />
          <div className="space-y-4 p-5">
            <div>
              <p className="font-medium text-ink" id="scn-l">
                Demo scenario
              </p>
              <p className="mb-2 text-[0.85rem] text-gray">
                Loads a complete, consistent fictional dataset (batch, sessions, checks and history) that produces this state. Replaces all data on this device.
                {signedIn && " Your account isn't changed; reload the page to bring your own records back."}
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
                        : "min-h-12 rounded-[var(--radius-s)] border border-line-strong bg-surface px-3 text-left text-[0.88rem] font-medium text-ink hover:border-green"
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
                  <p className="text-[0.92rem] font-medium text-st-replace">
                    {signedIn ? "Delete every batch and event on this device and in your account? This cannot be undone." : "Delete every batch, event and profile on this device? This cannot be undone."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      onClick={async () => {
                        run(await clearEverywhere(), copy.demo.clearDone);
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
      </div>

      <div className="flex flex-wrap gap-4 lg:hidden">
        <Link href="/app/about" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent">
          {copy.nav.about} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link href="/app/experimental/color" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent">
          {copy.nav.experimental} (experimental) <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
