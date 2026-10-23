type Props = { variant?: "horizontal" | "mark"; className?: string; height?: number; reversed?: boolean };

export function Logo({ variant = "horizontal", className, height = 28, reversed = false }: Props) {
  const markSrc = reversed ? "/brand/mantika-check-mark-reversed.svg" : "/brand/mantika-check-mark.svg";

  if (variant === "mark") {
    return <img src={markSrc} alt="MANTIKA CHECK" className={className} height={height} style={{ height, width: "auto", flexShrink: 0 }} />;
  }

  // Rendered as mark + HTML text (not the baked-text horizontal SVG) because an <img>-referenced
  // SVG can't see the page's loaded web fonts, which clips the wordmark text at its viewBox edge.
  return (
    <span className={["wordmark-lockup", className].filter(Boolean).join(" ")} style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <img src={markSrc} alt="" aria-hidden="true" height={height} style={{ height, width: "auto", flexShrink: 0 }} />
      <span className="wordmark" style={{ fontSize: height * 0.6 }}>
        <b>MANTIKA</b>
        <span>CHECK</span>
      </span>
    </span>
  );
}
