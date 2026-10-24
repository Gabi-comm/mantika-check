-- Mantika Check: per-account workspace (profile, oil batches, batch events).
-- Every row belongs to one auth user; RLS limits each user to their own rows.
-- Tables are granted to `authenticated` explicitly (new public tables are not auto-exposed to the Data API).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  stall_name text check (char_length(stall_name) <= 80),
  setup jsonb,
  active_batch_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- batches ----------
create table public.batches (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  label text not null check (char_length(label) <= 40),
  started_at timestamptz not null,
  ended_at timestamptz,
  end_reason text check (end_reason in ('dark_murky', 'smoke', 'foam', 'thick', 'schedule', 'recommendation', 'other')),
  oil_type text not null,
  heat_source text not null check (heat_source in ('lpg', 'charcoal', 'electric')),
  volume_l numeric(6, 2) not null check (volume_l > 0 and volume_l <= 1000),
  price_per_l numeric(8, 2) check (price_per_l >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------- batch events (session / topup / check / replaced) ----------
create table public.batch_events (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  batch_id text not null,
  kind text not null check (kind in ('session', 'topup', 'check', 'replaced')),
  at timestamptz not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, batch_id) references public.batches (user_id, id) on delete cascade
);

create index batch_events_batch_idx on public.batch_events (user_id, batch_id, at);
create index batches_started_idx on public.batches (user_id, started_at desc);

-- ---------- updated_at ----------
create function private.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();
create trigger batches_touch before update on public.batches for each row execute function private.touch_updated_at();
create trigger batch_events_touch before update on public.batch_events for each row execute function private.touch_updated_at();

-- ---------- profile row on sign-up ----------
-- Runs as the table owner because the new user cannot insert yet. Lives in the unexposed `private` schema.
-- username comes from sign-up metadata (display only, never used for authorization); a taken name aborts sign-up.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  wanted text := lower(nullif(trim(new.raw_user_meta_data ->> 'username'), ''));
begin
  if wanted is not null and wanted !~ '^[a-z0-9_.]{3,20}$' then
    wanted := null;
  end if;
  insert into public.profiles (id, username) values (new.id, wanted);
  return new;
exception
  when unique_violation then
    raise exception 'username_taken' using errcode = '23505';
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.batches enable row level security;
alter table public.batch_events enable row level security;

create policy "profiles: read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "batches: read own" on public.batches for select to authenticated using ((select auth.uid()) = user_id);
create policy "batches: insert own" on public.batches for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "batches: update own" on public.batches for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "batches: delete own" on public.batches for delete to authenticated using ((select auth.uid()) = user_id);

create policy "events: read own" on public.batch_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "events: insert own" on public.batch_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "events: update own" on public.batch_events for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "events: delete own" on public.batch_events for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- Data API grants (signed-in users only; anon gets nothing) ----------
grant usage on schema public to authenticated;
grant select, update (stall_name, setup, active_batch_id) on public.profiles to authenticated;
grant select, insert, update, delete on public.batches to authenticated;
grant select, insert, update, delete on public.batch_events to authenticated;
