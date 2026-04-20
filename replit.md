# MobileMoney Manager

## Overview

A mobile-first PWA finance and sales tracker for micro-businesses in Francophone West and Central Africa (Senegal, Côte d'Ivoire, Cameroon, Nigeria). Built for beauty salon owners, food vendors, tailors, and online sellers.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/money-manager)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (white-label)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts
- **UI**: shadcn/ui + Tailwind CSS + Lucide icons
- **Routing**: Wouter

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

1. **Authentication**: Clerk-powered sign up/login/logout. Each user has private data.
2. **Dashboard**: Today's balance, weekly profit/loss, stats, 7-day chart.
3. **Transaction logging**: Income/expense with category, payment method (Orange Money, Wave, MTN MoMo, Cash), reference note, date.
4. **Transaction history**: Filterable/searchable list.
5. **Reports**: Weekly/monthly summaries with charts by category and payment method.
6. **Inventory**: Stock notes with name, quantity, unit.
7. **Settings**: Language toggle (French/English), currency preference.

## Database Schema

- `transactions`: id, user_id, type, amount, currency, category, payment_method, reference_note, date, created_at, updated_at
- `inventory_items`: id, user_id, name, quantity, unit, notes, created_at, updated_at

## Architecture Notes

- All API routes require Clerk auth (`getAuth(req)`)
- Frontend imports hooks from `@workspace/api-client-react`
- OpenAPI spec in `lib/api-spec/openapi.yaml`
- After spec changes, run codegen then fix `lib/api-zod/src/index.ts` to only export from `./generated/api`
- Codegen regenerates `lib/api-zod/src/index.ts` — run `printf 'export * from "./generated/api";\n' > lib/api-zod/src/index.ts` before running codegen
