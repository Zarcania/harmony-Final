# RLS Policies (Supabase)

Ce script configure des politiques RLS idempotentes pour `services`, `bookings`, et `users_profiles`.

## Fichier
- `supabase/sql/01_rls_policies.sql`

## Hypothèses
- `public.bookings` contient une colonne `user_id uuid` qui référence `auth.users.id`.
- `public.services` est public en lecture.
- `public.users_profiles` contient des données publiques du profil (lecture contrôlée par ailleurs si besoin).

## Politiques
- services: `SELECT` autorisé à `anon` et `authenticated`.
- bookings: `SELECT`, `INSERT`, `UPDATE` autorisés uniquement pour l'utilisateur propriétaire (`user_id = auth.uid()`).
- Statuts `bookings` normalisés via `CHECK (status IN ('pending','confirmed','cancelled','completed'))`.
- Index utiles: `(user_id)`, `(status)`.

## Application
1. Poussez le fichier `supabase/sql/01_rls_policies.sql` et exécutez‑le:
   - via Supabase SQL Editor, ou
   - via `supabase db push` si vous utilisez les migrations locales.
2. Vérifiez dans `Authentication → Policies` que les politiques apparaissent sur `services` et `bookings`.

## Notes
- Le script tente `CREATE INDEX CONCURRENTLY` quand possible, sinon retombe sur un index standard.
- Adaptez les noms de tables si vos schémas diffèrent (`users_profiles` vs `profiles`).
