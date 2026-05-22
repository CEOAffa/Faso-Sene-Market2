# Faso Sènè

Faso Sènè est le marché agribusiness numérique du Mali — une plateforme qui connecte agriculteurs et producteurs alimentaires avec les restaurants, épiceries et supermarchés.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/faso-sene run dev` — run the frontend (port 21130)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, framer-motion, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (suppliers, products, daily_prices, orders, deliveries)
- `artifacts/api-server/src/routes/` — Express route handlers (products, prices, suppliers, orders, deliveries, admin)
- `artifacts/faso-sene/src/pages/` — React pages (home, catalogue, prix, commander, fournisseurs, tableau-de-bord, admin)
- `artifacts/faso-sene/src/components/layout.tsx` — shared nav + footer

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, price ticker, how-it-works |
| `/catalogue` | Product catalog with WhatsApp ordering |
| `/prix` | Daily price board with trend indicators |
| `/commander` | Customer order form with cart |
| `/fournisseurs` | Supplier registration + directory |
| `/tableau-de-bord` | Supplier dashboard (products + orders) |
| `/admin` | Admin dashboard (stats, orders, deliveries, suppliers) |

## Architecture decisions

- OpenAPI-first: all types generated from `lib/api-spec/openapi.yaml` via Orval
- WhatsApp ordering via `wa.me/22300000000` deep links pre-filled with order details
- Daily prices stored in `daily_prices` table; `/prices/latest` endpoint returns most recent per product
- Orders store items as JSON column for flexibility
- Supplier dashboard uses supplier selector (no auth) for demo purposes

## Product

8 products: Œufs, Riz, Oignons, Tomates, Mangues, Papayes, Pommes de terre, Poulets

## User preferences

- All UI in French
- Green (#1a6b3c area) and white primary colors
- Mobile-first design
- WhatsApp integration for orders

## Gotchas

- Always run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- The `/prices/latest` route must come BEFORE `/prices/:id` in Express router to avoid route conflicts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
