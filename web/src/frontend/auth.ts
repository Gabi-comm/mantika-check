"use client";

import { supabaseBrowser } from "@/supabase/client";
import { SUPABASE_CONFIGURED, SUPABASE_KEY, SUPABASE_URL } from "@/supabase/config";

/**
 * Auth boundary. With Supabase configured (see supabase/config.ts) every call goes to Supabase Auth;
 * without it the calls only validate input and resolve, so the local demo keeps working.
 * Passwords are never stored or logged here.
 */
export interface SignUpInput {
  email: string;
  username: string;
  password: string;
}
export interface SignInInput {
  email: string;
  password: string;
}
/** `notice` is set when the account needs one more step (e.g. confirming the email) before it can sign in. */
export type AuthResult = { ok: true; notice?: string } | { ok: false; error: string };

export const AUTH_CONNECTED = SUPABASE_CONFIGURED;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-z0-9_.]{3,20}$/i;

export function emailError(email: string): string | null {
  if (!email.trim()) return "Enter your Gmail address.";
  return EMAIL.test(email.trim()) ? null : "Enter a valid email, like name@gmail.com.";
}
export function usernameError(username: string): string | null {
  if (!username.trim()) return "Choose a username.";
  return USERNAME.test(username.trim()) ? null : "3 to 20 letters, numbers, dots or underscores.";
}
export function passwordError(password: string, creating: boolean): string | null {
  if (!password) return "Enter your password.";
  return creating && password.length < 8 ? "Use at least 8 characters." : null;
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("username_taken") || m.includes("database error saving new user")) return "That username is taken. Try another one.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("email not confirmed")) return "Confirm your email first. Check your inbox for the link.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries. Wait a minute, then try again.";
  if (m.includes("password")) return message;
  if (m.includes("fetch") || m.includes("network")) return "Can't reach the server. Check your connection.";
  return "Something went wrong. Please try again.";
}

const callbackUrl = (next = "/app") => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const error = emailError(input.email) ?? usernameError(input.username) ?? passwordError(input.password, true);
  if (error) return { ok: false, error };
  const supabase = supabaseBrowser();
  if (!supabase) return { ok: true };
  const { data, error: authError } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { username: input.username.trim().toLowerCase() }, emailRedirectTo: callbackUrl() },
  });
  if (authError) return { ok: false, error: friendly(authError.message) };
  // Supabase hides existing emails behind an empty identities list instead of an error.
  if (data.user && data.user.identities?.length === 0) return { ok: false, error: "An account with this email already exists. Sign in instead." };
  return data.session ? { ok: true } : { ok: true, notice: `Almost there. We sent a confirmation link to ${input.email.trim()}.` };
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const error = emailError(input.email) ?? passwordError(input.password, false);
  if (error) return { ok: false, error };
  const supabase = supabaseBrowser();
  if (!supabase) return { ok: true };
  const { error: authError } = await supabase.auth.signInWithPassword({ email: input.email.trim(), password: input.password });
  return authError ? { ok: false, error: friendly(authError.message) } : { ok: true };
}

/** Redirects to Google; the browser comes back through /auth/callback. */
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = supabaseBrowser();
  if (!supabase) return { ok: true };
  // Supabase answers a disabled provider with a raw JSON page; check first so the form can say so instead.
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } });
    const settings = (await res.json()) as { external?: { google?: boolean } };
    if (settings.external?.google === false) return { ok: false, error: "Google sign-in isn't available yet. Use your email for now." };
  } catch {
    return { ok: false, error: friendly("network") };
  }
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true, notice: "redirect" };
}

export async function signOut(): Promise<void> {
  await supabaseBrowser()?.auth.signOut();
}
