export type Settings = {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
};

const KEY = "mantika.settings";

export const defaultSettings: Settings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable, setting stays in-memory only for this session */
  }
}
