import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-s)] font-semibold whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-45";
const variants: Record<Variant, string> = {
  primary: "bg-green text-white hover:bg-forest active:bg-forest",
  secondary: "border border-line-strong bg-white text-ink hover:border-green hover:text-green",
  ghost: "text-green hover:bg-pale",
  danger: "border border-st-replace/40 bg-white text-st-replace hover:bg-st-replace-bg",
  inverse: "bg-white text-forest hover:bg-mint",
};
const sizes: Record<Size, string> = { md: "min-h-11 px-4 text-[0.92rem]", lg: "min-h-12 px-5 text-[0.98rem]" };

export const btn = (variant: Variant = "primary", size: Size = "md", extra?: string) => cx(base, variants[variant], sizes[size], extra);

export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={btn(variant, size, className)} {...rest} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; size?: Size }) {
  return <Link href={href} className={btn(variant, size, className)} {...rest} />;
}

/** Bordered surface. Square-ish corners keep it instrument-like rather than bubbly. */
export function Panel({ children, className, as: As = "section", ...rest }: HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "aside" }) {
  return (
    <As className={cx("rounded-[var(--radius-m)] border border-line bg-white", className)} {...rest}>
      {children}
    </As>
  );
}

export function PanelHead({ title, eyebrow, action, id }: { title: ReactNode; eyebrow?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
        <h2 id={id} className="text-[1.02rem] font-bold text-ink">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "green" | "amber" | "orange" | "red" | "ink" | "outline";
const tones: Record<Tone, string> = {
  neutral: "bg-pale text-teal",
  green: "bg-st-continue-bg text-st-continue",
  amber: "bg-st-monitor-bg text-st-monitor",
  orange: "bg-st-recommend-bg text-st-recommend",
  red: "bg-st-replace-bg text-st-replace",
  ink: "bg-ink text-white",
  outline: "border border-line-strong text-gray",
};
export function Tag({ children, tone = "neutral", className, title }: { children: ReactNode; tone?: Tone; className?: string; title?: string }) {
  return (
    <span title={title} className={cx("inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em]", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Metric({ label, value, unit, note }: { label: string; value: ReactNode; unit?: string; note?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.78rem] font-medium text-gray">{label}</dt>
      <dd className="mt-0.5 font-display text-[1.55rem] font-bold leading-none tracking-tight text-ink tabular">
        {value}
        {unit && <span className="ml-1 font-sans text-[0.85rem] font-semibold text-gray">{unit}</span>}
      </dd>
      {note && <dd className="mt-1 text-[0.78rem] text-gray">{note}</dd>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow?: ReactNode; title: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="text-[1.75rem] font-extrabold text-ink sm:text-[2.1rem]">{title}</h1>
        {lead && <p className="mt-1.5 text-gray">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mb-2.5 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-teal">{children}</h2>;
}
