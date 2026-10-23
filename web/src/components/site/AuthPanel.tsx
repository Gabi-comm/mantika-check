"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { emailError, passwordError, signIn, signInWithGoogle, signUp, usernameError } from "@/frontend/auth";
import { cx } from "@/frontend/format";

type Mode = "signin" | "signup";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  trailing,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icon: typeof Mail; error?: string | null; trailing?: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
        {label}
      </label>
      <div
        className={cx(
          "flex h-12 items-center gap-2.5 rounded-[var(--radius-s)] border bg-canvas px-3 transition-colors focus-within:border-green",
          error ? "border-st-replace" : "border-line-strong"
        )}
      >
        <Icon className="size-4 shrink-0 text-gray" aria-hidden="true" />
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-gray/70"
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-e`} className="fade-up mt-1 text-[0.8rem] font-medium text-st-replace">
          {error}
        </p>
      )}
    </div>
  );
}

/** Sign-in and account creation. UI only until Supabase is connected (see frontend/auth.ts). */
export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const creating = mode === "signup";
  const errors = {
    email: touched ? emailError(email) : null,
    username: touched && creating ? usernameError(username) : null,
    password: touched ? passwordError(password, creating) : null,
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (emailError(email) || (creating && usernameError(username)) || passwordError(password, creating)) return;
    setBusy("form");
    const res = creating ? await signUp({ email, username, password }) : await signIn({ email, password });
    setPassword("");
    if (!res.ok) {
      setBusy(null);
      setFormError(res.error);
      return;
    }
    router.push("/app");
  }

  async function google() {
    setBusy("google");
    const res = await signInWithGoogle();
    if (res.ok) router.push("/app");
    else {
      setBusy(null);
      setFormError(res.error);
    }
  }

  const switchTo = (m: Mode) => {
    setMode(m);
    setTouched(false);
    setFormError(null);
  };

  return (
    <div className="rounded-[var(--radius-l)] border border-line bg-surface p-6 shadow-card sm:p-7">
      <div role="tablist" aria-label="Account" className="relative grid grid-cols-2 rounded-[var(--radius-s)] bg-canvas p-1">
        <span
          aria-hidden="true"
          className={cx("absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[5px] bg-surface shadow-card transition-transform duration-300", creating && "translate-x-full")}
        />
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchTo(m)}
            className={cx("relative min-h-10 text-[0.9rem] font-semibold transition-colors", mode === m ? "text-ink" : "text-gray hover:text-ink")}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h2 className="mt-6 text-[1.4rem] font-extrabold text-ink">{creating ? "Start tracking your oil" : "Welcome back"}</h2>
      <p className="mt-1 text-[0.9rem] text-gray">{creating ? "One account for your stall. Ollie keeps your batches on this device." : "Sign in to open your workspace."}</p>

      <button
        type="button"
        onClick={google}
        disabled={busy !== null}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-s)] border border-line-strong bg-surface font-semibold text-ink transition-colors hover:border-green disabled:opacity-50"
      >
        {busy === "google" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <GoogleMark />}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.12em] text-gray" aria-hidden="true">
        <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="auth-email" label="Gmail address" icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        {creating && (
          <div className="fade-up">
            <Field id="auth-user" label="Username" icon={User} autoComplete="username" placeholder="corner_fishball" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
          </div>
        )}
        <Field
          id="auth-pass"
          label="Password"
          icon={Lock}
          type={show ? "text" : "password"}
          autoComplete={creating ? "new-password" : "current-password"}
          placeholder={creating ? "At least 8 characters" : "Your password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          trailing={
            <button type="button" onClick={() => setShow((v) => !v)} className="grid size-8 place-items-center rounded text-gray hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          }
        />
        {formError && (
          <p role="alert" className="text-[0.85rem] font-medium text-st-replace">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={busy !== null}
          className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-s)] bg-green font-semibold text-white transition-colors hover:bg-forest disabled:opacity-60"
        >
          {busy === "form" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {creating ? "Create account" : "Sign in"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </form>

      <p className="mt-5 text-center text-[0.85rem] text-gray">
        {creating ? "Already have an account? " : "New here? "}
        <button type="button" onClick={() => switchTo(creating ? "signin" : "signup")} className="font-semibold text-accent hover:underline">
          {creating ? "Sign in" : "Create an account"}
        </button>
      </p>
      <p className="mt-2 text-center text-[0.8rem] text-gray">
        <Link href="/app" className="underline-offset-2 hover:text-accent hover:underline">
          Explore the demo without an account
        </Link>
      </p>
    </div>
  );
}
