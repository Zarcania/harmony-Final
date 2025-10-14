/*
  # Système de notifications par email

  1. Nouvelles Tables
    - `email_logs`
      - `id` (uuid, primary key) - Identifiant unique
      - `booking_id` (uuid, foreign key) - Référence à la réservation
      - `email_type` (text) - Type d'email (confirmation, reminder)
      - `recipient_email` (text) - Email du destinataire
      - `sent_at` (timestamptz) - Date et heure d'envoi
      - `status` (text) - Statut de l'envoi (sent, failed)
      - `error_message` (text) - Message d'erreur si échec
      - `created_at` (timestamptz) - Date de création
    
    - `cancellation_tokens`
      - `id` (uuid, primary key) - Identifiant unique
      - `booking_id` (uuid, foreign key) - Référence à la réservation
      - `token` (text, unique) - Token de sécurité pour l'annulation
      - `expires_at` (timestamptz) - Date d'expiration du token
      - `used_at` (timestamptz) - Date d'utilisation du token (null si non utilisé)
      - `created_at` (timestamptz) - Date de création

  2. Sécurité
    - Enable RLS sur les deux tables
    - Politiques restrictives pour protéger les données sensibles
    - Les tokens sont sécurisés et ont une durée de vie limitée

  3. Notes Importantes
    - Les logs permettent de tracer tous les emails envoyés
    - Les tokens permettent l'annulation sécurisée sans authentification
    - Les tokens expirent après la date du rendez-vous
*/

-- Créer la table des logs d'emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'reminder')),
  recipient_email text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('sent', 'failed')) DEFAULT 'sent',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Créer la table des tokens d'annulation
CREATE TABLE IF NOT EXISTS cancellation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON email_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_token ON cancellation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_booking_id ON cancellation_tokens(booking_id);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_tokens ENABLE ROW LEVEL SECURITY;

-- Politique pour email_logs: Seuls les admins peuvent lire les logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Politique pour cancellation_tokens: Personne ne peut lire directement
-- Les tokens seront validés via une Edge Function
CREATE POLICY "No direct access to cancellation tokens"
  ON cancellation_tokens
  FOR SELECT
  TO authenticated
  USING (false);

-- Ajouter une colonne pour tracker si le reminder a été envoyé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_sent'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_sent boolean DEFAULT false;
  END IF;
END $$;

-- Fonction pour générer un token de sécurité
CREATE OR REPLACE FUNCTION generate_cancellation_token(p_booking_id uuid, p_expires_at timestamptz)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Générer un token aléatoire sécurisé
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insérer le token dans la table
  INSERT INTO cancellation_tokens (booking_id, token, expires_at)
  VALUES (p_booking_id, v_token, p_expires_at);
  
  RETURN v_token;
END;
$$;