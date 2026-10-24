import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_CONFIGURED, SUPABASE_KEY, SUPABASE_URL } from "./config";

/** Refreshes the auth cookies on each request so server code always sees a valid session. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!SUPABASE_CONFIGURED) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Must run before anything else touches the response; getClaims verifies the JWT.
  await supabase.auth.getClaims();
  return response;
}
