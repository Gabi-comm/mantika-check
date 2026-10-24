# Supabase setup

The app runs fully on-device until these steps are done. Nothing else in the code needs to change.

1. **Create a project** at supabase.com.
2. **Run the schema**: SQL Editor → paste `migrations/20261024100000_mantika_workspace.sql` → Run.
   (Or with the CLI: `supabase link --project-ref <ref>` then `supabase db push`.)
   Then open Advisors → Security and Performance and confirm there are no warnings.
3. **Keys** → `web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Publishable key only. Never put the secret / service_role key in this app.
4. **Auth → URL Configuration**: Site URL = your deployed URL; add redirect URLs
   `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.
5. **Google sign-in**: Auth → Providers → Google → paste the Google Cloud OAuth client ID and secret.
   In Google Cloud, the authorised redirect URI is `https://<ref>.supabase.co/auth/v1/callback`.
6. **Email confirmation** (Auth → Providers → Email) can stay on; sign-up then shows "check your email".
7. Restart `npm run dev` so the new env vars load.

## What is stored
- `profiles`: username (from sign-up), stall name, setup, active batch. Created by a trigger on sign-up.
- `batches`, `batch_events`: the vendor's own records only. Demo data never leaves the device.
- RLS: each signed-in user can read and write only rows with their own `auth.uid()`. `anon` has no access.
