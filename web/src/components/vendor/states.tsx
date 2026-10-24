"use client";

// loading and empty states
import { useState } from "react";
import { CircleCheck, Droplet } from "@/components/icons";
import { copy } from "@/vendor/copy";
import { takeFlash } from "@/vendor/flash";
import { LinkButton, Panel } from "@/components/ui";

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label={copy.states.loading}>
      <div className="skeleton h-9 w-56" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="skeleton h-56" />
        <div className="skeleton h-56" />
      </div>
      <div className="skeleton h-40" />
    </div>
  );
}

export function NoBatch({ hasHistory }: { hasHistory?: boolean }) {
  return (
    <Panel className="dot-grid flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-[var(--radius-m)] border border-line bg-surface text-accent">
        <Droplet className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-ink">{copy.states.emptyTitle}</h2>
      <p className="mt-1 max-w-md text-gray">{copy.states.emptyLead}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <LinkButton href="/app/setup" size="lg">
          {copy.actions.setup}
        </LinkButton>
        {hasHistory && (
          <LinkButton href="/app/history" size="lg" variant="secondary">
            {copy.actions.viewHistory}
          </LinkButton>
        )}
      </div>
    </Panel>
  );
}

export function Flash() {
  const [msg] = useState(takeFlash);
  if (!msg) return null;
  return (
    <p role="status" className="flex items-center gap-2 rounded-[var(--radius-s)] border border-st-continue/30 bg-st-continue-bg px-4 py-2.5 text-[0.92rem] font-medium text-ink">
      <CircleCheck className="size-4 text-st-continue" aria-hidden="true" />
      {msg}
    </p>
  );
}
