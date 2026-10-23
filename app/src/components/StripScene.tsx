type Props = {
  padColor?: string;
  scan?: boolean;
  label?: string;
  className?: string;
};

/** Illustrated printed colour card on a bench, framed by the detection brackets (brand motif). */
export function StripScene({ padColor = "var(--s-green)", scan = true, label, className }: Props) {
  return (
    <div className={["strip-photo", className].filter(Boolean).join(" ")} role="img" aria-label="Illustration: printed colour card framed by detection brackets">
      <div className="strip-card-print">
        <div className="pad" style={{ background: padColor }} />
        <div className="lines">
          <i />
          <i />
          <i />
        </div>
      </div>
      <span className="bracket tl" />
      <span className="bracket tr" />
      <span className="bracket bl" />
      <span className="bracket br" />
      {scan && <span className="scanline" aria-hidden="true" />}
      {label && <span className="photo-label">{label}</span>}
    </div>
  );
}

/** Detection-frame mark used as decorative motif. */
export function FrameMotif({ className, stroke = "currentColor" }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="4.5" strokeLinecap="round">
        <path d="M8 20V12a4 4 0 0 1 4-4h8M44 8h8a4 4 0 0 1 4 4v8M56 44v8a4 4 0 0 1-4 4h-8M20 56h-8a4 4 0 0 1-4-4v-8" />
      </g>
      <rect x="25" y="14" width="14" height="36" rx="4" fill="none" stroke={stroke} strokeWidth="4" />
      <rect x="29" y="19" width="6" height="6" rx="1.5" fill={stroke} />
      <rect x="29" y="29" width="6" height="6" rx="1.5" fill={stroke} opacity=".7" />
      <rect x="29" y="39" width="6" height="6" rx="1.5" fill={stroke} opacity=".45" />
    </svg>
  );
}
