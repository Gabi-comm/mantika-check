// brand logo
import { cx } from "@/frontend/format";

const MIN_MARK = 24;

export function Logo({ height = 32, reversed = false, className }: { height?: number; reversed?: boolean; className?: string }) {
  const h = Math.max(height, MIN_MARK);
  return (
    <span className={cx("inline-flex shrink-0 items-center", className)} style={{ gap: h * 0.25 }}>
      <svg viewBox="0 0 64 64" width={h} height={h} aria-hidden="true" className={cx("logo-mark shrink-0", reversed && "is-reversed")}>
        <g fill="none" strokeWidth="9" strokeLinecap="butt">
          <path d="M48.09 18.50 A21 21 0 0 0 20.87 14.19" stroke="var(--mark-1, #0b3d2e)" />
          <path d="M19.07 15.45 A21 21 0 0 0 14.19 43.13" stroke="var(--mark-2, #11634a)" />
          <path d="M15.45 44.93 A21 21 0 0 0 48.09 45.50" stroke="var(--mark-3, #1f8a5b)" />
        </g>
        <rect x="26" y="26" width="12" height="12" rx="2" fill="var(--mark-sq, #0e6e73)" />
      </svg>
      <span className={cx("whitespace-nowrap font-display leading-none tracking-[-0.017em]", reversed ? "text-white" : "logo-word")} style={{ fontSize: h * 0.5 }}>
        <b className="font-extrabold">MANTIKA</b>
        <span className="ml-[0.3em] font-medium">CHECK</span>
      </span>
    </span>
  );
}
