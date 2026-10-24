"use client";

// dark / light switch
import { flushSync } from "react-dom";
import { Moon, Sun } from "@/components/icons";
import { useSettings } from "@/frontend/settings";
import { cx } from "@/frontend/format";

export function ThemeToggle({ className }: { className?: string }) {
  const { settings, update } = useSettings();
  const dark = settings.theme === "dark";

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next = dark ? "light" : "dark";
    const html = document.documentElement;
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      update({ theme: next });
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    html.style.setProperty("--theme-x", `${x}px`);
    html.style.setProperty("--theme-y", `${y}px`);
    html.style.setProperty("--theme-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    html.classList.add("theme-switching");
    const t = document.startViewTransition(() => flushSync(() => update({ theme: next })));
    t.finished.finally(() => html.classList.remove("theme-switching"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
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
