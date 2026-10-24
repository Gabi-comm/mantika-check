/**
 * Supabase project settings, read from `.env.local`:
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (publishable key only, never the secret key).
 * When either is missing the app runs fully local, as before.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const SUPABASE_CONFIGURED = SUPABASE_URL.startsWith("https://") && SUPABASE_KEY.length > 0;
