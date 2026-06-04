# HAITIAN NUD

Plateforme haïtienne de médias adultes (vidéos, photos) avec accès libre et VIP via Telegram.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/haitian-nud-media run dev` — run the frontend (port 18838)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth
- Required env: `ADMIN_EMAILS` — comma-separated admin emails (e.g. dghaitiannud@gmail.com)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + Wouter routing
- API: Express 5 + @clerk/express
- Auth: Replit-managed Clerk
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Frontend: `artifacts/haitian-nud-media/src/`
  - Pages: `src/pages/` (home, watch, plans, admin, search, profile, etc.)
  - Components: `src/components/` (header, footer, video-card, etc.)
- API: `artifacts/api-server/src/routes/` (videos, users, comments, plans, admin, etc.)
- DB Schema: `lib/db/src/schema/`
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod: `lib/api-zod/src/generated/`

## Architecture decisions

- VIP videos: `videoUrl` is stripped from public API responses for non-VIP users; users are redirected to Telegram links instead of a paywall
- Plans page: Telegram community links only
- Download limit: 3 per day (FREE_DOWNLOAD_LIMIT = 3)
- Admin detection: via ADMIN_EMAILS env var, checked at user creation and refreshed on login
- Clerk proxy: all Clerk requests proxied through /api/__clerk to avoid CORS issues
- Search placeholder: `chache zen`
- 404 page: present in app router with return-home CTA

## Product

- Age verification gate on first visit (18+ warning)
- Browse videos (free & VIP) with categories, search, trending
- Watch free videos directly; VIP videos show a gate with Telegram CTA
- Download videos (3/day limit for free users)
- Community Telegram links in footer and VIP gate
- Admin panel: post/edit/delete videos, manage users, view messages, notifications, and stats

## User preferences

- Admin email: dghaitiannud@gmail.com (set via ADMIN_EMAILS env var)
- Telegram links:
  - Groupe 1: https://t.me/dg_haitiannud
  - Groupe 2: https://t.me/+UXtFEcF2Dw8zNGYx
  - Canal 1: https://t.me/hatiannud_canal
  - Canal 2: https://t.me/haiti_annud
- No Stripe integration — VIP = Telegram redirect only
- Language: French (Haitian Creole audience)
- Branding: HAITIAN NUD / Haitien nud pou ayisyen

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after schema changes before restarting the API
- After OpenAPI spec changes, run codegen before using updated types
- Clerk dev keys show a console warning — expected in development, ignored in production
- The `@clerk/express` package must be in `dependencies` (not devDependencies) of api-server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
