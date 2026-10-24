"use client";

import { useEffect } from "react";
import { startCloudSync } from "@/vendor/sync";

/** Keeps the signed-in workspace mirrored to Supabase on every page. Renders nothing. */
export function CloudSync() {
  useEffect(() => startCloudSync(), []);
  return null;
}
