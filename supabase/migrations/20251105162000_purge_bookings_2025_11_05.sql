-- Purge des rendez-vous de test qui bloquent le 05/11/2025
-- ATTENTION: opération destructive ciblée sur la date demandée

begin;

-- Supprime toutes les réservations du 5 novembre 2025
delete from public.bookings
where preferred_date = date '2025-11-05';

commit;
