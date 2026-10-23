import { useId } from "react";
import type { Action } from "@/vendor/types";
import { cx } from "@/frontend/format";

/**
 * Ollie, the oil-drop mascot. Colour, face and motion follow the batch status:
 * keep hops and blinks, monitor leans and glances, change soon trembles and sweats,
 * change now sags and breathes slowly under rising smoke. A status change pops the new look in.
 */
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
  className,
  title,
}: {
  state?: Action;
  size?: number;
  animated?: boolean;
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
      </defs>

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
    </svg>
  );
}
