"use client";

// starts the supabase sync
import { useEffect } from "react";
import { startCloudSync } from "@/vendor/sync";

export function CloudSync() {
  useEffect(() => startCloudSync(), []);
  return null;
}
