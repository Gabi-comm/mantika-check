"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft } from "@/components/icons";
import { copy } from "@/vendor/copy";
import { setFlash } from "@/vendor/flash";
import { useOilStatus } from "@/vendor/useOilStatus";
import { InlineNote } from "./status";
import { WarningDialog } from "./WarningDialog";
import { NoBatch, WorkspaceSkeleton } from "./states";

export function FormShell({ title, children, aside, requireBatch = true }: { title: string; lead?: string; children: ReactNode; aside?: ReactNode; requireBatch?: boolean }) {
  const { hydrated, batch, result, state } = useOilStatus();
  return (
    <div className="space-y-5">
      {result?.status.hardRule && <WarningDialog text={result.status.hardRule} />}
      <Link href="/app" className="inline-flex min-h-11 items-center gap-1.5 text-[0.9rem] font-medium text-accent">
        <ArrowLeft className="size-4" aria-hidden="true" /> {copy.actions.back}
      </Link>
      <header className="max-w-2xl">
        {batch && (
          <p className="eyebrow">
            {state?.profile?.stallName} · {batch.label}
          </p>
        )}
        <h1 className="mt-1 text-[1.65rem] font-extrabold text-ink sm:text-[2rem]">{title}</h1>
      </header>
      {!hydrated ? (
        <WorkspaceSkeleton />
      ) : requireBatch && !batch ? (
        <NoBatch hasHistory={!!state?.batches.length} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,42rem)_320px] xl:gap-8">
          <div className="min-w-0">{children}</div>
          {aside && <aside className="min-w-0 space-y-4">{aside}</aside>}
        </div>
      )}
    </div>
  );
}

/** Save then return to the dashboard with a confirmation; surface an error state if storage refused. */
export function useSave() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  return {
    failed,
    run(ok: boolean, message: string, to = "/app") {
      if (!ok) {
        setFailed(true);
        return;
      }
      setFlash(message);
      router.push(to);
    },
  };
}

export function SaveError() {
  return (
    <InlineNote tone="error">
      <b>{copy.states.error}</b> {copy.states.errorDetail}
    </InlineNote>
  );
}

/** Sticky bottom action bar on phones so the primary button stays under the thumb. */
export function SubmitBar({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-20 z-20 -mx-4 mt-5 flex gap-2 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 lg:bottom-0">{children}</div>;
}
