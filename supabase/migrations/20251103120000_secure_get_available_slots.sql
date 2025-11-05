-- Harden get_available_slots with SECURITY DEFINER and fixed search_path
-- Also ensure proper EXECUTE privileges for anon/authenticated/service_role
-- This addresses 401 errors when anon calls the RPC under RLS constraints.

DO $$
BEGIN
  -- Only apply if the function exists with the expected signature
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_available_slots'
      AND pg_get_function_identity_arguments(p.oid) = 'p_date date, p_duration_minutes integer, p_slot_step_minutes integer, p_buffer_minutes integer'
  ) THEN
    -- Set SECURITY DEFINER and a deterministic search_path
    ALTER FUNCTION public.get_available_slots(
      p_date date,
      p_duration_minutes integer,
      p_slot_step_minutes integer,
      p_buffer_minutes integer
    ) SECURITY DEFINER;

    ALTER FUNCTION public.get_available_slots(
      p_date date,
      p_duration_minutes integer,
      p_slot_step_minutes integer,
      p_buffer_minutes integer
    ) SET search_path = public, extensions;

    -- Revoke PUBLIC and re-grant explicit roles
    REVOKE ALL ON FUNCTION public.get_available_slots(
      p_date date,
      p_duration_minutes integer,
      p_slot_step_minutes integer,
      p_buffer_minutes integer
    ) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION public.get_available_slots(
      p_date date,
      p_duration_minutes integer,
      p_slot_step_minutes integer,
      p_buffer_minutes integer
    ) TO anon, authenticated, service_role;
  END IF;
END $$;
