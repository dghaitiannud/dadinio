# HAITIAN NUD

Plateforme haïtienne de médias adultes (vidéos, photos) avec accès libre et VIP via Telegram. Migré vers Supabase (Auth + Database).

## Run & Operate

- `pnpm --filter @workspace/haitian-nud-media run dev` — run le frontend (port automatique)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build
- Required env: `VITE_SUPABASE_URL` — URL Supabase (ex: https://xyz.supabase.co)
- Required env: `VITE_SUPABASE_ANON_KEY` — clé publique Supabase
- Required env: `SUPABASE_SERVICE_KEY` — clé service Supabase (pour backend, si utilisé)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + Wouter routing
- Auth: Supabase Auth (email/password)
- DB: Supabase PostgreSQL (client direct)
- No backend server — tout via Supabase client

## Where things live

- Frontend: `artifacts/haitian-nud-media/src/`
  - Pages: `src/pages/` (home, watch, plans, admin, search, login, account, legal)
  - Components: `src/components/` (header, footer, video-card, age-gate, layout, etc.)
  - Auth: `src/lib/auth-context.tsx` — contexte Supabase Auth
  - DB: `src/lib/supabase-db.ts` — toutes les fonctions CRUD Supabase
  - Client: `src/lib/supabase.ts` — client Supabase configuré

## Architecture decisions

- Supabase Auth remplace Clerk — login email/password simple
- Supabase Database remplace PostgreSQL local + Drizzle — tout via Supabase client
- VIP videos: `videoUrl` masqué pour les non-VIP
- Plans page: Telegram community links uniquement
- Download limit: 3 par jour (FREE_DOWNLOAD_LIMIT = 3)
- Admin détecté par email `dghaitiannud@gmail.com` — stocké dans la table `users` avec `isAdmin: true`
- Search placeholder: `chache zen`
- 404 page: présente avec CTA retour accueil

## Product

- Age verification gate on first visit (18+ warning)
- Browse videos (free & VIP) avec catégories, recherche, trending
- Watch free videos; VIP videos → gate Telegram
- Download videos (3/day limit)
- Community Telegram links dans footer et VIP gate
- Admin panel: post/delete videos, manage users, view tickets, stats
- Login/Register avec Supabase Auth

## User preferences

- Admin email: dghaitiannud@gmail.com
- Telegram links:
  - Groupe 1: https://t.me/dg_haitiannud
  - Groupe 2: https://t.me/+UXtFEcF2Dw8zNGYx
  - Canal 1: https://t.me/hatiannud_canal
  - Canal 2: https://t.me/haiti_annud
- No Stripe — VIP = Telegram redirect only
- Language: French (Haitian Creole audience)
- Branding: HAITIAN NUD / Haitien nud pou ayisyen

## Gotchas

- Supabase Auth nécessite `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- La table `users` doit exister dans Supabase avec colonnes: id, email, display_name, plan, is_admin, blocked, age_confirmed, free_downloads_used, subscription_ends_at, created_at
- La table `videos` doit exister: id, title, description, thumbnail_url, video_url, category, duration_sec, views, is_vip, published, created_at
- Tables `comments`, `downloads`, `views`, `tickets` aussi nécessaires

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
