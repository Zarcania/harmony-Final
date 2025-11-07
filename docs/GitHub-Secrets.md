# Configuration des Secrets GitHub pour le Déploiement

## 🔑 Secrets Requis

Pour que le déploiement automatique fonctionne, vous devez configurer les secrets suivants dans GitHub :

### Variables Supabase (OBLIGATOIRES)

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | `https://lmpfrrkqdevxkgimvnfw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme (public) Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_PUBLIC_SITE_URL` | URL publique du site | `https://harmoniecils.com` |

### Variables FTPS (pour le déploiement)

| Secret | Description |
|--------|-------------|
| `FTP_HOST` | Hôte FTPS o2switch |
| `FTP_USER` | Nom d'utilisateur FTP |
| `FTP_PASSWORD` | Mot de passe FTP |
| `FTP_PORT` | Port FTPS (généralement 21) |
| `FTP_TARGET` | Dossier cible sur le serveur |

## 📝 Comment Configurer les Secrets

1. **Aller sur GitHub**
   - Ouvrez votre dépôt : `https://github.com/Zarcania/harmony-Final`
   - Cliquez sur **Settings** (Paramètres)

2. **Accéder aux Secrets**
   - Dans le menu de gauche : **Secrets and variables** → **Actions**

3. **Ajouter/Modifier un Secret**
   - Cliquez sur **New repository secret** (ou Edit pour modifier)
   - Nom : entrez exactement le nom du secret (ex: `VITE_SUPABASE_ANON_KEY`)
   - Value : collez la valeur
   - Cliquez sur **Add secret**

## 🔍 Obtenir les Valeurs Supabase

### URL Supabase
1. Connectez-vous à https://supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez l'**URL** (Project URL)

### Clé Anon Key
1. Dans le même écran **Settings** → **API**
2. Sous **Project API keys**
3. Copiez la clé **anon** / **public** (commence par `eyJ`)
   
⚠️ **Ne copiez JAMAIS la `service_role` key** - elle doit rester secrète !

## ✅ Validation

Le workflow GitHub Actions inclut maintenant une validation automatique :
- ✅ Vérifie que l'URL Supabase est présente dans le bundle
- ✅ Vérifie que l'ancienne URL n'est plus utilisée
- ✅ Vérifie que la clé anon est injectée (format JWT)

Si un secret manque, le déploiement échouera avec un message d'erreur clair.

## 🚀 Tester le Déploiement

Après avoir configuré tous les secrets :

1. **Push sur main** ou déclenchez manuellement via **Actions** → **Deploy FTPS** → **Run workflow**
2. Suivez les logs pour vérifier que :
   - Le build se termine sans erreur
   - La validation Supabase passe ✅
   - Le upload FTPS réussit

## 🐛 Problèmes Courants

### "VITE_SUPABASE_ANON_KEY est manquante"
- ✅ Vérifiez que le secret `VITE_SUPABASE_ANON_KEY` est bien défini dans GitHub
- ✅ Vérifiez l'orthographe exacte (majuscules, underscores)
- ✅ La clé doit commencer par `eyJ` (format JWT)

### "URL Supabase absente du bundle"
- ✅ Vérifiez que le secret `VITE_SUPABASE_URL` est bien défini
- ✅ Format : `https://[PROJECT_ID].supabase.co` (sans slash final)

### Les variables ne sont pas injectées
- ✅ Les variables **doivent** commencer par `VITE_` pour être exposées côté client
- ✅ Le workflow passe maintenant les secrets via `env:` dans l'étape de build
- ✅ Ne pas utiliser de `.env.production` local - tout passe par GitHub Secrets

## 📚 Références

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Settings](https://supabase.com/docs/guides/api)
