"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { SETTINGS_KEY } from "./boot";

export type Theme = "dark" | "light";
export interface Settings {
  theme: Theme;
}
export const defaultSettings: Settings = { theme: "dark" };

function apply(s: Settings) {
  document.documentElement.dataset.theme = s.theme;
}

function read(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<Settings>;
    return { theme: raw.theme === "light" ? "light" : "dark" };
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
