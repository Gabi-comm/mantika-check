"use client";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-[var(--radius-m)] border border-st-replace/40 bg-st-replace-bg p-6">
      <h1 className="text-xl font-bold text-st-replace">Something went wrong on this screen.</h1>
      <p className="mt-1 text-ink">Your saved records are not affected. Try again, or return to the dashboard.</p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={reset} className="min-h-11 rounded-[6px] bg-green px-4 font-semibold text-white">Try again</button>
        <a href="/app" className="inline-flex min-h-11 items-center font-semibold text-accent">Dashboard</a>
      </div>
    </div>
  );
}
