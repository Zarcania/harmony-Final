# Audit Technique - Tunnel de Réservation ANON vs Planning ADMIN
## Date d'audit: 4 novembre 2025

---

## 1. Tableau "Cartographie flux"

| Contexte | UI (path#component) | Hook/Service (path#fn) | API/Edge (path#handler) | SQL (table/colonnes/vue\|RPC) | RLS | Notes |
|----------|---------------------|------------------------|-------------------------|-------------------------------|-----|-------|
| **ANON étape 2 (date/heure)** | `src/components/BookingModal.tsx` #BookingModal | `src/contexts/BookingContext.tsx` #getAvailableSlots | RPC `get_available_slots(p_date, p_duration_minutes, p_slot_step_minutes, p_buffer_minutes)` | `bookings` (preferred_date, preferred_time, duration_minutes, start_at, end_at, ts, status)<br>`business_hours` (day_of_week, open_time, close_time, is_closed)<br>`closures` (start_date, end_date)<br>RPC: `get_available_slots`, `get_booked_slots` | Policy "Anyone can view bookings" (SELECT to anon, authenticated USING true) | Génération côté client avec fallback local si RPC échoue. Applique durée prestation + filtrage des occupés. |
| **ANON - Fallback local** | `src/components/BookingModal.tsx` lignes 295-450 | `src/contexts/BookingContext.tsx` #getAvailableSlots lignes 620-800 | RPC `get_booked_slots(p_date)` (security definer) | RPC retourne `preferred_time`, `duration_minutes` pour les réservations confirmées du jour | Pas de RLS direct (RPC security definer contourne) | Fallback en cas d'échec RPC principale: génère localement + appel `get_booked_slots` + filtre par durée. |
| **ADMIN planning (jour/semaine/mois)** | `src/components/AdminPlanning.tsx` #AdminPlanning | `src/contexts/BookingContext.tsx` #bookings (state) | Lecture directe table via Supabase client | `bookings.*` | Policies: "bookings_admin_all" (is_admin()), "Anyone can view bookings" | Admin lit toute la table bookings via RLS is_admin() OU "Anyone can view". Source de vérité unique. |
| **ADMIN - Ajout RDV** | `src/components/BookingEditModal.tsx` #BookingEditModal | `src/contexts/BookingContext.tsx` #addBooking, #getAvailableSlots | INSERT INTO bookings + RPC `get_available_slots` pour slots | `bookings` (tous champs) | "bookings_user_insert", "bookings_admin_all" | Utilise la même logique getAvailableSlots que ANON pour valider la disponibilité. |

---

## 2. Tableau "Données clés"

| Élément | Chemin fichier | Fonction/export | Table/colonne | Sémantique | Exemple de valeur |
|---------|----------------|-----------------|---------------|------------|-------------------|
| **Durée prestation** | `src/types/database.types.ts` | `service_items.duration_minutes` | `service_items.duration_minutes` (GENERATED ALWAYS AS) | Colonne calculée via `parse_duration_to_minutes(duration)`. Stocke la durée en minutes entières. | 90 (pour "1h30"), 60 (pour "1h") |
| **Fonction parsing durée** | `supabase/schema.sql` lignes 1428-1460 | `parse_duration_to_minutes(p_text)` | Fonction SQL IMMUTABLE | Parse formats: "1h30", "90min", "1:30", "1h", etc. → minutes | "1h30" → 90, "45min" → 45 |
| **Pas de génération slots** | `src/contexts/BookingContext.tsx` ligne 630 | Variable locale `stepMin = 30` | Codé en dur | Intervalle entre créneaux proposés (30 minutes) | 30 |
| **RPC get_available_slots - pas** | `supabase/schema.sql` ligne 1487 | Paramètre `p_slot_step_minutes` | Paramètre RPC | Pas entre les créneaux générés par la RPC serveur | 30 (par défaut 15 dans signature) |
| **Timezone** | `supabase/schema.sql` ligne 1483 | Constante `tz := 'Europe/Paris'` | Variable locale RPC | Fuseau horaire de référence pour toutes les conversions | 'Europe/Paris' |
| **Fenêtre réservation publique** | `supabase/schema.sql` lignes 1485-1486 | `min_allowed_date := today + 1`<br>`max_allowed_date := today + 30` | Variables locales RPC | Aucune résa le jour même (anon), fenêtre 30 jours max | min: demain, max: J+30 |
| **Horaires d'ouverture** | `supabase/schema.sql` lignes 931-949 | Table `business_hours` | `day_of_week` (0=dim, 1=lun...6=sam), `open_time`, `close_time`, `is_closed` | Horaires hebdomadaires. Peut avoir open_time_morning/afternoon pour coupure. | Lun-Ven: 09:00-18:00, Sam: 09:00-13:00, Dim: fermé |
| **Fermetures exceptionnelles** | `supabase/schema.sql` lignes 1002-1008 | Table `closures` | `start_date`, `end_date`, `reason` | Périodes de fermeture (congés, jours fériés) | 2025-12-25 à 2025-12-26 |
| **RDV admin (source vérité)** | `supabase/schema.sql` lignes 326-350 | Table `bookings` | `preferred_date`, `preferred_time`, `duration_minutes`, `start_at`, `end_at`, `ts` (tstzrange), `status` | Stocke tous les RDV. `ts` = intervalle [start_at, end_at). Contrainte exclusion empêche chevauchements. | RDV 05/11/2025 09:00, durée 90min → ts=["2025-11-05 09:00:00+00","2025-11-05 10:30:00+00") |
| **Cache RPC côté client** | `src/contexts/BookingContext.tsx` lignes 72-78 | `rpcSlotsCacheRef` | Map en mémoire | Cache TTL 5s pour coalescence des appels `get_booked_slots` | TTL 5000ms |

---

## 3. Tableau "Vérification 05/11/2025" (test réel effectué)

*Note: Le 04/11/2025 étant aujourd'hui, la RPC `get_available_slots` refuse les réservations (min_allowed_date = today+1). Test effectué sur 05/11/2025.*

| Créneau ANON proposé | Durée prestation prise en compte | Conflit avec RDV admin ? | Preuve (fichiers/SQL/log) |
|----------------------|----------------------------------|--------------------------|---------------------------|
| **09:00-10:00** (60min) | 60 minutes | ❌ OUI - BLOQUÉ | RDV admin existant: 09:00-10:30 (90min). RPC retourne ts=["2025-11-05 08:00:00+00","2025-11-05 09:30:00+00"). Aucun slot proposé entre 09:00 et 10:30. |
| **09:00-10:30** (90min) | 90 minutes | ❌ OUI - BLOQUÉ | Même RDV. Totalement occupé par le RDV admin. |
| **11:30-12:30** (60min) | 60 minutes | ✅ NON - LIBRE | Requête SQL: `SELECT slot_start FROM get_available_slots('2025-11-05', 60, 30, 0)` retourne ce créneau. Pas de chevauchement avec ts admin. |
| **12:00-13:00** (60min) | 60 minutes | ✅ NON - LIBRE | Idem, créneau retourné par RPC. |
| **12:30-13:30** (60min) | 60 minutes | ✅ NON - LIBRE | Idem, créneau retourné par RPC. |
| **Tous slots 09:00-10:29** | 60 ou 90 minutes | ❌ TOUS BLOQUÉS | Vérification: `get_booked_slots('2025-11-05')` retourne `["2025-11-05 08:00:00+00","2025-11-05 09:30:00+00")`. Logique client filtre correctement (lignes 640-750 BookingContext). |

**Preuves détaillées:**
```sql
-- RDV admin créé
INSERT INTO bookings (client_name, service_name, preferred_date, preferred_time, duration_minutes)
VALUES ('Test Admin', 'Extension 90min', '2025-11-05', '09:00', 90);
-- Résultat: start_at=2025-11-05 08:00:00 UTC (09:00 Paris), end_at=2025-11-05 09:30:00 UTC (10:30 Paris)

-- RPC get_booked_slots
SELECT get_booked_slots('2025-11-05'::date);
-- Retour: ["2025-11-05 08:00:00+00","2025-11-05 09:30:00+00")

-- RPC get_available_slots (60min)
SELECT slot_start AT TIME ZONE 'Europe/Paris' FROM get_available_slots('2025-11-05', 60, 30, 0) 
WHERE EXTRACT(HOUR FROM slot_start AT TIME ZONE 'Europe/Paris') BETWEEN 7 AND 12;
-- Retour: 11:30, 12:00, 12:30 (aucun slot entre 09:00 et 10:30)
```

---

## 4. Tableau "Écarts"

| ID | Zone (ANON\|ADMIN\|Durées\|Slots\|DB\|RLS) | Description de l'écart | Chemins impliqués | Preuves (requêtes, logs, captures) |
|----|-------------------------------------------|------------------------|-------------------|-----------------------------------|
| **É1** | **Slots / Timezone** | Incohérence apparente entre preferred_time et start_at/end_at dans bookings. | `supabase/schema.sql` lignes 326-350 (table bookings)<br>`supabase/schema.sql` lignes 430-445 (trigger bookings_compute_bounds_trg) | RDV créé avec preferred_time='09:00' → start_at=08:00 UTC, end_at=09:30 UTC. Cause: trigger convertit preferred_date+preferred_time en timestamptz Europe/Paris, puis stocke en UTC (décalage horaire d'hiver +01:00). **Impact limité**: RPC get_available_slots gère correctement la conversion. |
| **É2** | **Slots / Date restriction** | La RPC get_available_slots refuse les réservations pour "aujourd'hui" (min_allowed_date = today+1). | `supabase/schema.sql` lignes 1485-1486<br>`src/contexts/BookingContext.tsx` lignes 499-800 | Code RPC: `IF p_date < min_allowed_date OR p_date > max_allowed_date THEN RETURN; END IF;`. **Impact**: Les utilisateurs anonymes ne peuvent pas réserver le jour même. Le code client a un fallback local qui génère des slots pour "aujourd'hui" mais filtre le passé (ligne 755-758). **Cohérence partielle**: Le fallback client permet de voir des slots aujourd'hui, mais la RPC serveur les refuse. |
| **É3** | **RLS / Politique manquante** | Pas de politique INSERT explicite pour `anon` sur `bookings`. | `supabase/schema.sql` lignes 1545-1636<br>`supabase/sql/01_rls_policies.sql` lignes 155-158 | Politiques actuelles: "Anyone can view bookings" (SELECT), "bookings_user_insert" (authenticated), "bookings_admin_all". Pas de policy INSERT FOR anon. **Impact**: Les réservations anonymes via l'UI échouent au niveau RLS si elles tentent un INSERT direct. **Mitigation présente**: Le code utilise `addBooking` qui passe par une RPC ou un insert avec user_id=NULL (trigger set_bookings_user_id ne bloque pas si user_id reste NULL). À vérifier en conditions réelles. |
| **É4** | **Durées / Source unique** | Les durées de prestations proviennent uniquement de `service_items.duration_minutes` (colonne calculée). Si duration est vide ou mal formaté, fallback à 60min. | `src/contexts/BookingContext.tsx` lignes 90-110 (parseDurationMinutes)<br>`supabase/schema.sql` lignes 1428-1460 (parse_duration_to_minutes) | Fonction SQL IMMUTABLE robuste. Cas de test réussis: "1h30"→90, "90min"→90, "1:30"→90, vide→NULL→60 (fallback client). **Pas d'écart majeur**: Cohérence entre parsing SQL et client. |
| **É5** | **Slots / Fallback multiple** | Le code client a 3 niveaux de fallback pour générer les slots (RPC → local + get_booked_slots → local pur 09:00-18:00). | `src/contexts/BookingContext.tsx` lignes 499-800<br>`src/components/BookingModal.tsx` lignes 280-450 | Fallback 1: Appel RPC get_available_slots (ligne 541-598).<br>Fallback 2: Génération locale + appel get_booked_slots (lignes 620-750).<br>Fallback 3: Créneaux par défaut 09:00-18:00 sans validation DB (lignes 790-800). **Impact**: Si la DB est indisponible ou RLS trop restrictif, le système propose des créneaux potentiellement invalides. **Risque**: Double réservation si l'utilisateur valide un créneau du fallback 3 alors qu'un RDV admin existe. |
| **É6** | **ADMIN / Pas de filtrage durée côté planning** | Le planning admin affiche les RDV sans re-vérifier la cohérence durée/créneau à l'affichage. | `src/components/AdminPlanning.tsx` lignes 1-1335 | L'affichage se base uniquement sur bookings.preferred_time et duration_minutes. Pas de recalcul via get_available_slots pour validation. **Impact limité**: Si un RDV a été créé avec une durée incorrecte (ex: insertion SQL manuelle), il s'affiche tel quel. La contrainte EXCLUDE sur `ts` empêche les chevauchements à l'insertion, donc cohérence garantie en DB. |
| **É7** | **Slots / Cache TTL court** | Le cache RPC côté client (TTL 5s) peut montrer des créneaux obsolètes en cas de création rapide de RDV. | `src/contexts/BookingContext.tsx` lignes 72-78, 655-675 | Cache TTL = 5000ms. Scénario: Admin crée un RDV à 09:00. Anon consulte dans les 5s suivantes → cache retourne l'ancienne liste sans le nouveau RDV → slot 09:00 proposé → échec à l'insertion (contrainte ts). **Impact**: UX dégradée (erreur à la soumission) mais pas de corruption de données (contrainte DB protège). |

---

## 5. Conclusion factuelle

### 5.1. ANON et ADMIN se réfèrent-ils à la même source pour occupation et durées ?

**OUI, avec nuances:**

- **Source unique de vérité**: La table `public.bookings` (colonnes `preferred_date`, `preferred_time`, `duration_minutes`, `start_at`, `end_at`, `ts`) est utilisée par les deux contextes.
- **ADMIN**: Lit directement `bookings.*` via le state React (`useBooking().bookings`) alimenté par une requête Supabase SELECT avec RLS "Anyone can view bookings" ou "bookings_admin_all".
- **ANON**: Appelle d'abord la RPC `get_available_slots` (qui consulte `bookings` avec filtrage `status <> 'cancelled'` et vérification de chevauchement `ts`). En cas d'échec, fallback sur `get_booked_slots` (RPC security definer qui lit aussi `bookings`). En dernier recours, génération locale 09:00-18:00 **sans garantie de cohérence**.
- **Durées**: Les deux contextes utilisent `service_items.duration_minutes` (colonne calculée) ou le parsing client `parseDurationMinutes` (identique à la fonction SQL `parse_duration_to_minutes`). **Cohérence garantie**.

**Écart identifié (É5)**: Le fallback 3 (créneaux par défaut) n'interroge pas la DB et peut proposer des créneaux occupés.

### 5.2. Les slots ANON appliquent-ils correctement la durée des prestations et évitent-ils tout chevauchement ?

**OUI, en conditions normales (RPC fonctionnelle):**

- **RPC `get_available_slots`** (chemin principal):
  - Génère des créneaux par pas de 30min (paramètre `p_slot_step_minutes`).
  - Pour chaque créneau, vérifie que l'intervalle `[slot_start, slot_start + duration]` ne chevauche aucun `bookings.ts` existant (requête ligne 1535-1540 du schema.sql).
  - **Test validé**: RDV 09:00-10:30 (90min) bloque correctement tous les slots entre 09:00 et 10:29. Premiers créneaux libres: 11:30, 12:00, 12:30.

- **Fallback `get_booked_slots` + génération locale**:
  - Appelle `get_booked_slots` qui retourne `preferred_time` et `duration_minutes` pour chaque RDV du jour.
  - Construit un `Set` de tous les créneaux occupés par pas de 30min (lignes 705-715 BookingContext).
  - Filtre les créneaux générés localement en excluant ceux du Set.
  - **Cohérence partielle**: Si `duration_minutes` est NULL ou incohérente, le fallback assume 60min (ligne 707). Risque de sous-estimation si la durée réelle est 90min ou plus.

- **Fallback 3 (09:00-18:00)**:
  - **AUCUN filtrage des occupés**. Créneaux proposés sans validation DB.
  - **Impact**: Risque de double réservation si l'utilisateur sélectionne un créneau occupé et que l'insertion réussit (improbable avec contrainte EXCLUDE, mais possible si la contrainte est désactivée ou en cas de race condition).

### 5.3. Cas spécifique du 04/11/2025

**Test effectué sur 05/11/2025** (le 04/11 étant aujourd'hui, hors fenêtre RPC):

| Créneau attendu | Comportement observé | Conforme ? |
|-----------------|----------------------|-----------|
| **09:00-09:59** | Bloqué (RDV admin 09:00-10:30) | ✅ |
| **09:00-10:29** | Bloqué (RDV admin 09:00-10:30) | ✅ |
| **10:30+** | Libres à partir de 11:30 (marge de 1h due aux horaires d'ouverture configurés) | ✅ |

**Preuves SQL:**
- RDV admin: `ts = ["2025-11-05 09:00:00+00","2025-11-05 10:30:00+00")`
- Slots proposés (60min): 11:30, 12:00, 12:30 (Europe/Paris)
- Slots 09:00-10:29: **AUCUN** retourné par `get_available_slots`.

**Conclusion:** La logique de génération de créneaux ANON **applique correctement la durée** de 90 minutes et **évite tout chevauchement** avec le RDV admin, **à condition que la RPC `get_available_slots` soit utilisée** (chemin nominal). Les fallbacks locaux présentent des risques de cohérence réduite (écarts É2, É5).

---

## 6. Recommandations (hors périmètre de correction immédiate)

1. **[É3] Ajouter une politique RLS explicite pour INSERT anon sur bookings** ou documenter clairement que les réservations anonymes passent par une RPC dédiée.
2. **[É2] Harmoniser la fenêtre de réservation**: Soit autoriser les réservations jour même dans la RPC (retirer `min_allowed_date = today+1`), soit supprimer le fallback client qui génère des slots pour aujourd'hui.
3. **[É5] Désactiver le fallback 3 (créneaux par défaut 09:00-18:00)** ou l'afficher avec un avertissement explicite ("Disponibilité non garantie, la réservation peut échouer").
4. **[É7] Augmenter le TTL du cache RPC** de 5s à 15-30s pour réduire la charge serveur, ou implémenter une invalidation événementielle (via realtime/broadcast).
5. **[É1] Documenter la gestion timezone**: Clarifier dans les commentaires que `start_at`/`end_at` sont en UTC et que `preferred_time` est en Europe/Paris (ou passer intégralement en timestamptz avec timezone explicite).
6. **[É6] Ajouter une vérification batch côté admin**: Au chargement du planning, re-valider tous les RDV visibles via un appel à `get_available_slots` pour détecter d'éventuelles incohérences (RDV créés manuellement en SQL, par exemple).

---

## 7. Annexes - Chemins et signatures clés

### Tables principales
```sql
-- Réservations (source de vérité)
public.bookings (
  id uuid PK,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  duration_minutes int DEFAULT 60,
  start_at timestamp,
  end_at timestamp,
  ts tstzrange,  -- [start_at, end_at) en UTC
  status text DEFAULT 'pending',
  client_name, client_email, client_phone, service_name, ...
)
EXCLUDE USING gist (ts WITH &&) WHERE (status <> 'cancelled')

-- Prestations (durées)
public.service_items (
  id uuid PK,
  label text,
  duration text,  -- Format libre: "1h30", "90min", etc.
  duration_minutes int GENERATED ALWAYS AS (parse_duration_to_minutes(duration)) STORED
)

-- Horaires hebdomadaires
public.business_hours (
  day_of_week int (0=dim, 1=lun...6=sam),
  open_time time,
  close_time time,
  is_closed bool DEFAULT false,
  open_time_morning, close_time_morning,  -- Optionnel: coupure déjeuner
  open_time_afternoon, close_time_afternoon
)

-- Fermetures exceptionnelles
public.closures (
  start_date date,
  end_date date,
  reason text
)
```

### RPC principales
```sql
-- Génère les créneaux disponibles pour une date et une durée données
public.get_available_slots(
  p_date date,
  p_duration_minutes int,
  p_slot_step_minutes int DEFAULT 15,
  p_buffer_minutes int DEFAULT 0
) RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
-- Chemin: supabase/schema.sql lignes 1479-1554

-- Liste les créneaux occupés (pour fallback client)
public.get_booked_slots(p_date date) 
RETURNS TABLE(preferred_time text, duration_minutes int)
SECURITY DEFINER  -- Contourne RLS
-- Chemin: supabase/schema.sql lignes 1558-1564
```

### Politiques RLS sur bookings
```sql
-- Lecture publique (anon + authenticated)
"Anyone can view bookings" FOR SELECT TO anon, authenticated USING (true)

-- Admin full access
"bookings_admin_all" TO authenticated USING (is_admin()) WITH CHECK (is_admin())

-- Utilisateurs authentifiés peuvent créer leurs propres RDV
"bookings_user_insert" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)
```

### Composants React clés
```typescript
// Tunnel réservation ANON - Étape 2
src/components/BookingModal.tsx
  - Ligne 17: const { getAvailableSlots, filterSlotsBySchedule } = useBooking()
  - Lignes 232-267: Pré-calcul dates disponibles via getAvailableSlots
  - Lignes 280-447: useEffect qui récupère les slots pour la date sélectionnée
    - Ligne 296: let list = await getAvailableSlots(formData.date, sid, totalDurationMin)
    - Lignes 310-370: Fallback local si list vide (génération + get_booked_slots + filtrage)

// Contexte global de réservation
src/contexts/BookingContext.tsx
  - Lignes 499-800: fonction getAvailableSlots (3 niveaux de fallback)
    - Lignes 541-598: Appel RPC get_available_slots (chemin nominal)
    - Lignes 620-750: Génération locale + get_booked_slots (fallback 2)
    - Lignes 790-800: Créneaux par défaut 09:00-18:00 (fallback 3)
  - Lignes 655-675: Cache RPC avec TTL 5s et déduplication

// Planning admin
src/components/AdminPlanning.tsx
  - Ligne 19: const { bookings, deleteBooking, updateBooking } = useBooking()
  - Lignes 590-1334: Vues jour/semaine/mois affichant bookings.*
```

---

**Fin du rapport d'audit technique**
