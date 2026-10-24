// ollie the mascot, changes with the oil status
import { useId } from "react";
import type { Action } from "@/vendor/types";
import { cx } from "@/frontend/format";

const BODY: Record<Action, string> = {
  keep: "var(--ollie-fresh)",
  monitor: "var(--ollie-used)",
  change_soon: "var(--ollie-worn)",
  change_now: "var(--ollie-spent)",
};

const DROP = "M50 6 C44 18 30 34 22 50 C16 62 15 72 18 80 C23 94 36 101 50 101 C64 101 77 94 82 80 C85 72 84 62 78 50 C70 34 56 18 50 6 Z";

export function Ollie({
  state = "keep",
  size = 120,
  animated = true,
  scene = false,
  className,
  title,
}: {
  state?: Action;
  size?: number;
  animated?: boolean;
  scene?: boolean;
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const slumped = state === "change_now";
  return (
    <svg
      viewBox="0 0 100 132"
      width={size}
      height={(size * 132) / 100}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cx("overflow-visible", animated && "ollie-anim", animated && `ollie-${state}`, className)}
    >
      <defs>
        <filter id={`rough-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
        {scene && (
          <radialGradient id={`glow-${id}`}>
            <stop offset="0%" stopColor={BODY[state]} stopOpacity="0.38" />
            <stop offset="100%" stopColor={BODY[state]} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>

      {scene && (
        <g aria-hidden="true">
          <ellipse className="ollie-glow" cx="50" cy="66" rx="70" ry="66" fill={`url(#glow-${id})`} />
          <ellipse className="ollie-shadow" cx="50" cy="127" rx="26" ry="4.5" fill="#000" opacity="0.3" />
          <g fill={BODY[state]} filter={`url(#rough-${id})`}>
            <circle className="ollie-bubble" cx="8" cy="104" r="3.4" />
            <circle className="ollie-bubble ollie-bubble-b" cx="94" cy="96" r="2.6" />
            <circle className="ollie-bubble ollie-bubble-c" cx="18" cy="70" r="2" />
            <circle className="ollie-bubble ollie-bubble-d" cx="88" cy="58" r="1.8" />
          </g>
        </g>
      )}

      <g className="ollie-tilt">
      <g key={state} className="ollie-pop">
        <g className="ollie-body" filter={`url(#rough-${id})`}>
          <g stroke={BODY[state]} strokeWidth="5" strokeLinecap="round" fill="none">
            {slumped ? (
              <>
                <path className="ollie-leg ollie-leg-l" d="M38 98 L28 122" />
                <path className="ollie-leg ollie-leg-r" d="M62 98 L72 122" />
              </>
            ) : (
              <>
                <path className="ollie-leg ollie-leg-l" d="M40 98 L37 124" />
                <path className="ollie-leg ollie-leg-r" d="M60 98 L63 124" />
              </>
            )}
          </g>
          <path d={DROP} fill={BODY[state]} />

          <g className="ollie-gaze">
          <g fill="var(--ollie-night)" stroke="var(--ollie-night)" className="ollie-eyes">
            {state === "change_now" ? (
              <g fill="none" strokeWidth="3.2" strokeLinecap="round">
                <path d="M30 64 Q36 69 42 64" />
                <path d="M56 68 Q62 73 68 68" />
              </g>
            ) : (
              <>
                <circle cx="37" cy="63" r={state === "change_soon" ? 6.4 : 5.6} stroke="none" />
                <circle cx="61" cy="67" r={state === "change_soon" ? 6.4 : 5.6} stroke="none" />
              </>
            )}
          </g>
          {state === "monitor" && <path className="ollie-brow" d="M54 56 Q62 52 69 57" fill="none" stroke="var(--ollie-night)" strokeWidth="3" strokeLinecap="round" />}
          </g>
        </g>

        {state === "change_soon" && (
          <path className="ollie-sweat" d="M86 30 C83 36 81 39 81 42 C81 45 83.5 47 86 47 C88.5 47 91 45 91 42 C91 39 89 36 86 30 Z" fill="var(--ollie-sweat)" />
        )}
        {state === "change_now" && (
          <g stroke="var(--gray)" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.8">
            <path className="ollie-smoke" d="M74 4 C70 0 78 -4 74 -8 C70 -12 78 -16 74 -20" />
            <path className="ollie-smoke ollie-smoke-b" d="M84 10 C80 6 88 2 84 -2 C80 -6 88 -10 84 -14" />
          </g>
        )}
      </g>
      </g>
    </svg>
  );
}

const GLYPH_DROP = "M12 1.4C10.3 4.6 6.2 8.9 4.8 12.5 3.2 16.9 6.3 22 12 22S20.8 16.9 19.2 12.5C17.8 8.9 13.7 4.6 12 1.4Z";

export function StatusDrop({ state, className, title }: { state: Action; className?: string; title?: string }) {
  const eye = "var(--ollie-night)";
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("ink inline-block size-[1em] shrink-0 overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={GLYPH_DROP} fill={BODY[state]} />
      {state === "change_now" ? (
        <g fill="none" stroke={eye} strokeWidth="1.7" strokeLinecap="round">
          <path d="M7.4 14.2q1.6 1.3 3.2 0" />
          <path d="M13.4 15.2q1.6 1.3 3.2 0" />
        </g>
      ) : (
        <g fill={eye}>
          <circle cx="9" cy="14" r={state === "change_soon" ? 1.9 : 1.6} />
          <circle cx="15" cy="15" r={state === "change_soon" ? 1.9 : 1.6} />
        </g>
      )}
      {state === "monitor" && <path d="M13.2 11.6q2-1.1 3.8.2" fill="none" stroke={eye} strokeWidth="1.4" strokeLinecap="round" />}
      {state === "change_soon" && <path d="M21.6 3.6c-.9 1.5-1.5 2.3-1.5 3.1a1.5 1.5 0 0 0 3 0c0-.8-.6-1.6-1.5-3.1Z" fill="var(--ollie-sweat)" />}
      {state === "change_now" && <path d="M19 6c-1-1 1-2 0-3s1-2 0-3" fill="none" stroke="var(--gray)" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  );
}

export function DropDot({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("ink inline-block size-[0.8em] shrink-0", className)} aria-hidden="true">
      <path d={GLYPH_DROP} fill={color} />
    </svg>
  );
}
