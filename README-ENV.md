# Configuration des variables d'environnement (Front Vite)

Ce projet utilise des variables `VITE_*` injectées à la compilation par Vite. Elles sont accessibles dans le code via `import.meta.env.*`.

## Variables supportées

- `VITE_SUPABASE_URL` (obligatoire)
  - URL du projet Supabase (ex: `https://abcd1234.supabase.co`).
- `VITE_SUPABASE_ANON_KEY` (obligatoire)
  - Clé Anon (publique) de Supabase. Elle est sûre à exposer côté front (droits limités par RLS).
- `VITE_PUBLIC_SITE_URL` (recommandée)
  - URL publique du site (ex: `https://harmoniecils.com`). Sert pour construire des liens absolus. Si absente, on utilise `window.location.origin`.

## Fichiers .env

- `.env.local` (dev, non versionné)
- `.env.production` (build prod local/CI, non versionné)
- `.env.example` (exemple générique)
- `.env.production.example` (exemple prod)

Ajoutez toujours vos valeurs réelles uniquement dans les fichiers non versionnés (`.env.local`, `.env.production`).

### Exemples

`.env.local`
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

`.env.production`
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_PUBLIC_SITE_URL=https://harmoniecils.com
```

`.env.example`
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_PUBLIC_SITE_URL=https://localhost:5173
```

## Intégration dans le code

L’accès aux variables est centralisé dans `src/lib/config.ts` avec des gardes runtime:
- Une erreur est levée au démarrage si `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` manquent.
- `VITE_PUBLIC_SITE_URL` est optionnelle (fallback sur `window.location.origin`).

Extrait:
```
import { ENV } from '@/lib/config'

// Client Supabase
const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
```

## Commandes utiles

- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

Si vous changez une variable `.env`, redémarrez le serveur Vite.
