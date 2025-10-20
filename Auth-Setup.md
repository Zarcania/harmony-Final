# Auth Setup (Supabase + Front)

## Redirect URLs à configurer (Supabase > Authentication > URL Configuration)

- https://harmoniecils.com
- http://localhost:5173

Vous pouvez utiliser les wildcards si nécessaire (ex. sous-domaines), mais privilégiez ces deux URLs pour éviter les boucles de redirection.

## Variables d'environnement (Front Vite)

Voir `README-ENV.md`. Minimum requis:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_SITE_URL` (optionnelle mais recommandée)

## Client centralisé

- `src/lib/supabase.ts` crée le client à partir des variables VITE_ via `ENV`.
- `src/lib/supabaseClient.ts` ré-exporte `supabase` et fournit `onAuthChanged`.
- `src/hooks/useSupabaseSession.ts` lit la session au montage et écoute `onAuthStateChange`.

## Boucles de login / session

- Le hook `useSupabaseSession` loggue explicitement quand la session est `null`.
- Dans `App.tsx`, si `isAdmin` est actif mais la session est `null`, l’écran de login admin est affiché.
- `AdminContext` écoute déjà `onAuthStateChange` et met à jour `isAdmin`.

Pour des routes réellement protégées avec react-router, on pourra ajouter un composant `<ProtectedRoute />` qui vérifie la session et redirige vers `/login` si absente.
