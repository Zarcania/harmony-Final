# Setup local (Windows + Docker + Supabase)

Ce guide prépare et lance l'app en local avec Supabase (Docker), Edge Functions et Vite.

## 1) Prérequis
- Docker Desktop installé et lancé
- Supabase CLI installé: `npm i -g supabase`
- Node.js LTS + npm

Optionnel: `RESEND_API_KEY` exportée dans la session si vous souhaitez tester les emails.

## 2) Bootstrap automatique

Exécutez:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap_local.ps1
```

Le script fait:
- `supabase start` (démarre les conteneurs Docker)
- Récupère l'API URL + anon/service keys depuis `supabase status`
- Écrit `.env.local` (front):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_PUBLIC_SITE_URL`
  - `VITE_ADMIN_EMAILS`
- Configure les secrets Functions (`supabase secrets set`):
  - `PUBLIC_SITE_URL=http://localhost:5173`
  - `ALLOWED_ORIGINS=http://localhost:5173`
  - `RESEND_API_KEY` si présent dans `$env:RESEND_API_KEY`
- Installe les dépendances npm, lance un typecheck et les tests rapides.

Si la `anon key` n'est pas détectée automatiquement, ouvrez `.env.local` et collez la valeur depuis `supabase status`.

## 3) Lancer

Dans deux consoles distinctes:

- Edge Functions:
```powershell
supabase functions serve
```

- Front:
```powershell
npm run dev
```

Ouvrez http://localhost:5173

## 4) Compte admin local (optionnel)

Créez un compte administrateur local:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create_local_admin.ps1 -Email admin@local.test -Password Passw0rd!
```

Puis connectez-vous via l'UI. Vous pouvez aussi ajouter `VITE_ADMIN_EMAILS=admin@local.test` dans `.env.local` pour un fallback.

## 5) Mise à jour du schéma (si besoin)

Si la DB locale n'est pas à jour:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\supabase_db_push.ps1
```

## 6) Variables à connaître

Front (`.env.local`):
- `VITE_SUPABASE_URL` (obligatoire)
- `VITE_SUPABASE_ANON_KEY` (obligatoire)
- `VITE_PUBLIC_SITE_URL` (recommandée)
- `VITE_ADMIN_EMAILS` (optionnelle)

Functions (secrets via `supabase secrets`):
- `PUBLIC_SITE_URL` (recommandée)
- `ALLOWED_ORIGINS` (obligatoire pour CORS)
- `RESEND_API_KEY` (obligatoire si vous testez les emails)

Reportez-vous aussi à `README-ENV.md`, `Functions-CORS.md` et `docs/Emails-Setup.md`.
