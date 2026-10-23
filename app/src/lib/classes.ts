import { REFERENCE_COLORS } from "./colorMath";

/** Short class name ("Blue") from a reference label ("Blue band"). */
export function className(label: string) {
  return label.replace(/\s*band$/i, "");
}

export function hexFor(label: string) {
  return REFERENCE_COLORS.find((r) => r.label === label || className(r.label) === label)?.hex ?? "#c9c2b3";
}
