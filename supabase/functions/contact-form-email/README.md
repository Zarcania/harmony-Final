# Contact Form Email Function

## Description

Fonction Edge Supabase qui gère l'envoi d'emails lorsque le formulaire de contact du site est soumis.

## Endpoint

```
POST /functions/v1/contact-form-email
```

## Paramètres

```json
{
  "name": "string (obligatoire)",
  "email": "string (obligatoire)",
  "phone": "string (optionnel)",
  "message": "string (obligatoire)"
}
```

## Variables d'environnement requises

Ces secrets doivent être configurés dans Supabase :

- `SMTP_HOST` : Serveur SMTP (ex: smtp.gmail.com)
- `SMTP_PORT` : Port SMTP (défaut: 587)
- `SMTP_USER` : Utilisateur SMTP
- `SMTP_PASS` : Mot de passe SMTP
- `FROM_NAME` : Nom de l'expéditeur (optionnel, défaut: "Harmonie Cils Studio")

## Configuration des secrets

### En local

Les secrets sont déjà configurés dans votre instance locale Supabase.

### En production

```bash
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-email@gmail.com
supabase secrets set SMTP_PASS=your-app-password
supabase secrets set FROM_NAME="Harmonie Cils Studio"
```

## Test

```bash
# En local
pwsh scripts/test_contact_form.ps1
```

## Exemple de requête

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/contact-form-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "phone": "0612345678",
    "message": "Bonjour, je souhaite prendre rendez-vous."
  }'
```

## Réponse

### Succès (200)
```json
{
  "success": true,
  "message": "Message envoyé avec succès"
}
```

### Erreur (400/500)
```json
{
  "error": "Description de l'erreur",
  "details": "Détails techniques"
}
```

## Email envoyé

L'email est envoyé à `Harmoniecilsstudio@gmail.com` avec :
- Sujet : "📩 Nouveau message de [nom]"
- Contenu : Nom, email, téléphone (si fourni), et message du visiteur
- Format : HTML + texte brut

## Notes

- La fonction utilise denomailer pour l'envoi SMTP
- Les emails sont envoyés de manière asynchrone
- Le formulaire affiche un message de confirmation après envoi réussi
