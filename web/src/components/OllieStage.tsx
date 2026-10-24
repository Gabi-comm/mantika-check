"use client";

import { useEffect, useRef, useState } from "react";
import type { Action } from "@/vendor/types";
import { cx } from "@/frontend/format";
import { Ollie } from "./Ollie";

const SAYS: Record<Action, string> = {
  keep: "Fresh and golden!",
  monitor: "Keeping an eye out.",
  change_soon: "Getting tired here…",
  change_now: "Change me, please.",
};

/**
 * Ollie in his world: glow, shadow and bubbles (scene), eyes that follow the pointer, a lean toward it,
 * and a squash-and-jump with a one-line quip when tapped. Pointer tracking is off under reduced motion.
 */
export function OllieStage({ state = "keep", size = 120, className, title, quip = true }: { state?: Action; size?: number; className?: string; title?: string; quip?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [boop, setBoop] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 260);
      el.style.setProperty("--gx", `${((dx / d) * 3.2 * reach).toFixed(2)}px`);
      el.style.setProperty("--gy", `${((dy / d) * 2.6 * reach).toFixed(2)}px`);
      el.style.setProperty("--tilt", `${Math.max(-6, Math.min(6, dx / 60)).toFixed(2)}deg`);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      el.style.setProperty("--gx", "0px");
      el.style.setProperty("--gy", "0px");
      el.style.setProperty("--tilt", "0deg");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    if (!boop) return;
    const t = setTimeout(() => setBoop(0), 1800);
    return () => clearTimeout(t);
  }, [boop]);

  return (
    <div ref={ref} className={cx("ollie-stage relative inline-grid place-items-center", className)} onPointerDown={() => setBoop((n) => n + 1)}>
      <div key={boop} className={cx(boop > 0 && "ollie-booped")}>
        <Ollie state={state} size={size} scene title={title} />
      </div>
      {quip && boop > 0 && (
        <span key={`q${boop}`} role="status" className="ollie-quip pointer-events-none absolute -top-2 left-1/2 whitespace-nowrap rounded-full bg-surface px-3 py-1 text-[0.78rem] font-semibold text-ink shadow-card ring-1 ring-line">
          {SAYS[state]}
        </span>
      )}
    </div>
  );
}
