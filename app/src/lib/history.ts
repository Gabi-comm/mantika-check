export type HistoryEntry = {
  id: string;
  date: string;
  label: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
  nearestReference: string;
  isDemoSample: boolean;
};

const KEY = "mantika.history";

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: HistoryEntry) {
  try {
    const all = loadHistory();
    all.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* localStorage unavailable; entry is lost but UI still works this session */
  }
}

export function removeEntry(id: string) {
  const all = loadHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
