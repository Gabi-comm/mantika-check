import { className, hexFor } from "../lib/classes";

/** Result colours are data: framed chip + letter + word, never colour alone. */
export function ChipLetter({ label, size }: { label: string; size?: number }) {
  const name = className(label);
  return (
    <span
      className="chip-letter"
      aria-hidden="true"
      style={{ background: hexFor(label), color: name === "Blue" ? "#fff" : "var(--text)", width: size, height: size }}
    >
      {name[0]}
    </span>
  );
}

export function ClassBadge({ label, suffix }: { label: string; suffix?: string }) {
  return (
    <span className="class-badge">
      <ChipLetter label={label} />
      {className(label)}
      {suffix}
    </span>
  );
}

export function FramedSwatch({ hex, size, label }: { hex: string; size?: number; label?: string }) {
  return (
    <span className="framed-swatch" style={size ? { width: size, height: size } : undefined} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span style={{ background: hex }} />
    </span>
  );
}
