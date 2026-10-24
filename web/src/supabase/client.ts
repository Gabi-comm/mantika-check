"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIGURED, SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** One browser client per tab. Null when Supabase is not configured. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED || typeof window === "undefined") return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
