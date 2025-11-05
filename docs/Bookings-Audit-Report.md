# Audit Réservations & Horaires — Disponibilités, Pauses Déjeuner, Permissions

Dernière mise à jour: 2025-11-03

## Objectifs
- Expliquer pourquoi un créneau restait réservable pendant la pause (12:00–13:00).
- Garantir qu'une prestation longue ne déborde jamais sur des périodes fermées (pause, fin matinée/journée, fermetures exceptionnelles).
- Vérifier la cohérence Supabase (schema, RLS/policies, fonctions) et les liens front ↔ Edge Functions ↔ DB.
- Diagnostiquer le 401 sur la RPC `get_available_slots`.

## Résumé Exécutif
- Front: la génération/validation des créneaux empêche déjà de traverser la pause et la frontière matin/après-midi (vérifications par pas de 30 min dans la/les fenêtre(s) et exclusion des minutes de pause en mode plage unique).
- Edge/DB: l'Edge Function `create-booking` rejette un créneau qui chevauche la pause; la contrainte d'exclusion Postgres empêche les chevauchements.
- RPC: les migrations récentes ont bien ajouté l'exclusion de la pause, mais la fonction n'était plus `SECURITY DEFINER`. Avec RLS actif sur `business_breaks` (sans policy anon), un appel anon renvoie 401.
- Fix livré: une migration rétablit `SECURITY DEFINER`, un `search_path` figé, et des `GRANT EXECUTE` explicites.

## Preuves & Emplacements
- Front (React/TS):
  - `src/contexts/BookingContext.tsx` — `getAvailableSlots` et `checkSlotAvailable`
    - Étapes de 30 min; vérification `inWindow` pour chaque pas de la durée; exclusion des minutes de pause si plage unique.
    - Appelle RPC avec `(p_date, p_duration_minutes, p_slot_step_minutes=30)` et filtre encore pour rester dans fenêtre(s).
- Edge:
  - `supabase/functions/create-booking/index.ts` — Vérifications serveur: refus si fermeture, si [start,end) sort des fenêtres, et si chevauche la pause (erreur `slot_in_break`).
- DB (SQL):
  - `supabase/migrations/20251102093000_update_get_available_slots_breaks.sql` et `20251103091500_add_breaks_to_get_available_slots.sql` — intègrent la pause dans `get_available_slots` (exclusion via `tstzrange` ou intervalle explicite), validation de chevauchement avec bookings.
  - `supabase/schema.sql` — RLS activé; `business_hours` SELECT public; `closures` SELECT public limité à à-venir; `business_breaks`: pas de policy anon SELECT.
  - Contrainte: `bookings_no_overlap_excl` empêche tout chevauchement.

## Root Causes & Effets
- Créneau réservable pendant 12:00–13:00 côté UI: non reproduit dans la logique actuelle (les étapes de 30 min + fenêtres/break bloquent). Une incohérence était possible si seule la RPC proposait un créneau traversant la pause. Les migrations récentes RPC excluent désormais la pause. La cause user-facing la plus probable est un échec de la RPC (401), déclenchant un fallback local qui varie selon configuration, ou des horaires/breaks mal saisis.
- 401 sur `get_available_slots`: 
  - RLS sur `business_breaks` sans policy anon, 
  - nouvelle fonction sans `SECURITY DEFINER` et sans `GRANT EXECUTE` explicite (ou non effectif en prod),
  - donc l'appel anon échoue.

## Actions Appliquées
- Migration ajoutée: `supabase/migrations/20251103120000_secure_get_available_slots.sql`
  - Applique `SECURITY DEFINER` et `search_path = public, extensions` à la fonction `public.get_available_slots(date,int,int,int)`.
  - Révoque PUBLIC et re-grant `EXECUTE` à `anon`, `authenticated`, `service_role`.

## Garanties « pas de débordement »
- UI/Front: un créneau n'est proposé que si l'ensemble des pas de 30 minutes de la prestation restent intégralement dans une même fenêtre valide (AM ou PM), et hors pause si plage unique.
- RPC: exclut tout slot qui chevauche la pause définie du jour et tout overlap avec une réservation existante.
- Edge: refuse toute insertion qui chevauche la pause, les fermetures, ou sort des horaires d'ouverture.
- DB: contrainte d'exclusion empêche les chevauchements sur les heures confirmées.

## Scénarios de Test Recommandés
- Jour avec AM 09:00–12:00, PM 13:00–18:00, pause 12:00–13:00.
  - 11:00, durée 60 min → OK (11:00–12:00).
  - 11:30, durée 60 min → KO (chevauche 12:00–12:30) — UI ne propose pas; Edge renverra `slot_in_break` si soumis.
  - 17:30, durée 60 min → KO (dépasserait 18:00) — UI ne propose pas; Edge renverra `slot_outside_hours` si soumis.
  - 11:00, durée 120 min → KO (déborderait sur pause) — UI ne propose pas; Edge renverra `slot_in_break`.

## Recos Complémentaires (optionnelles)
- Surveiller que les migrations de RPCs conservent toujours: `SECURITY DEFINER`, `search_path` fixe, et `GRANT` explicites.
- Si vous préférez éviter `SECURITY DEFINER`, ajouter une policy SELECT anon minimale sur `business_breaks` (lecture seule) — à valider RGPD/produit.
- Ajouter un test d’intégration léger côté CI (appel RPC en anon avec un jeu de données de test) pour éviter la régression 401.

## Notes
- `upsert-hours` dérive automatiquement la pause à partir d’AM/PM quand applicable; `upsert-breaks` durcit la validation des bornes.
- La timezone est fixée à `Europe/Paris` pour slots et validations.
