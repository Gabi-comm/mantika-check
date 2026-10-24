"use client";

// welcome screen right after login
import { useEffect, useState } from "react";
import { useCloud } from "@/vendor/sync";
import { WELCOME_KEY } from "@/frontend/auth";
import { OllieStage } from "./OllieStage";
import { Check, Loader2 } from "./icons";

const MIN_MS = 1500;
const MAX_MS = 5000;

export function WelcomeSplash() {
  const cloud = useCloud();
  const [phase, setPhase] = useState<"off" | "in" | "out">("off");
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(WELCOME_KEY) === "1";
      sessionStorage.removeItem(WELCOME_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (flagged) setPhase("in");
  }, []);

  useEffect(() => {
    if (phase !== "in") return;
    const min = setTimeout(() => setMinDone(true), MIN_MS);
    const max = setTimeout(() => setPhase((p) => (p === "in" ? "out" : p)), MAX_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, [phase]);

  const loading = cloud.status === "loading";
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phase === "in" && minDone && !loading) setPhase("out");
  }, [phase, minDone, loading]);

  useEffect(() => {
    if (phase !== "out") return;
    document.documentElement.classList.add("welcome-reveal");
    const t = setTimeout(() => {
      setPhase("off");
      document.documentElement.classList.remove("welcome-reveal");
    }, 650);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "in") return;
    const skip = () => setPhase("out");
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [phase]);

  if (phase === "off") return null;
  const name = cloud.username ?? cloud.email?.split("@")[0] ?? null;
  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setPhase("out")}
      className={`welcome-splash fixed inset-0 z-[70] grid place-items-center bg-canvas ${phase === "out" ? "is-leaving" : ""}`}
    >
      <div className="flex flex-col items-center px-6 text-center">
        <OllieStage state="keep" size={120} quip={false} />
        <p className="welcome-line mt-6 font-display text-[1.7rem] font-extrabold text-ink sm:text-[2.1rem]">{name ? `Welcome, ${name}!` : "Welcome!"}</p>
        <p className="welcome-line welcome-line-2 mt-2 flex items-center gap-2 text-[0.95rem] text-gray">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Getting your batches ready…
            </>
          ) : (
            <>
              <Check className="size-4 text-accent" aria-hidden="true" /> Your workspace is ready.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
