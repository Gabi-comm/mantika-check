"use client";

// intro animation on the website
import { useEffect, useState } from "react";
import { Ollie } from "@/components/Ollie";
import { Logo } from "@/components/Logo";
import { copy } from "@/vendor/copy";
import type { Action } from "@/vendor/types";

type Scene = "drop" | "moods" | "brand";

const MOODS: Action[] = ["keep", "monitor", "change_soon", "change_now"];
const GLOW: Record<Action, string> = {
  keep: "var(--ollie-fresh)",
  monitor: "var(--ollie-used)",
  change_soon: "var(--ollie-worn)",
  change_now: "var(--ollie-spent)",
};
const MOOD_AT = [1500, 2100, 2700, 3300];
const BRAND_AT = 4100;
const END = 5900;

export function Intro() {
  const [scene, setScene] = useState<Scene>("drop");
  const [mood, setMood] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") return;
    const timers = [
      ...MOOD_AT.map((at, i) =>
        setTimeout(() => {
          setScene("moods");
          setMood(i);
        }, at)
      ),
      setTimeout(() => setScene("brand"), BRAND_AT),
      setTimeout(() => setLeaving(true), END),
      setTimeout(() => delete document.documentElement.dataset.intro, END + 500),
    ];
    const onKey = () => skip();
    window.addEventListener("keydown", onKey, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function skip() {
    setLeaving(true);
    setTimeout(() => delete document.documentElement.dataset.intro, 450);
  }

  const state: Action = scene === "moods" ? MOODS[mood] : "keep";

  return (
    <div
      className={`intro-splash fixed inset-0 z-[100] hidden cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#101012] ${leaving ? "intro-leave" : ""}`}
      onClick={skip}
      aria-hidden="true"
    >
      <div className="intro-glow pointer-events-none absolute inset-0" style={{ "--glow": GLOW[state] } as React.CSSProperties} />

      <div className="relative grid place-items-center">
        <span className="intro-ripple absolute bottom-0 h-6 w-28 rounded-[50%] border-2 border-[#f4c64e]/60" />
        <div className="intro-drop">
          <Ollie state={state} size={scene === "brand" ? 96 : 116} scene />
        </div>
      </div>

      <div className="relative mt-8 grid h-28 w-full max-w-md place-items-start justify-center px-6 text-center">
        {scene === "drop" && (
          <p key="drop" className="intro-tag font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[#f4c64e]">
            Meet Ollie
          </p>
        )}
        {scene === "moods" && (
          <div key="moods" className="fade-up">
            <span key={mood} className="intro-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.9rem] font-semibold text-[#101012]" style={{ background: GLOW[state] }}>
              {copy.status[state]}
            </span>
            <p className="mt-3 text-[0.95rem] text-white/75">Ollie follows your oil, batch by batch.</p>
            <ol className="mt-3 flex justify-center gap-1.5">
              {MOODS.map((a, i) => (
                <li key={a} className="h-1 w-8 rounded-full transition-colors duration-300" style={{ background: i <= mood ? GLOW[a] : "rgba(255,255,255,0.15)" }} />
              ))}
            </ol>
          </div>
        )}
        {scene === "brand" && (
          <div key="brand" className="fade-up">
            <Logo height={52} reversed />
            <p className="intro-tag mt-3 text-[0.95rem] text-white/75">Every frying session. A clearer picture of your oil.</p>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <p className="mb-4 text-center text-[0.78rem] text-white/45">Click or press any key to skip</p>
        <div className="h-[3px] bg-white/10">
          <div className="intro-progress h-full bg-[#f4c64e]" />
        </div>
      </div>
    </div>
  );
}
