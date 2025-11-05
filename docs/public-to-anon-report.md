# Rapport: Conversion des policies `TO public` vers `TO anon`/`authenticated`

Date: 2025-10-25
Auteur: Lead dev

## Objectif

- Éliminer toute policy `TO public`.
- Modèle final: deux états côté client Supabase
  - `anon` (visiteur)
  - `authenticated` (admin si `public.profiles.is_admin = true`).
- Lecture publique via `TO anon` (ou `TO anon, authenticated`). Écritures réservées à `authenticated` (et `is_admin()` quand pertinent).

## Scan du dépôt (occurrences "TO public")

Voici les occurrences trouvées (fichier:ligne):

- supabase/migrations/20251008194323_fix_portfolio_categories_rls.sql:23, 28, 33, 39
- supabase/migrations/20251008185451_create_complete_harmonie_cils_schema.sql:226, 266, 301, 351, 427, 464, 498
- supabase/migrations/20251008184059_create_portfolio_categories_table.sql:38
- supabase/migrations/20251002205240_create_admin_content_tables.sql:79, 112, 146, 183, 217, 248
- SETUP_SQL.sql:56, 94, 133, 175, 214, 250

Autres mentions non-structurantes (commentaires):
- supabase/migrations/20251008182851_create_reviews_table.sql:23 (comment)

NB: Les fichiers `SETUP_SQL.sql` et anciens scripts sont référentiels — la migration créée remplace en base les policies effectives.

## Migration créée

- Fichier: `supabase/migrations/20251025153000_public_to_anon.sql`
- Actions clés:
  - Assure l’existence de `public.profiles` et de la fonction `public.is_admin()` (sécurité definer, idempotent).
  - Remplace les policies de lecture `TO public` par `TO anon, authenticated` sur:
    - promotions, services, service_items, portfolio_items, about_content, site_settings, portfolio_categories.
  - Nettoie `portfolio_categories` en supprimant les policies permissives "Public can ..." et, par sécurité, toute ancienne série "Authenticated users can ..."; recrée ensuite:
    - Select: `TO anon, authenticated`.
    - Insert/Update/Delete: `TO authenticated` avec `USING/with check (public.is_admin())`.
  - Bookings: supprime l’ancienne policy d’insert et crée une seule policy claire `bookings_public_create` `TO anon`.

## Policies modifiées (avant → après)

- promotions: "Anyone can view promotions" — `TO public` → `TO anon, authenticated`.
- services: "Anyone can view services" — `TO public` → `TO anon, authenticated`.
- service_items: "Anyone can view service items" — `TO public` → `TO anon, authenticated`.
- portfolio_items: "Anyone can view portfolio items" — `TO public` → `TO anon, authenticated`.
- about_content: "Anyone can view about content" — `TO public` → `TO anon, authenticated`.
- site_settings: "Anyone can view site settings" — `TO public` → `TO anon, authenticated`.
- portfolio_categories:
  - Drop: "Public can view/insert/update/delete categories" et les éventuelles anciennes "Authenticated users can insert/update/delete categories".
  - Create:
    - "Anyone can view categories" — `TO anon, authenticated`.
    - "Admins can insert/update/delete categories" — `TO authenticated` + `public.is_admin()`.
- bookings:
  - Drop: "Anyone can insert bookings".
  - Create: `bookings_public_create` — `FOR INSERT TO anon`.

## Vérif profiles/admin

- La migration:
  - crée `public.profiles` si manquant (user_id uuid, is_admin boolean default false).
  - crée/actualise `public.is_admin()` (SQL stable, security definer, search_path=public) → `exists(select 1 from public.profiles where user_id=auth.uid() and is_admin)`.

## Tests (locaux)

- Typecheck (tsc): PASS
- Lint (eslint): PASS

## Guide de déploiement

1) Appliquer la migration via Supabase (SQL editor ou CLI). 
2) Vérifier que les policies existantes reflètent l’état attendu:
   - `select * from pg_policies where schemaname='public' order by tablename, policyname;`
3) Tester CRUD:
   - anon: lecture `services`, `service_items`, `business_hours`, `portfolio_items`, `promotions`, `about_content`, `site_settings` OK; insert `bookings` OK.
   - authenticated (admin avec `profiles.is_admin=true`): écritures sur les tables admin (ex. `portfolio_categories` via admin) OK.

## Notes

- Aucune policy `TO public` ne subsiste après cette migration.
- Pour durcir d’autres tables d’admin (promotions/services/etc.), des `USING/with check (public.is_admin())` peuvent être ajoutés dans une migration ultérieure si souhaité.
