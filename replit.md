# Hippo - Invoice Reconciliation

## Overview

Hippo is an internal product surface for auditing group health insurance data and premiums. It provides invoice reconciliation capabilities including viewing billed rosters, retroactive adjustments, and post-cutoff changes for insurance coverage periods. The application is styled after a Gusto-like benefits administration interface with a teal/green color scheme.

The app allows users to:
- Browse invoices by coverage period
- View billed roster members with plan details, tiers, and premium breakdowns
- Review retro adjustments included in each invoice
- See post-cutoff changes that will appear in future billing cycles
- Click into individual member details via a slide-out sheet

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state (fetch, cache, synchronize)
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming, custom teal/green color palette
- **Fonts**: Inter (sans-serif) and Merriweather (serif) from Google Fonts
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript, compiled with tsx (dev) and esbuild (production)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key endpoints**:
  - `GET /api/invoices` — list all invoices
  - `GET /api/invoices/:id` — get invoice with roster, retro adjustments, and post-cutoff changes
- **Dev server**: Vite dev server is integrated as Express middleware with HMR support
- **Production**: Static files served from `dist/public`, server bundled to `dist/index.cjs`

### Data Storage
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Generated via `drizzle-kit push` (stored in `./migrations`)
- **Tables**:
  - `invoices` — coverage periods, timestamps, financial totals, batch/invoice IDs
  - `billed_roster_members` — members billed per invoice with plan, tier, premium splits, flags
  - `retro_adjustments` — retroactive premium corrections linked to invoices
  - `post_cutoff_changes` — enrollment changes after invoice cutoff date
- **Seeding**: `server/seed.ts` populates sample data for 3 months of invoices with roster members, retro adjustments, and post-cutoff changes

### Storage Layer
- `server/storage.ts` implements the `IStorage` interface using `DatabaseStorage` class
- Uses Drizzle query builder with `pg` (node-postgres) connection pool
- Clean separation between storage interface and implementation

### Build System
- **Dev**: `tsx server/index.ts` runs the server with Vite middleware for HMR
- **Build**: Custom `script/build.ts` runs Vite build for client, then esbuild for server
- **Server bundling**: Selectively bundles certain dependencies (allowlist) to reduce cold start times; others are treated as externals
- **Schema push**: `drizzle-kit push` syncs schema to database without migration files

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **node-postgres (pg)** — PostgreSQL client driver
- **connect-pg-simple** — PostgreSQL session store (available but sessions not currently used)

### Key NPM Packages
- **drizzle-orm / drizzle-kit** — ORM and migration tooling
- **@tanstack/react-query** — Async state management
- **@tanstack/react-table** — Table rendering (available for data tables)
- **wouter** — Client-side routing
- **zod / drizzle-zod** — Schema validation
- **date-fns** — Date formatting and manipulation
- **Radix UI** — Full suite of accessible UI primitives (dialog, select, tabs, toast, tooltip, etc.)
- **class-variance-authority / clsx / tailwind-merge** — Styling utilities

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal** — Dev error overlay
- **@replit/vite-plugin-cartographer** — Dev tooling (dev only)
- **@replit/vite-plugin-dev-banner** — Dev banner (dev only)
- **vite-plugin-meta-images** — Custom plugin for OpenGraph meta tag management during builds