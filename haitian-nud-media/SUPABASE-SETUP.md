# 🚀 CONFIGURER SUPABASE — Étapes obligatoires

## Projet: https://lcfnjxqademkrcocvtlo.supabase.co

---

### ÉTAPE 1: Désactiver la confirmation d'email (connexion instantanée)

1. Va sur https://supabase.com
2. Clique sur ton projet **lcfnjxqademkrcocvtlo**
3. Menu gauche → **Authentication** → **Providers** → **Email**
4. → **Confirm email** = **OFF** ⚠️
5. → **Secure email change** = **OFF** ⚠️
6. Clique **Save**

---

### ÉTAPE 2: Configurer l'URL du site

1. Menu gauche → **Authentication** → **URL Configuration**
2. → **Site URL** = `https://haitiannud12345.vercel.app`
3. → **Redirect URLs** → **Add URL** → `https://haitiannud12345.vercel.app/reset-password`
4. Clique **Save**

---

### ÉTAPE 3: Exécuter le SQL (crée toutes les tables)

1. Menu gauche → **SQL Editor** (icône `</>`)
2. Clique **New query**
3. **Copie-colle TOUT** le contenu de `supabase-setup.sql` (fichier dans l'archive)
4. Clique **▶ Run**
5. Vérifie les résultats:
   - `TABLES` → count = **7**
   - `VIDEOS` → count = **1** (la vidéo de test)
   - `ADMIN EMAIL` → email = dghaitiannud@gmail.com, is_admin = **true**

---

### ÉTAPE 4: Vérifier que ça marche

Dans le SQL Editor, exécute:
```sql
SELECT * FROM videos;
```
Tu dois voir 1 ligne (vidéo de test BigBuckBunny).

---

### ÉTAPE 5: Déployer sur Vercel

1. Va sur https://vercel.com
2. Ton projet → **Settings** → **Environment Variables**
3. Ajoute ces variables:

| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://lcfnjxqademkrcocvtlo.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZm5qeHFhZGVta3Jjb2N2dGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Nzc1NDgsImV4cCI6MjA5NzI1MzU0OH0.Nfa_2wP8RVfV3MnFYWY17PuBnz98yyDsBiXdbxRKvxY` |
| `VITE_VAPID_PUBLIC_KEY` | `BAM-Ab_FHCm2P3q0n-DmuqdOyQOuwBOR6LAxbGjc4wbsqU6JN1rvsIAtmlbpCN0s62PjXgMlKUAyBxCO9UIE6FM` |
| `SUPABASE_URL` | `https://lcfnjxqademkrcocvtlo.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZm5qeHFhZGVta3Jjb2N2dGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY3NzU0OCwiZXhwIjoyMDk3MjUzNTQ4fQ.tHEKo3Wt1iCGRGXJcc_JatAFoTdRqsonAqhMXkhzfYk` |
| `VAPID_PUBLIC_KEY` | `BAM-Ab_FHCm2P3q0n-DmuqdOyQOuwBOR6LAxbGjc4wbsqU6JN1rvsIAtmlbpCN0s62PjXgMlKUAyBxCO9UIE6FM` |
| `VAPID_PRIVATE_KEY` | `e6Qt_r7H8W-tB57OUVQvqjbuSrbOor0mZzHskkFcFrU` |
| `PUSH_ADMIN_SECRET` | `HaitianNud2024!` |

4. Clique **Redeploy**

---

### ⚠️ Si tu oublies l'étape 1 (Confirm email)

Les utilisateurs s'inscrivent mais ne peuvent **pas se connecter**. Le message sera:
> "Email not confirmed"

**Solution:** Retourne à l'étape 1 et désactive Confirm email.

---

### ⚠️ Si tu oublies l'étape 2 (Site URL)

Le lien de réinitialisation de mot de passe pointe vers `localhost` au lieu de ton site.

**Solution:** Retourne à l'étape 2 et mets l'URL de ton site Vercel.
