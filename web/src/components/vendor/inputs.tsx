"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/frontend/format";

export function Fieldset({ legend, hint, children, error }: { legend: string; hint?: string; children: ReactNode; error?: string }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 font-semibold text-ink">{legend}</legend>
      {hint && <p className="-mt-0.5 mb-2 text-[0.82rem] text-gray">{hint}</p>}
      <div className={hint ? "" : "mt-2"}>{children}</div>
      {error && (
        <p className="mt-1.5 text-[0.85rem] font-medium text-st-replace" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Large preset buttons in a row. aria-pressed conveys selection to assistive tech. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
  cols,
}: {
  options: { value: T; label: ReactNode; sub?: ReactNode }[];
  value: T | null;
  onChange: (v: T) => void;
  disabled?: boolean;
  cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex min-h-14 flex-col items-center justify-center rounded-[var(--radius-s)] border px-1 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-45",
              on ? "border-forest bg-forest text-white" : "border-line-strong bg-surface text-ink hover:border-green"
            )}
          >
            <span className="font-display text-[1.15rem] font-bold leading-none">{o.label}</span>
            {o.sub && <span className={cx("mt-1 text-[0.72rem]", on ? "text-mint" : "text-gray")}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ChipToggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "inline-flex min-h-12 items-center gap-1.5 rounded-full border px-4 text-[0.92rem] font-medium transition-colors",
        on ? "border-green bg-tint text-heading" : "border-line-strong bg-surface text-ink hover:border-green"
      )}
    >
      {on && <Check className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function CheckTile({ checked, onToggle, title, desc, critical }: { checked: boolean; onToggle: () => void; title: string; desc: string; critical?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cx(
        "flex min-h-[4.75rem] w-full items-center gap-4 rounded-[var(--radius-m)] border-2 px-4 py-3 text-left transition-colors",
        checked ? (critical ? "border-st-replace bg-st-replace-bg" : "border-green bg-tint") : "border-line bg-surface hover:border-line-strong"
      )}
    >
      <span
        className={cx(
          "grid size-8 shrink-0 place-items-center rounded-[var(--radius-s)] border-2",
          checked ? (critical ? "border-st-replace bg-st-replace text-white" : "border-green bg-green text-white") : "border-line-strong bg-surface"
        )}
        aria-hidden="true"
      >
        {checked && <Check className="size-5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold leading-snug text-ink">{title}</span>
        <span className="mt-0.5 block text-[0.85rem] leading-snug text-gray">{desc}</span>
      </span>
    </button>
  );
}

export function Switch({ id, label, desc, checked, onChange }: { id: string; label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p id={`${id}-l`} className="font-medium text-ink">
          {label}
        </p>
        {desc && (
          <p id={`${id}-d`} className="text-[0.85rem] text-gray">
            {desc}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={desc ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className={cx("relative h-8 w-14 shrink-0 rounded-full transition-colors before:absolute before:-inset-2 before:content-['']", checked ? "bg-green" : "bg-line-strong")}
      >
        <span className={cx("absolute top-1 left-1 grid size-6 place-items-center rounded-full bg-surface shadow-sm transition-transform", checked && "translate-x-6")}>
          {checked && <Check className="size-3.5 text-accent" aria-hidden="true" />}
        </span>
      </button>
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  suffix,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string; error?: string; suffix?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${id}-h`} className="text-[0.82rem] text-gray">
          {hint}
        </p>
      )}
      <div className="relative mt-2">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={[hint && `${id}-h`, error && `${id}-e`].filter(Boolean).join(" ") || undefined}
          className={cx(
            "h-12 w-full rounded-[var(--radius-s)] border bg-surface px-3 text-ink tabular placeholder:text-gray/70",
            suffix && "pr-14",
            error ? "border-st-replace" : "border-line-strong focus:border-green"
          )}
          {...rest}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center font-mono text-[0.85rem] text-gray">{suffix}</span>}
      </div>
      {error && (
        <p id={`${id}-e`} className="mt-1.5 text-[0.85rem] font-medium text-st-replace">
          {error}
        </p>
      )}
    </div>
  );
}

/** Selection card for short option sets (oil type, reasons). */
export function OptionCard({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "relative flex min-h-14 flex-col items-start justify-center rounded-[var(--radius-s)] border px-3.5 py-2.5 text-left transition-colors",
        on ? "border-green bg-tint ring-1 ring-green" : "border-line-strong bg-surface hover:border-green"
      )}
    >
      <span className={cx("pr-6 text-[0.94rem] font-semibold", on ? "text-heading" : "text-ink")}>{title}</span>
      {sub && <span className="text-[0.75rem] text-gray">{sub}</span>}
      <span className={cx("absolute top-1/2 right-3 grid size-5 -translate-y-1/2 place-items-center rounded-full border", on ? "border-green bg-green text-white" : "border-line-strong")} aria-hidden="true">
        {on && <Check className="size-3.5" />}
      </span>
    </button>
  );
}
