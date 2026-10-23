import { cx } from "@/lib/format";

/**
 * Approved brand mark (public/brand) plus HTML wordmark.
 * The wordmark is live text rather than the baked SVG so it uses the loaded display font.
 */
export function Logo({ height = 28, reversed = false, className }: { height?: number; reversed?: boolean; className?: string }) {
  const src = reversed ? "/brand/mantika-check-mark-reversed.svg" : "/brand/mantika-check-mark.svg";
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset, no optimisation needed */}
      <img src={src} alt="" aria-hidden="true" width={height} height={height} style={{ height, width: height }} />
      <span className={cx("whitespace-nowrap font-display tracking-[-0.01em]", reversed ? "text-white" : "text-forest")} style={{ fontSize: height * 0.62 }}>
        <b className="font-extrabold">MANTIKA</b>
        <span className="ml-[0.28em] font-medium">CHECK</span>
      </span>
    </span>
  );
}
