# Test du flux de réservation (Supabase)

Ce guide permet de simuler un rendez-vous et de tester les emails (confirmation, rappel H-24, mise à jour, annulation) via les Edge Functions.

Important: n'utilisez jamais la clé `service_role` côté navigateur. Les appels ci-dessous doivent être faits côté serveur ou en local sécurisé.

## Pré-requis
- Avoir le fichier `supabase/config.toml` avec `project_id` (ex: `lmpfrrkqdevxkgimvnfw`).
- Disposer de la clé `SUPABASE_SERVICE_ROLE_KEY` (Dashboard > Settings > API > service_role key).
- Accès réseau sortant vers `*.supabase.co`.

## Exécution automatisée (recommandé)
Un script PowerShell automatise toute la séquence:
- Création d'une réservation en `en_attente` via l'API REST (équivalent au SQL fourni)
- Appel de `booking-orchestrator` pour confirmer + email de confirmation
- Vérification du statut en base
- Appel de `booking-reminder-email`, `booking-updated-email`, `booking-canceled-email`

Étapes:
1) Exportez la clé en variable d'environnement dans votre session PowerShell:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "<votre_service_role_key>"
```

2) Lancez le script:

```powershell
pwsh scripts/test_booking_flow.ps1
```

Le script affiche:
- `BOOKING_ID` retourné
- Les réponses JSON des fonctions (`ok: true`, etc.)
- La vérification du statut en base: `status='confirme'`, `reminder_sent=NULL`

## Variante SQL (éditeur Supabase)
Si vous souhaitez exécuter exactement la requête SQL fournie dans l'éditeur SQL du Dashboard, faites-le puis relevez l'`id` retourné. Vous pourrez ensuite appeler manuellement les Edge Functions via un client HTTP (toujours avec la `service_role`).

## Planification du rappel H-24 (cron)
Dans Supabase Dashboard > Edge Functions > Schedules:
- Créez un schedule pour `booking-reminders-cron` avec l'expression cron `*/15 * * * *` (toutes les 15 minutes).

## Intégration côté front/back
- Après création d’une réservation par le client, appelez côté serveur (ex: Node/Next API Route) l’URL `booking-orchestrator` avec le record inséré.
- N’utilisez jamais la clé `service_role` côté navigateur.
- Dans l’UI admin, filtrez les rendez-vous:
  - En attente: `status = 'en_attente'`
  - Confirmés: `status = 'confirme'`
  - Annulés: `status = 'annule'`
