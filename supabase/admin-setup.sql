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

-- Every account gets an auto-generated display username (see gen_username()).
alter table public.profiles
  add column if not exists username text;

-- Date of birth is no longer collected at signup, so the column is optional.
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
-- 2b. USERNAME GENERATION
--     Every account gets a friendly, Texas-flavored random username
--     (e.g. "LuckyMaverick0423"). Uniqueness is enforced case-insensitively.
-- ---------------------------------------------------------------------
create or replace function public.gen_username()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  adjectives text[] := array[
    'Lucky', 'Golden', 'Wild', 'Lone', 'Bold', 'Royal', 'Ace',
    'Silver', 'Mighty', 'Rowdy', 'Rustler', 'Dusty', 'Rio', 'Blazing'
  ];
  nouns text[] := array[
    'Star', 'Ranger', 'Bronco', 'Cowboy', 'Longhorn', 'Maverick',
    'Armadillo', 'Buckaroo', 'Wrangler', 'Outlaw', 'Stallion', 'Bandit'
  ];
  candidate text;
  attempts int := 0;
begin
  loop
    candidate :=
      adjectives[1 + floor(random() * array_length(adjectives, 1))::int] ||
      nouns[1 + floor(random() * array_length(nouns, 1))::int] ||
      lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (
      select 1 from public.profiles where lower(username) = lower(candidate)
    );
    attempts := attempts + 1;
    if attempts > 25 then
      -- Fall back to a guaranteed-unique value.
      candidate := 'Player' || replace(gen_random_uuid()::text, '-', '');
      exit;
    end if;
  end loop;
  return candidate;
end;
$$;

-- Backfill usernames for any accounts created before this column existed.
do $$
declare
  r record;
begin
  for r in select id from public.profiles where username is null loop
    update public.profiles set username = public.gen_username() where id = r.id;
  end loop;
end$$;

create unique index if not exists profiles_username_key
  on public.profiles (lower(username));

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
--    Creates the profile row for every new account and assigns a random
--    username. Date of birth is optional; if it is supplied it is still
--    validated (not in the future). Players are attributed to a distributor
--    when a valid, active referral code is present in the signup metadata.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dob date;
  meta_role text;
  dist_code text;
  dist_id uuid;
  new_username text;
begin
  meta_role := coalesce(new.raw_user_meta_data ->> 'role', 'player');

  if meta_role not in ('player', 'distributor', 'admin') then
    meta_role := 'player';
  end if;

  new_username := public.gen_username();

  -- Date of birth is optional. Validate it only when it is provided.
  if new.raw_user_meta_data ? 'date_of_birth' then
    dob := nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date;
    if dob is not null and dob > current_date then
      raise exception 'Date of birth cannot be in the future.';
    end if;
  end if;

  if meta_role = 'player' then
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

    insert into public.profiles (id, date_of_birth, age_verified, role, distributor_id, username)
    values (new.id, dob, dob is not null, 'player', dist_id, new_username)
    on conflict (id) do nothing;
  else
    -- Distributor/admin account (created via the admin API).
    insert into public.profiles (id, date_of_birth, age_verified, role, username)
    values (new.id, dob, false, meta_role, new_username)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. ATOMIC BALANCE ADJUSTMENT
--    Locks the player row, computes the new balance, updates it, and
--    writes the audit ledger row -- all in one transaction. This avoids
--    lost updates from concurrent adjustments and guarantees every
--    balance change has a matching ledger entry.
--    Called only by the service-role API (api/portal/balance.js).
-- ---------------------------------------------------------------------
create or replace function public.adjust_balance(
  p_user_id uuid,
  p_action text,
  p_amount numeric,
  p_actor_id uuid,
  p_actor_role text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev numeric(12, 2);
  v_next numeric(12, 2);
  v_role text;
begin
  -- Lock the player's row for the duration of the transaction.
  select balance, role into v_prev, v_role
  from public.profiles
  where id = p_user_id
  for update;

  if not found or v_role <> 'player' then
    raise exception 'PLAYER_NOT_FOUND';
  end if;

  if p_action = 'zero' then
    v_next := 0;
  elsif p_action = 'set' then
    v_next := p_amount;
  elsif p_action = 'add' then
    v_next := v_prev + p_amount;
  else
    raise exception 'INVALID_ACTION';
  end if;

  if v_next < 0 then
    raise exception 'NEGATIVE_BALANCE';
  end if;

  v_next := round(v_next, 2);

  update public.profiles set balance = v_next where id = p_user_id;

  insert into public.balance_adjustments
    (user_id, actor_id, actor_role, previous_balance, new_balance, note)
  values
    (p_user_id, p_actor_id, p_actor_role, v_prev, v_next, p_note);

  return jsonb_build_object('previous', v_prev, 'next', v_next);
end;
$$;
