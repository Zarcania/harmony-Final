# Export CSV Supabase (sans Docker)

Ce dossier contient les exports CSV de tes tables Supabase pour figer un instantané des données directement dans le repo (lecture seule; rien n'est poussé sur Supabase).

## Fichiers CSV présents

Dans `supabase/seed/csv/`, les en-têtes CSV suivants sont prêts (tu peux coller les données exportées du Dashboard dedans):

- about_content.csv
- admin_users.csv
- booking_items.csv
- bookings.csv
- business_hours.csv
- cancellation_tokens.csv
- closures.csv
- email_logs.csv
- portfolio_categories.csv
- portfolio_items.csv
- profiles.csv
- promotions.csv
- reviews.csv
- services.csv
- service_items.csv
- site_settings.csv

Astuce: l'ordre des colonnes n'a pas besoin d'être strict tant que les noms d'en-têtes correspondent aux colonnes de la table.

## Deux méthodes pour remplir ces CSV

1) Méthode manuelle (Dashboard) — recommandée si certaines tables ne sont pas en lecture publique:
   - Va dans Supabase Dashboard > Table Editor
   - Ouvre chaque table puis "Export" → CSV
   - Enregistre sous `supabase/seed/csv/<nom_table>.csv`
   - Ordre conseillé (respect des clés étrangères):
     1. services
     2. service_items
     3. portfolio_categories
     4. portfolio_items
     5. promotions
     6. about_content
     7. site_settings
     8. reviews (exporte uniquement les publiées si RLS)
     9. business_hours
     10. closures
     11. bookings (nécessite droits; sinon ignorer)

2) Script automatique (API REST, sans Docker)
   - Prérequis: `.env.local` contient `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
   - Exécute: `npm run supabase:csv-export`
   - Le script tente d’exporter les tables listées avec le rôle `anon`. Si une table n’est pas lisible en public (RLS), elle sera ignorée avec un message d’avertissement.

## Notes
- Les CSV ainsi exportés servent de "seed" documentaire dans le repo. Ils n’importent rien automatiquement.
- Pour importer dans une base plus tard, on pourra ajouter un script d'import (API REST) qui relit ces CSV et insère les lignes dans le bon ordre. Dis-moi si tu le veux maintenant.
