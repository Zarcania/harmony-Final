-- 20251105153000_widen_is_admin.sql
-- Etend public.is_admin() pour considérer aussi user_metadata.{role,roles,is_admin}

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(
    (auth.jwt() ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)) as r(role)
      where r.role = 'admin'
    )
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb)) as r2(role)
      where r2.role = 'admin'
    )
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  , false);
$fn$;

commit;
