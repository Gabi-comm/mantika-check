"use client";

// critical warning notification
import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, X } from "@/components/icons";
import { copy } from "@/vendor/copy";

const DISMISS_KEY = "mantika.warning.dismissed";

export function WarningDialog({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === text;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(!dismissed);
  }, [text]);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, text);
    } catch {}
  }

  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center p-3 sm:justify-end sm:p-5 lg:top-20 lg:px-8">
      <div
        role="alert"
        aria-labelledby="warn-title"
        className="toast-in pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-[var(--radius-l)] border border-st-replace/60 bg-critical text-white shadow-card"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close warning"
          className="absolute top-2 right-2 grid size-10 place-items-center rounded-[var(--radius-s)] text-white/75 transition-colors hover:bg-white/12 hover:text-white"
        >
          <X className="size-[1.1rem]" aria-hidden="true" />
        </button>
        <div className="flex gap-3 p-4 pr-12">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/14">
            <BellRing className="toast-ring size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-white/70">Reminder · reported observation</p>
            <p id="warn-title" className="mt-0.5 font-display font-bold leading-snug">
              {copy.warning.title}
            </p>
            <p className="mt-1 text-[0.88rem] leading-snug text-white/90">{text}</p>
            <Link href="/app/replace" onClick={close} className="mt-3 inline-flex min-h-9 items-center rounded-[var(--radius-s)] border border-white/35 bg-white/15 px-3 text-[0.85rem] font-semibold text-white transition-colors hover:bg-white/25">
              Replace oil
            </Link>
          </div>
        </div>
        <span className="block h-1 bg-st-replace" aria-hidden="true" />
      </div>
    </div>
  );
}
