# Tests API rapides

Ce fichier propose des exemples simples pour tester les endpoints RPC/Edge Function de Supabase.

Renseignez vos valeurs:
- <PROJECT_REF>: l’identifiant du projet Supabase (sous‑domaine, ex: abcdefghijklmnop)
- <ANON_KEY>: la clé publique “anon” du projet
- <ACCESS_TOKEN>: un access_token d’utilisateur connecté (pour tester is_admin)
- <TOKEN>: un token d’annulation s’il existe
- <BOOKING_ID>: l’UUID d’un rendez‑vous

## RPC: is_admin

```powershell
# L’Authorization doit être un token utilisateur (access_token), pas l’anon key
$ProjectRef = "<PROJECT_REF>"
$AnonKey     = "<ANON_KEY>"
$UserToken   = "<ACCESS_TOKEN>"

$Headers = @{
  "apikey"        = $AnonKey
  "Authorization" = "Bearer $UserToken"
  "Content-Type"  = "application/json"
}

$Url = "https://$ProjectRef.supabase.co/rest/v1/rpc/is_admin"
Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body "{}"
```

## Edge Function: cancel-booking via token

```powershell
$ProjectRef = "<PROJECT_REF>"
$AnonKey     = "<ANON_KEY>"
$Headers = @{
  "Authorization" = "Bearer $AnonKey"
  "Content-Type"  = "application/json"
}
$Url = "https://$ProjectRef.functions.supabase.co/cancel-booking"

# Par token
Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body (@{ token = "<TOKEN>" } | ConvertTo-Json)
```

## Edge Function: cancel-booking via booking_id

```powershell
$ProjectRef = "<PROJECT_REF>"
$AnonKey     = "<ANON_KEY>"
$Headers = @{
  "Authorization" = "Bearer $AnonKey"
  "Content-Type"  = "application/json"
}
$Url = "https://$ProjectRef.functions.supabase.co/cancel-booking"

# Par booking_id (UUID)
Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body (@{ booking_id = "<BOOKING_ID>" } | ConvertTo-Json)
```

Notes:
- Le endpoint Edge Functions en prod est du type: https://<PROJECT_REF>.functions.supabase.co/<function-name>
- En local via supabase start, l’URL peut être http://localhost:54321/functions/v1/<function-name>
- is_admin lit les claims du JWT (role/app_metadata.roles). Assurez-vous qu’un rôle admin y est présent pour obtenir true.

---

## Où trouver ces valeurs

- PROJECT_REF: Supabase → Settings → API → Project URL; prenez le sous‑domaine (avant .supabase.co).
- ANON_KEY: Supabase → Settings → API → “anon public”.
- ACCESS_TOKEN: depuis votre app quand vous êtes connecté (console web → `supabase.auth.getSession()` puis copier `data.session.access_token`).
- BOOKING_ID: l’UUID d’une ligne de la table `bookings` (copiez depuis le dashboard Table Editor).
- TOKEN (annulation): si vous avez un système de lien d’annulation, le token est celui inclus dans l’URL envoyée par email.

---

## cURL (POSIX) — Copié/collé rapide

1) REST select services

```bash
curl -i "https://<SUPABASE>.supabase.co/rest/v1/services?select=*" \
 -H "apikey: $VITE_SUPABASE_ANON_KEY" \
 -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
```

2) OPTIONS CORS Function (preflight)

```bash
curl -i -X OPTIONS "https://<SUPABASE>.functions.supabase.co/cancel-booking" \
 -H "Origin: https://harmoniecils.com" \
 -H "Access-Control-Request-Method: POST"
```

3) POST cancel-booking (par booking_id)

```bash
curl -i -X POST "https://<SUPABASE>.functions.supabase.co/cancel-booking" \
 -H "Origin: https://harmoniecils.com" \
 -H "Content-Type: application/json" \
 -d '{"booking_id":"TEST"}'
```
