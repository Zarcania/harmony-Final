# Emails de réservation (Supabase Edge Functions + Resend)

Ce projet envoie des emails de confirmation (et de rappel) via des Edge Functions Supabase et l'API Resend.

## Secrets requis (Cloud et Local)

Ajoutez ces secrets dans votre projet Supabase (Project Settings → Config → Secrets):

- `RESEND_API_KEY` (obligatoire)
  - Clé API Resend avec l'autorisation "Accès complet".
- `PUBLIC_SITE_URL` (recommandé)
  - URL publique utilisée dans les liens de confirmation/annulation.
  - Ex: `https://harmoniecils.com` en prod; `http://localhost:5173` en dev.
- `ALLOWED_ORIGINS` (obligatoire pour CORS correct)
  - Liste CSV des origines autorisées côté front.
  - Ex: `https://harmoniecils.com,http://localhost:5173`

Astuce: le `SERVICE_ROLE_KEY`/`SUPABASE_SERVICE_ROLE_KEY` est injecté par Supabase; ne le définissez pas manuellement.

## Déploiement des functions (Production)

1) Poussez le code ou utilisez le CLI Supabase:

- Créer/mettre à jour `create-booking` et `send-booking-confirmation`:
  - `create-booking` insère la réservation et appelle `send-booking-confirmation` quand `status === 'confirmed'`.
  - Nous avons renforcé l'appel avec les en-têtes `Authorization: Bearer <service_key>` et `apikey: <service_key>`.

2) Depuis le Dashboard Supabase:
- Allez dans Edge Functions → déployez/actualisez `create-booking` et `send-booking-confirmation`.
- Vérifiez que les secrets ci‑dessus sont bien définis (Project Settings → Secrets). Redéployez après tout changement de secret.

3) Vérifications rapides:
- Supabase → Logs → Edge Functions
  - Filtrez `create-booking` puis `send-booking-confirmation`. Vous devez voir un événement 200 pour les deux.
- Base de données → Table `email_logs`
  - Une ligne est insérée pour chaque tentative d'envoi (status `sent` ou `failed`).
- Resend → Emails / Logs
  - Vous devez voir le message si l'envoi a réussi (domaine "harmoniecils.com" doit être vérifié, ce qui est déjà le cas).

## Tests en local

Deux options:

A) Tout en local (DB + functions)
- Démarrez Supabase local puis définissez les secrets:
  - `supabase start`
  - `supabase secrets set RESEND_API_KEY=... PUBLIC_SITE_URL=http://localhost:5173 ALLOWED_ORIGINS=http://localhost:5173`
- Servez les functions localement:
  - `supabase functions serve --env-file .env` (ou utilisez les secrets du projet local).
- Pointez le front vers l'URL locale `http://localhost:54321` (mettez à jour `VITE_SUPABASE_URL` dans `.env.local`).

B) DB Cloud + functions Cloud, front en local
- Laissez `VITE_SUPABASE_URL` et l'anon key pointés sur le projet Cloud.
- Dans ce mode, ce sont les functions Cloud qui tournent et envoient les emails avec les secrets Cloud; rien à faire côté local.

C) Appel direct pour test (sans passer par le front)
- Vous pouvez appeler `create-booking` ou `send-booking-confirmation` directement (via HTTP) avec un token (anon/service). Utile pour diagnostiquer.

## Dépannage (checklist)

- "create-booking 200 mais aucun log pour send-booking-confirmation"
  - Redéployez `create-booking` (la version live doit contenir l'appel vers `send-booking-confirmation`).
  - Vérifiez les secrets et redeploy. Depuis le 29/10, l'appel inclut aussi l'en‑tête `apikey`.
- "email_logs vide" ou "status = failed"
  - Ouvrez les logs de `send-booking-confirmation` (onglet Raw) pour voir l'erreur Resend (401/403 → clé invalide; 422 → from/to/HTML invalide).
- "Aucun email chez Resend"
  - Vérifiez le domaine vérifié chez Resend et la clé API utilisée.
- Liens dans l'email
  - `PUBLIC_SITE_URL` doit être correct. Exemple prod: `https://harmoniecils.com`.

## Détails d'implémentation

- `supabase/functions/create-booking/index.ts`
  - Insère la réservation (status par défaut: `confirmed`).
  - Si confirmé, appelle `send-booking-confirmation` avec Service Role + apikey.
- `supabase/functions/send-booking-confirmation/index.ts`
  - Génère le token d'annulation si absent.
  - Construit les URLs avec `PUBLIC_SITE_URL`.
  - Envoie l'email via Resend et journalise dans `email_logs`.

Si vous souhaitez basculer vers l'API SMTP de Resend, adaptez l'appel dans `send-booking-confirmation` (les secrets ne changent pas).
