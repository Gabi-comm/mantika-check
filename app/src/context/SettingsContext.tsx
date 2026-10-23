import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Settings, defaultSettings, loadSettings, saveSettings } from "../lib/settings";

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
};

const SettingsCtx = createContext<Ctx>({ settings: defaultSettings, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
    document.documentElement.dataset.contrast = settings.highContrast ? "high" : "normal";
    document.documentElement.dataset.textSize = settings.largeText ? "large" : "normal";
    saveSettings(settings);
  }, [settings]);

  function update(patch: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...patch }));
  }

  return <SettingsCtx.Provider value={{ settings, update }}>{children}</SettingsCtx.Provider>;
}

export function useSettings() {
  return useContext(SettingsCtx);
}
