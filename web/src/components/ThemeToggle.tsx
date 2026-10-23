"use client";

import { Moon, Sun } from "lucide-react";
import { useSettings } from "@/frontend/settings";
import { cx } from "@/frontend/format";

export function ThemeToggle({ className }: { className?: string }) {
  const { settings, update } = useSettings();
  const dark = settings.theme === "dark";
  return (
    <button
      type="button"
      onClick={() => update({ theme: dark ? "light" : "dark" })}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={cx(
        "relative grid size-11 place-items-center overflow-hidden rounded-[var(--radius-s)] border border-line text-ink transition-colors hover:border-green hover:text-accent",
        className
      )}
    >
      <Sun className={cx("absolute size-[1.15rem] transition-all duration-300", dark ? "translate-y-0 rotate-0 opacity-100" : "translate-y-6 rotate-90 opacity-0")} aria-hidden="true" />
      <Moon className={cx("absolute size-[1.15rem] transition-all duration-300", dark ? "-translate-y-6 -rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100")} aria-hidden="true" />
    </button>
  );
}
