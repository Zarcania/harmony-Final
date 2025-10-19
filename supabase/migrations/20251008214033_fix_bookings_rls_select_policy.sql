/*
  # Correction des politiques RLS pour la lecture des rendez-vous

  1. Modifications
    - Ajouter une politique SELECT pour les utilisateurs anonymes (anon)
    - Permet aux visiteurs du site de voir les créneaux disponibles
    - Les utilisateurs authentifiés (admins) gardent leur accès complet

  2. Sécurité
    - Les utilisateurs anonymes peuvent lire les rendez-vous (pour voir les créneaux disponibles)
    - Les utilisateurs anonymes peuvent créer des rendez-vous (réservations publiques)
    - Seuls les utilisateurs authentifiés peuvent modifier/supprimer

  Note: Cette correction permet aux visiteurs du site de voir les créneaux disponibles
  et à l'admin de voir tous les rendez-vous dans le planning.
*/

-- Supprimer l'ancienne politique SELECT restrictive si elle existe
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;

-- Créer une nouvelle politique SELECT pour tout le monde (anon + authenticated)
CREATE POLICY "Anyone can view bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);
