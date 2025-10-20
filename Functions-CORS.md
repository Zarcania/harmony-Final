# Functions CORS Helper

Ce dépôt fournit un utilitaire CORS pour les Edge Functions Supabase (Deno).

## Secret requis

Définissez le secret `ALLOWED_ORIGINS` dans votre projet Supabase (Project Settings → Secrets) avec la liste CSV des origines autorisées, par ex.:

```
https://harmoniecils.com,http://localhost:5173
```

## Utilisation

1. Importez le helper dans votre function:

```ts
import { buildCors, handleOptions } from '../utils/cors.ts'
```

2. Au début du handler:

```ts
const origin = req.headers.get('Origin') ?? undefined
const headers = { ...buildCors(origin), 'Content-Type': 'application/json' }
const opt = handleOptions(req)
if (opt) return opt
```

- Si la requête est une pré‑requête `OPTIONS`, `handleOptions` renverra une réponse 204 avec les bons headers.
- Pour les autres méthodes, utilisez `headers` pour toutes les réponses.

## Exemple: `cancel-booking`

Voir `supabase/functions/cancel-booking/index.ts`. La function lit le token depuis `GET ?token=` ou `POST { token }`, appelle la RPC `cancel_booking_with_log`, et répond avec les en‑têtes CORS calculés.
