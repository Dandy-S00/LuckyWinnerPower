-- =====================================================================
-- Texas Winners - Admin portal & distributors setup
-- Run this in the Supabase Dashboard -> SQL Editor AFTER supabase/setup.sql.
-- It is safe to re-run (idempotent).
--
-- Adds:
--   * distributors table (each distributor logs in with their own account)
--   * profiles.role        ('player' | 'distributor' | 'admin')
--   * profiles.balance      in-app balance managed by admins/distributors
--   * profiles.distributor_id  which distributor a player signed up under
--   * balance_adjustments   audit ledger of every balance change
--   * updated signup trigger that records the distributor and role
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DISTRIBUTORS
--    A distributor is an account that logs in (id == auth.users.id) and
--    can see only the players that signed up under its code.
-- ---------------------------------------------------------------------
create table if not exists public.distributors (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Distributor codes are matched case-insensitively; keep them unique.
create unique index if not exists distributors_code_key
  on public.distributors (upper(code));

alter table public.distributors enable row level security;
-- No client policies: all access goes through the service-role API endpoints.

-- ---------------------------------------------------------------------
-- 2. PROFILE COLUMNS
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'player';

alter table public.profiles
  add column if not exists balance numeric(12, 2) not null default 0;

alter table public.profiles
  add column if not exists distributor_id uuid references public.distributors (id) on delete set null;

-- Distributor/admin accounts are created without a date of birth, so the
-- column can no longer be NOT NULL.
alter table public.profiles
  alter column date_of_birth drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('player', 'distributor', 'admin'));
  end if;
end$$;

create index if not exists profiles_distributor_id_idx
  on public.profiles (distributor_id);

-- ---------------------------------------------------------------------
-- 3. BALANCE ADJUSTMENTS (audit ledger)
--    Written only by the service-role API. Every balance change (set,
--    add, zero-out) is recorded here for accountability.
-- ---------------------------------------------------------------------
create table if not exists public.balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  previous_balance numeric(12, 2) not null,
  new_balance numeric(12, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.balance_adjustments enable row level security;
-- No client policies: service-role access only.

create index if not exists balance_adjustments_user_id_idx
  on public.balance_adjustments (user_id);

-- ---------------------------------------------------------------------
-- 4. SIGNUP TRIGGER
--    Recomputes age server-side for players and records the distributor
--    the player signed up under (from the distributor_code metadata).
--    Distributor/admin accounts are created via the admin API and carry
--    a 'role' in their metadata but no date_of_birth.
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
  meta_role text;
  dist_code text;
  dist_id uuid;
begin
  meta_role := coalesce(new.raw_user_meta_data ->> 'role', 'player');

  if meta_role not in ('player', 'distributor', 'admin') then
    meta_role := 'player';
  end if;

  if meta_role = 'player' then
    -- Players must supply a date of birth and pass the 18+ check.
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

    -- Attribute the player to a distributor if a valid, active code was given.
    if new.raw_user_meta_data ? 'distributor_code' then
      dist_code := nullif(trim(new.raw_user_meta_data ->> 'distributor_code'), '');
      if dist_code is not null then
        select id into dist_id
        from public.distributors
        where upper(code) = upper(dist_code) and active
        limit 1;
      end if;
    end if;

    insert into public.profiles (id, date_of_birth, age_verified, role, distributor_id)
    values (new.id, dob, true, 'player', dist_id)
    on conflict (id) do nothing;
  else
    -- Distributor/admin account (created via the admin API, no DOB).
    insert into public.profiles (id, date_of_birth, age_verified, role)
    values (new.id, null, false, meta_role)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
