-- 01_rls_policies.sql
-- Idempotent policies and indexes for services, bookings, profiles.
-- NOTE: Adjust table names if your schema differs.

begin;

-- Enable RLS where needed
alter table if exists public.services enable row level security;
alter table if exists public.bookings enable row level security;
alter table if exists public.profiles enable row level security;

-- Add user_id to bookings if missing, and FK to auth.users
alter table if exists public.bookings
  add column if not exists user_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_user_id_fkey'
  ) then
    alter table public.bookings
      add constraint bookings_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;

-- JWT-based admin helper
-- Returns true if the JWT contains role=admin in either root or app_metadata.{role|roles}
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  /*
    Détection "admin" élargie:
    - JWT root:          role == 'admin'
    - app_metadata:      role == 'admin' OU roles[] contient 'admin'
    - user_metadata:     role == 'admin' OU roles[] contient 'admin' OU is_admin == true

    Remarque: certains projets renseignent le rôle dans user_metadata et non app_metadata.
    Cette version couvre les deux emplacements et accepte un booléen is_admin.
  */
  select coalesce(
    -- Rôle racine du JWT
    (auth.jwt() ->> 'role') = 'admin'
    -- app_metadata.role = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    -- app_metadata.roles contient 'admin'
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)) as r(role)
      where r.role = 'admin'
    )
    -- user_metadata.role = 'admin'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    -- user_metadata.roles contient 'admin'
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb)) as r2(role)
      where r2.role = 'admin'
    )
    -- user_metadata.is_admin = true (booléen)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  , false);
$fn$;

-- Auto-fill user_id on insert with auth.uid() when available
create or replace function public.set_bookings_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'bookings_set_user_id'
  ) then
    create trigger bookings_set_user_id
      before insert on public.bookings
      for each row execute function public.set_bookings_user_id();
  end if;
end $$;

-- SERVICES: open SELECT for anon+authenticated
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'services' and policyname = 'services_select_all'
  ) then
    execute $pol$
      create policy services_select_all on public.services
      for select to anon, authenticated
      using (true)
    $pol$;
  end if;
end $$;

-- BOOKINGS: owner-based access with JWT admin bypass
-- Assume bookings has a column user_id uuid referencing auth.users.id
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_select_own'
  ) then
    execute $pol$
      alter policy bookings_select_own on public.bookings
      using (user_id = auth.uid() or public.is_admin())
    $pol$;
  else
    execute $pol$
      create policy bookings_select_own on public.bookings
      for select to authenticated
      using (user_id = auth.uid() or public.is_admin())
    $pol$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_insert_own'
  ) then
    execute $pol$
      alter policy bookings_insert_own on public.bookings
      with check (public.is_admin() or user_id = auth.uid())
    $pol$;
  else
    execute $pol$
      create policy bookings_insert_own on public.bookings
      for insert to authenticated
      with check (public.is_admin() or user_id = auth.uid())
    $pol$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_update_own'
  ) then
    execute $pol$
      alter policy bookings_update_own on public.bookings
      using (user_id = auth.uid() or public.is_admin())
      with check (user_id = auth.uid() or public.is_admin())
    $pol$;
  else
    execute $pol$
      create policy bookings_update_own on public.bookings
      for update to authenticated
      using (user_id = auth.uid() or public.is_admin())
      with check (user_id = auth.uid() or public.is_admin())
    $pol$;
  end if;
end $$;

-- Autoriser l'INSERT anonyme pour permettre la réservation sans compte
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_insert_anon'
  ) then
    execute $pol$
      create policy bookings_insert_anon on public.bookings
      for insert to anon
      with check (true)
    $pol$;
  end if;
end $$;

-- CHECK constraint pour normaliser les statuts
-- Ajoute la contrainte si absente
do $$
declare
  exists_constraint boolean;
begin
  select exists(
    select 1
    from information_schema.check_constraints c
    join information_schema.constraint_table_usage u
      on c.constraint_name = u.constraint_name
    where u.table_schema = 'public'
      and u.table_name = 'bookings'
      and c.check_clause like '%(status = ANY%pending%confirmed%cancelled%completed%'
  ) into exists_constraint;

  if not exists_constraint then
    alter table public.bookings
      add constraint bookings_status_check
      check (status = any (array['pending','confirmed','cancelled','completed']));
  end if;
end $$;

-- Indexes utiles
-- Attention: CREATE INDEX CONCURRENTLY n'est pas autorisé dans un bloc transactionnel; on le conditionne en dynamique.
-- Essayez de les créer si absents.

-- user_id index
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'bookings_user_id_idx'
  ) then
    execute 'create index concurrently bookings_user_id_idx on public.bookings (user_id)';
  end if;
exception when others then
  -- Fallback non-concurrent si le contexte ne le permet pas
  begin
    if not exists (
      select 1 from pg_indexes where schemaname = 'public' and indexname = 'bookings_user_id_idx'
    ) then
      execute 'create index bookings_user_id_idx on public.bookings (user_id)';
    end if;
  end;
end $$;

-- status index
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'bookings_status_idx'
  ) then
    execute 'create index concurrently bookings_status_idx on public.bookings (status)';
  end if;
exception when others then
  begin
    if not exists (
      select 1 from pg_indexes where schemaname = 'public' and indexname = 'bookings_status_idx'
    ) then
      execute 'create index bookings_status_idx on public.bookings (status)';
    end if;
  end;
end $$;

-- PROFILES: allow users to read their own row
do $$
declare
  has_profiles boolean;
begin
  -- Ne faire ces opérations que si la table public.profiles existe
  select to_regclass('public.profiles') is not null into has_profiles;
  if not has_profiles then
    return;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own'
  ) then
    execute $pol$
      alter policy profiles_select_own on public.profiles
      using (id = auth.uid() or public.is_admin())
    $pol$;
  else
    execute $pol$
      create policy profiles_select_own on public.profiles
      for select to authenticated
      using (id = auth.uid() or public.is_admin())
    $pol$;
  end if;
end $$ language plpgsql;

commit;
