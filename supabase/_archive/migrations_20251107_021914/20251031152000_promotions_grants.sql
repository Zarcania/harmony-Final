-- Ensure authenticated role has DML privileges on promotions (RLS still applies)
BEGIN;
GRANT INSERT, UPDATE, DELETE ON TABLE public.promotions TO authenticated;
COMMIT;
