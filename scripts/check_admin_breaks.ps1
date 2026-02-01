#!/usr/bin/env pwsh
# Vérifier les admin_breaks dans la base locale

$env:PGPASSWORD='postgres'

Write-Host "====== Admin Breaks (Février 2026) ======" -ForegroundColor Cyan

# Lister toutes les admin_breaks de février 2026
psql -h localhost -p 54322 -U postgres -d postgres -c @"
SELECT 
  id,
  CASE 
    WHEN start_date = end_date THEN to_char(start_date, 'DD/MM/YYYY')
    ELSE to_char(start_date, 'DD/MM') || ' - ' || to_char(end_date, 'DD/MM/YYYY')
  END as dates,
  COALESCE(start_time::text, 'Journée entière') as debut,
  COALESCE(end_time::text, '') as fin,
  COALESCE(reason, 'Aucune raison') as motif,
  enabled
FROM public.admin_breaks
WHERE (start_date >= '2026-02-01' AND start_date <= '2026-02-28')
   OR (end_date >= '2026-02-01' AND end_date <= '2026-02-28')
ORDER BY start_date, start_time;
"@

Write-Host ""
Write-Host "====== Business Breaks (Mardi) ======" -ForegroundColor Cyan

# Lister les business_breaks pour le mardi (day_of_week=2)
psql -h localhost -p 54322 -U postgres -d postgres -c @"
SELECT 
  id,
  CASE day_of_week
    WHEN 0 THEN 'Lundi'
    WHEN 1 THEN 'Mardi'
    WHEN 2 THEN 'Mercredi'
    WHEN 3 THEN 'Jeudi'
    WHEN 4 THEN 'Vendredi'
    WHEN 5 THEN 'Samedi'
    WHEN 6 THEN 'Dimanche'
  END as jour,
  break_start,
  break_end,
  enabled
FROM public.business_breaks
WHERE enabled = true
ORDER BY day_of_week;
"@

Write-Host ""
Write-Host "====== Test get_available_slots Mardi 3 Février 2026 ======" -ForegroundColor Cyan

# Tester la fonction pour le mardi 3 février 2026
psql -h localhost -p 54322 -U postgres -d postgres -c @"
SELECT 
  to_char(slot_start, 'HH24:MI') as heure_debut,
  to_char(slot_end, 'HH24:MI') as heure_fin
FROM get_available_slots('2026-02-03'::date, 60, 30, 0)
ORDER BY slot_start;
"@

Write-Host ""
Write-Host "====== Horaires d'ouverture Mardi (day_of_week=1) ======" -ForegroundColor Cyan

# Vérifier les horaires pour le mardi
psql -h localhost -p 54322 -U postgres -d postgres -c @"
SELECT 
  CASE day_of_week
    WHEN 0 THEN 'Lundi'
    WHEN 1 THEN 'Mardi'
    WHEN 2 THEN 'Mercredi'
    WHEN 3 THEN 'Jeudi'
    WHEN 4 THEN 'Vendredi'
    WHEN 5 THEN 'Samedi'
    WHEN 6 THEN 'Dimanche'
  END as jour,
  open_time,
  close_time,
  is_closed
FROM public.business_hours
WHERE day_of_week = 1;
"@
