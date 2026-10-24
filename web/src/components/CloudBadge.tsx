"use client";

import { Cloud, CloudOff, Loader2 } from "./icons";
import { useCloud } from "@/vendor/sync";
import { cx } from "@/frontend/format";
import Link from "next/link";

const LABEL = { loading: "Syncing", saving: "Saving", synced: "Saved to account", offline: "Offline, saved here", error: "Sync paused" } as const;

/** Small account sync indicator for the workspace toolbar. Hidden when Supabase isn't set up or nobody is signed in. */
export function CloudBadge({ className }: { className?: string }) {
  const { status } = useCloud();
  if (status === "local" || status === "signed-out") return null;
  const Icon = status === "loading" || status === "saving" ? Loader2 : status === "synced" ? Cloud : CloudOff;
  return (
    <Link
      href="/app/settings#account"
      title={LABEL[status]}
      className={cx(
        "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-s)] border border-line px-3 text-[0.82rem] font-semibold transition-colors hover:border-green",
        status === "error" || status === "offline" ? "text-st-monitor" : "text-gray",
        className
      )}
    >
      <Icon className={cx("size-4", (status === "loading" || status === "saving") && "animate-spin")} aria-hidden="true" />
      <span className="hidden xl:inline">{LABEL[status]}</span>
      <span className="sr-only xl:hidden">{LABEL[status]}</span>
    </Link>
  );
}
