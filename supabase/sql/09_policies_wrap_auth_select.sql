-- Wrap auth.*() calls in RLS policies with (select auth.*()) to avoid per-row re-evaluation
DO $$
DECLARE r RECORD;
        new_qual text;
        new_check text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, COALESCE(qual, '') AS qual, COALESCE(with_check, '') AS with_check
    FROM pg_policies
    WHERE (qual ILIKE '%auth.%()%' OR with_check ILIKE '%auth.%()%')
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;
    IF r.qual <> '' THEN
      new_qual := regexp_replace(r.qual, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'gi');
    END IF;
    IF r.with_check <> '' THEN
      new_check := regexp_replace(r.with_check, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'gi');
    END IF;

    IF new_qual IS DISTINCT FROM r.qual THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', r.policyname, r.schemaname, r.tablename, new_qual);
    END IF;
    IF new_check IS DISTINCT FROM r.with_check THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', r.policyname, r.schemaname, r.tablename, new_check);
    END IF;
  END LOOP;
END $$ LANGUAGE plpgsql;
