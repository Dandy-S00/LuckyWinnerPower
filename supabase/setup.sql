-- =====================================================================
-- Texas Winners - Supabase database setup
-- Run this in the Supabase Dashboard -> SQL Editor -> New query.
-- It is safe to re-run (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE
--    One row per user, holding the date of birth and the age-verified
--    flag. The id matches auth.users.id.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  date_of_birth date not null,
  age_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users may NOT insert/update/delete profiles directly. The age_verified
-- flag and date_of_birth are written only by the trigger below (which runs
-- as the table owner), so a malicious client cannot mark itself verified.
-- (No insert/update/delete policies => those operations are denied by RLS.)

-- ---------------------------------------------------------------------
-- 2. DEPOSITS TABLE
--    Written only by the Stripe webhook using the service-role key
--    (which bypasses RLS). Users can read their own deposit history.
-- ---------------------------------------------------------------------
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_session_id text unique,
  username text,
  email text,
  amount numeric(10, 2),
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

alter table public.deposits enable row level security;

drop policy if exists "deposits_select_own" on public.deposits;
create policy "deposits_select_own"
  on public.deposits for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. AGE ENFORCEMENT TRIGGER
--    On every new auth user, read the date_of_birth supplied in the
--    signup metadata, compute the age SERVER-SIDE, and reject the signup
--    if the user is under 18. This cannot be bypassed by tampering with
--    the browser/JavaScript. On success, create the profile row with
--    age_verified = true.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dob date;
  computed_age int;
begin
  -- date_of_birth is provided client-side in options.data at signUp().
  if new.raw_user_meta_data ? 'date_of_birth' then
    dob := (new.raw_user_meta_data ->> 'date_of_birth')::date;
  else
    raise exception 'Date of birth is required to create an account.';
  end if;

  if dob > current_date then
    raise exception 'Date of birth cannot be in the future.';
  end if;

  computed_age := date_part('year', age(dob));

  if computed_age < 18 then
    raise exception 'You must be at least 18 years old to create an account.';
  end if;

  insert into public.profiles (id, date_of_birth, age_verified)
  values (new.id, dob, true)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
