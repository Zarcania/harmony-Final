-- 01_rls_policies.sql
-- Idempotent policies and indexes for services, bookings, users_profiles.
-- NOTE: Adjust table names if your schema differs.

begin;

-- Enable RLS where needed
alter table if exists public.services enable row level security;
alter table if exists public.bookings enable row level security;
alter table if exists public.users_profiles enable row level security;

-- SERVICES: open SELECT for anon+authenticated
create policy if not exists services_select_all
  on public.services
  for select
  to anon, authenticated
  using (true);

-- BOOKINGS: owner-based access
-- Assume bookings has a column user_id uuid referencing auth.users.id
create policy if not exists bookings_select_own
  on public.bookings
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists bookings_insert_own
  on public.bookings
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists bookings_update_own
  on public.bookings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Optionnel: autoriser l'INSERT anonyme si vous stockez une email et/ou un token propriétaire côté appli
-- create policy if not exists bookings_insert_anon
--   on public.bookings
--   for insert
--   to anon
--   with check (true);

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

commit;
