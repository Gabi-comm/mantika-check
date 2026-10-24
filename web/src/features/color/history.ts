// saved analyzer results
export type ColorEntry = {
  id: string;
  date: string;
  label: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
  nearestReference: string;
};

const KEY = "mantika.history";

export function loadColorHistory(): ColorEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ColorEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveColorEntry(e: ColorEntry): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify([e, ...loadColorHistory()]));
    return true;
  } catch {
    return false;
  }
}

export function removeColorEntry(id: string): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadColorHistory().filter((x) => x.id !== id)));
    return true;
  } catch {
    return false;
  }
}
