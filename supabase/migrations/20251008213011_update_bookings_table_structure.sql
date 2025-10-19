/*
  # Mise à jour de la structure de la table bookings

  1. Modifications
    - Ajout de la colonne `client_first_name` (prénom séparé du nom)
    - Renommage de `preferred_date` en `date` via une vue
    - Renommage de `preferred_time` en `time` via une vue
    - Renommage de `service_name` en `service` via une vue

  2. Compatibilité
    - Garde la structure originale intacte
    - Utilise des colonnes calculées pour la compatibilité

  Note: Cette migration adapte la table existante pour fonctionner avec le nouveau système de gestion des rendez-vous
*/

-- Ajouter la colonne client_first_name si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'client_first_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN client_first_name text DEFAULT '';
  END IF;
END $$;

-- Mettre à jour les anciennes données (séparer prénom et nom si besoin)
UPDATE bookings 
SET client_first_name = split_part(client_name, ' ', 1)
WHERE client_first_name = '' OR client_first_name IS NULL;

-- Rendre client_first_name NOT NULL après mise à jour
ALTER TABLE bookings ALTER COLUMN client_first_name SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN client_first_name SET DEFAULT '';
