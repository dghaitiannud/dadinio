# HAITIAN NUD Média

Application vidéo de culture haïtienne — migrée sur Supabase Auth + Supabase Database (frontend-only).

## Déploiement sur Vercel

### 1. Prérequis
- Compte [Vercel](https://vercel.com)
- Compte [Supabase](https://supabase.com) avec les tables créées (voir `supabase-setup.sql`)

### 2. Créer le projet sur Vercel

1. **Importer depuis GitHub** :
   - Push ce repo sur GitHub
   - Sur Vercel → "Add New Project" → importer le repo
   - Framework : **Vite**
   - Build Command : `vite build --config vite.config.ts`
   - Output Directory : `dist/public`

2. **Variables d'environnement** (à ajouter dans Vercel Dashboard → Settings → Environment Variables) :

   | Variable | Valeur | Description |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | `https://neyqjpzpocdnhlhdlgcw.supabase.co` | URL Supabase |
   | `VITE_SUPABASE_ANON_KEY` | Ta clé anon | Clé publique Supabase |
   | `VITE_ADSENSE_ID` | `ca-pub-XXXXXXXXXXXXXXXX` | Google Adsense (optionnel) |
   | `BASE_PATH` | `/` | Base path (laisser `/`) |

3. **Vercel.json** :
   Le fichier `vercel.json` inclut déjà la config SPA (rewrites vers `index.html` pour le routing client-side).

4. **Déployer** :
   - Clique sur "Deploy"
   - Vercel build automatiquement l'app

### 3. Configurer Supabase (obligatoire)

Avant que l'app ne fonctionne, tu dois exécuter `supabase-setup.sql` dans Supabase SQL Editor :

1. Supabase Dashboard → SQL Editor
2. Nouvelle requête → copier le contenu de `supabase-setup.sql`
3. Run

### 4. Activer l'authentification email

Supabase Dashboard → Authentication → Providers → **Email** (Enabled)
- Tu peux désactiver "Confirm email" pour tester sans vérification

### 5. Admin

- L'email `dghaitiannud@gmail.com` est automatiquement admin quand il s'inscrit
- Sinon, exécuter dans SQL Editor :
```sql
UPDATE users SET is_admin = true WHERE email = 'dghaitiannud@gmail.com';
```

### 6. Stack
- React + Vite + Tailwind CSS
- Supabase Auth (email/password)
- Supabase Database (PostgreSQL)
- No backend — tout est frontend-only
