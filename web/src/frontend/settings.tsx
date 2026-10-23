"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type TextSize = "normal" | "large" | "xlarge";
export interface Settings {
  reducedMotion: boolean;
  highContrast: boolean;
  textSize: TextSize;
}
export const defaultSettings: Settings = { reducedMotion: false, highContrast: false, textSize: "normal" };
export const SETTINGS_KEY = "mantika.settings.v2";

/** Runs before paint (inlined in <head>) so preferences apply without a flash. Keep in sync with apply(). */
export const settingsBootScript = `try{var s=JSON.parse(localStorage.getItem("${SETTINGS_KEY}")||"{}");var d=document.documentElement;d.dataset.motion=s.reducedMotion?"reduced":"full";d.dataset.contrast=s.highContrast?"high":"normal";d.dataset.text=s.textSize||"normal";}catch(e){}`;

function apply(s: Settings) {
  const d = document.documentElement;
  d.dataset.motion = s.reducedMotion ? "reduced" : "full";
  d.dataset.contrast = s.highContrast ? "high" : "normal";
  d.dataset.text = s.textSize;
}

function read(): Settings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaultSettings;
  }
}

const Ctx = createContext<{ settings: Settings; ready: boolean; update: (p: Partial<Settings>) => boolean }>({
  settings: defaultSettings,
  ready: false,
  update: () => false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read after mount to avoid a hydration mismatch; the boot script has already applied attributes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(read());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    let ok = true;
    setSettings((cur) => {
      const next = { ...cur, ...patch };
      apply(next);
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        ok = false;
      }
      return next;
    });
    return ok;
  }, []);

  return <Ctx.Provider value={{ settings, ready, update }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
