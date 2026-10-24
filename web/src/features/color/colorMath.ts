// colour maths for the analyzer
export type RGB = { r: number; g: number; b: number };
export type HSV = { h: number; s: number; v: number };
export type LAB = { l: number; a: number; b: number };

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

function srgbToLinear(c: number) {
  const cn = c / 255;
  return cn <= 0.04045 ? cn / 12.92 : Math.pow((cn + 0.055) / 1.055, 2.4);
}

export function rgbToLab({ r, g, b }: RGB): LAB {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b);
  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const z = rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041;

  const xn = x / 0.95047, yn = y / 1.0, zn = z / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(xn), fy = f(yn), fz = f(zn);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function labDistance(a: LAB, b: LAB) {
  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

export function rgbToHex({ r, g, b }: RGB) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export type ReferenceColor = {
  id: string;
  label: string;
  hex: string;
  rgb: RGB;
};

export const REFERENCE_COLORS: ReferenceColor[] = [
  { id: "yellow", label: "Yellow band", hex: "#E3BE2F", rgb: { r: 227, g: 190, b: 47 } },
  { id: "green", label: "Green band", hex: "#3C9A57", rgb: { r: 60, g: 154, b: 87 } },
  { id: "blue", label: "Blue band", hex: "#2C6DB5", rgb: { r: 44, g: 109, b: 181 } },
];

export function averageColorFromCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): RGB {
  const { data } = ctx.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  let r = 0, g = 0, b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: r / count, g: g / count, b: b / count };
}

export function nearestReference(rgb: RGB): { reference: ReferenceColor; distance: number } {
  const lab = rgbToLab(rgb);
  let best = REFERENCE_COLORS[0];
  let bestDist = Infinity;
  for (const ref of REFERENCE_COLORS) {
    const d = labDistance(lab, rgbToLab(ref.rgb));
    if (d < bestDist) {
      bestDist = d;
      best = ref;
    }
  }
  return { reference: best, distance: bestDist };
}
