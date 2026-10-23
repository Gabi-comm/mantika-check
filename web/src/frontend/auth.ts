/**
 * Auth boundary. Supabase is not connected yet: every call validates its input and resolves
 * without contacting a server. Replace the bodies with the Supabase client when it is set up.
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
export type AuthResult = { ok: true } | { ok: false; error: string };

export const AUTH_CONNECTED = false;

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

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const error = emailError(input.email) ?? usernameError(input.username) ?? passwordError(input.password, true);
  return error ? { ok: false, error } : { ok: true };
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const error = emailError(input.email) ?? passwordError(input.password, false);
  return error ? { ok: false, error } : { ok: true };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  return { ok: true };
}
