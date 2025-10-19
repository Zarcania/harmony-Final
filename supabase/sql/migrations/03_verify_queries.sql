-- 03_verify_queries.sql
SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public' AND tablename IN ('bookings','service_items','email_logs','cancellation_tokens') ORDER BY 1,2;
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('bookings','service_items','reviews','admin_users');
SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('bookings','service_items','reviews') ORDER BY 1,2;
SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.email_logs'::regclass AND contype='c';
