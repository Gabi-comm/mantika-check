"use client";

import { useEffect, useState } from "react";
import { Ollie } from "@/components/Ollie";
import { Logo } from "@/components/Logo";
import { INTRO_KEY } from "@/frontend/boot";

export function Intro() {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") return;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    const t1 = setTimeout(() => setLeaving(true), 2300);
    const t2 = setTimeout(() => delete document.documentElement.dataset.intro, 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skip = () => {
    setLeaving(true);
    setTimeout(() => delete document.documentElement.dataset.intro, 450);
  };

  return (
    <div
      className={`intro-splash fixed inset-0 z-[100] hidden cursor-pointer flex-col items-center justify-center bg-[#101012] ${leaving ? "intro-leave" : ""}`}
      onClick={skip}
      aria-hidden="true"
    >
      <div className="relative grid place-items-center">
        <span className="intro-ripple absolute bottom-0 h-6 w-28 rounded-[50%] border-2 border-[#f4c64e]/60" />
        <div className="intro-drop">
          <Ollie state="keep" size={110} animated={false} />
        </div>
      </div>
      <p className="intro-word mt-8">
        <Logo height={52} reversed />
      </p>
      <p className="intro-tag mt-2 font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[#f4c64e]">Meet Ollie · your oil&apos;s honest buddy</p>
      <p className="intro-tag absolute bottom-8 text-[0.78rem] text-white/45">Tap to skip</p>
    </div>
  );
}
