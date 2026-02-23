# CLAUDE.md — TapTrao Codebase Guide

## What is TapTrao?

TapTrao is a trade compliance SaaS platform for commodity traders. It lets users check tariffs, regulatory requirements, and compliance obligations for trading goods from African origin countries to international destinations — without needing an ERP system. Key capabilities:

- **Compliance Lookup**: Select commodity + origin + destination → get duty rates, regulatory triggers, document checklists, readiness scores, and risk warnings
- **LC Document Checker**: Cross-check Letter of Credit terms against supplier documents using UCP 600 rules
- **TwinLog Trail**: Generate audit-ready PDF evidence records
- **EUDR Due Diligence**: Build deforestation-regulation compliance statements with geolocation data
- **Supplier Inbox**: Request and track documents from suppliers via token-gated upload links
- **Regulatory Alerts**: Watch trade corridors for regulatory changes (max 3 free)
- **Trade Templates**: Save and reuse compliance corridors with stale-detection
- **Demurrage Calculator**: Estimate port demurrage costs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite 7 |
| Routing | wouter (lightweight client-side router) |
| State | TanStack React Query v5 (server state) |
| UI Components | shadcn/ui (new-york style) on Radix UI primitives |
| Styling | Tailwind CSS 3 + CSS custom properties (`client/src/styles/tokens.css`) |
| Backend | Express 5 + TypeScript (run via tsx) |
| Database | PostgreSQL with Drizzle ORM |
| Schema Validation | Zod + drizzle-zod |
| Payments | Stripe Checkout + webhooks |
| PDF Generation | pdfkit |
| Testing | Vitest |
| Build | esbuild (server) + Vite (client) |

## Project Structure

```
├── client/                     # React SPA
│   ├── index.html              # Entry HTML
│   ├── public/                 # Static assets (favicon, PWA manifest, service worker, images)
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Root component with all route definitions
│       ├── index.css           # Global styles + Tailwind imports
│       ├── styles/
│       │   └── tokens.css      # Design tokens (colors, spacing, shadows)
│       ├── lib/
│       │   ├── queryClient.ts  # React Query config + apiRequest() helper
│       │   ├── utils.ts        # cn() class merge utility
│       │   └── avatarColours.ts
│       ├── hooks/
│       │   ├── use-tokens.ts   # Token balance query hook
│       │   ├── use-page-title.ts
│       │   ├── use-mobile.tsx  # Mobile breakpoint detection (768px)
│       │   └── use-toast.ts
│       ├── components/
│       │   ├── AppShell.tsx    # Main layout (sidebar + nav bar)
│       │   ├── nav-bar.tsx
│       │   ├── TabBar.tsx
│       │   ├── StepNav.tsx     # Multi-step progress indicator
│       │   ├── cookie-consent.tsx
│       │   └── ui/             # 50+ shadcn/ui components
│       └── pages/              # Route page components (see Routes section)
├── server/
│   ├── index.ts                # Express app setup, middleware, startup
│   ├── routes.ts               # All API route handlers (~1700 lines)
│   ├── db.ts                   # PostgreSQL pool + Drizzle instance
│   ├── storage.ts              # IStorage interface + DatabaseStorage implementation
│   ├── compliance.ts           # Compliance check engine + readiness score computation
│   ├── lc-engine.ts            # LC cross-check engine (UCP 600 rules)
│   ├── twinlog-pdf.ts          # TwinLog Trail PDF generator (pdfkit)
│   ├── eudr-pdf.ts             # EUDR statement PDF generator (pdfkit)
│   ├── seed.ts                 # Database seeding (destinations, origins, commodities, AfCFTA RoO)
│   ├── static.ts               # Production static file serving
│   └── vite.ts                 # Dev mode Vite middleware setup
├── shared/
│   └── schema.ts               # Drizzle ORM schema, Zod schemas, shared TypeScript types
├── tests/
│   └── api.test.ts             # Integration tests (30 tests, requires running server + DB)
├── scripts/
│   ├── backfill-readiness-scores.ts
│   └── bot-test.mjs            # Quick 38-assertion smoke test
├── script/
│   └── build.ts                # Production build script (esbuild + vite)
├── attached_assets/            # Static image assets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── drizzle.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── components.json             # shadcn/ui configuration
```

## Commands

```bash
# Development
npm run dev                     # Start dev server (Express + Vite HMR) on port 5000

# Production build
npm run build                   # Build client (Vite) + server (esbuild) → dist/

# Start production
npm run start                   # Run built server from dist/index.cjs

# Type checking
npm run check                   # tsc --noEmit

# Database
npm run db:push                 # Push schema to DB (drizzle-kit push)

# Tests (require running server + database)
npx vitest run                  # Run integration tests
node scripts/bot-test.mjs       # Quick smoke test (38 assertions)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | No | Stripe API key (payments disabled without it) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signature verification |
| `ADMIN_PASSWORD` | No | Password for admin alert creation endpoint |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |

## Path Aliases

Defined in `tsconfig.json` and `vite.config.ts`:

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## Database Schema

All tables defined in `shared/schema.ts` using Drizzle ORM. Key tables:

**Reference Data (seeded on startup):**
- `destinations` — 7 destination countries/regions (GB, EU, CH, US, CN, AE, TR)
- `origin_countries` — 18+ African origin countries
- `regional_frameworks` — 5+ trade blocs (ECOWAS, EAC, SADC, CEMAC, COMESA)
- `commodities` — 154+ commodities with HS codes, types, and regulatory trigger flags
- `afcfta_roo` — AfCFTA Rules of Origin by HS heading

**Transactional Data:**
- `lookups` — Compliance check results with readiness scores, TwinLog refs, integrity hashes
- `lc_checks` — LC document validation results with verdicts and correction emails
- `user_tokens` — Session-based token balances (keyed by `taptrao_session` cookie)
- `token_transactions` — Purchase/spend ledger with Stripe session dedup
- `templates` — Saved trade corridors with snapshot data and stale detection
- `company_profiles` — Company registration details for TwinLog PDFs
- `twinlog_downloads` — Audit log of PDF downloads
- `supplier_requests` — Document requests sent to suppliers
- `supplier_uploads` — Files uploaded by suppliers
- `alert_subscriptions` — Corridor watch subscriptions (max 3 per user)
- `regulatory_alerts` — Regulatory change notices
- `alert_reads` — Read tracking per user
- `eudr_records` — EUDR due diligence records

**Custom Enums:** `commodity_type`, `general_rule`, `lc_verdict`, `token_transaction_type`

Schema changes: Edit `shared/schema.ts`, then run `npm run db:push`.

## API Routes

All API endpoints are in `server/routes.ts` under `/api/`.

**Reference Data:**
- `GET /api/commodities` — List all commodities
- `GET /api/origins` — List origin countries
- `GET /api/destinations` — List destinations

**Compliance:**
- `POST /api/compliance-check` — Run compliance lookup (body: `{commodityId, originId, destinationId}`)
- `GET /api/lookups/recent` — Recent lookups
- `GET /api/lookups/:id` — Single lookup

**LC Checking:**
- `POST /api/lc-checks` — Run LC document check (validated by `lcCheckRequestSchema`)
- `GET /api/lc-checks/recent` — Recent LC checks
- `POST /api/lc-checks/linked-lookups` — Map lookup IDs to LC check IDs

**Tokens & Payments:**
- `GET /api/tokens/balance` — Current token balance
- `GET /api/tokens/transactions` — Transaction history
- `POST /api/tokens/checkout` — Create Stripe checkout session
- `POST /api/tokens/lc-recheck-checkout` — Stripe checkout for LC re-check ($9.99)
- `GET /api/tokens/verify-purchase` — Verify and credit purchase
- `POST /api/webhooks/stripe` — Stripe webhook handler

**Templates:**
- `GET /api/templates` — List user's templates
- `POST /api/templates` — Save new template
- `GET /api/templates/:id` — Get template
- `GET /api/templates/:id/stale-check` — Check if template data is outdated
- `POST /api/templates/:id/refresh` — Re-run compliance check for template
- `DELETE /api/templates/:id` — Delete template

**Company Profile & TwinLog:**
- `GET /api/company-profile` — Get profile
- `POST /api/company-profile` — Create/update profile
- `POST /api/twinlog/generate` — Generate TwinLog Trail PDF
- `GET /api/twinlog/:lookupId/data` — Get TwinLog data bundle
- `GET /api/verify/:ref` — Public verification of TwinLog reference

**Supplier Management:**
- `GET /api/supplier-inbox` — List supplier requests
- `POST /api/supplier-requests/create-or-get` — Create supplier document request
- `GET /api/upload/:token/data` — Public: get upload form data
- `POST /api/upload/:token/file` — Public: upload document file
- `POST /api/upload/:token/submit` — Public: finalize upload

**Alerts:**
- `POST /api/alerts/subscribe` — Watch a corridor
- `GET /api/alerts/subscriptions` — List subscriptions
- `GET /api/alerts` — Get alerts for user
- `GET /api/alerts/unread-count` — Unread count
- `POST /api/alerts/:alertId/read` — Mark alert read
- `POST /api/admin/alerts` — Admin: create alert (requires `ADMIN_PASSWORD`)

**EUDR:**
- `GET /api/eudr/:lookupId` — Get EUDR record
- `POST /api/eudr` — Create EUDR record
- `PATCH /api/eudr/:id` — Update EUDR record
- `POST /api/eudr/:id/generate-statement` — Generate EUDR PDF statement

**Dev-only test endpoints** (gated by `NODE_ENV !== 'production'`):
- `POST /api/test/readiness-score` — Test readiness score computation
- `POST /api/test/demurrage` — Test demurrage calculation

## Client Routes

All routes defined in `client/src/App.tsx`:

| Route | Page Component | Purpose |
|-------|---------------|---------|
| `/` | `Home` | Marketing landing page with interactive demo |
| `/lookup` | `Lookup` | Main compliance check tool (77KB) |
| `/lc-check` | `LcCheck` | LC document validator (92KB) |
| `/dashboard` | `Dashboard` | User activity overview |
| `/trades` | `Trades` | Trade history with filtering |
| `/templates` | `Templates` | Saved corridor templates |
| `/pricing` | `Pricing` | Token pack purchase page |
| `/alerts` | `AlertsPage` | Regulatory alert subscriptions |
| `/demurrage` | `DemurragePage` | Port demurrage calculator |
| `/eudr/:lookupId` | `EudrPage` | EUDR due diligence form |
| `/inbox` | `Inbox` | Supplier communication |
| `/upload/:token` | `SupplierUploadPage` | Token-gated supplier upload |
| `/verify/:ref` | `VerifyPage` | Public TwinLog reference verification |
| `/settings/profile` | `SettingsProfile` | Company profile settings |
| `/tokens/success` | `TokenSuccess` | Payment success confirmation |
| `/admin/data` | `AdminData` | Admin data management |
| `/admin/alerts/new` | `AdminAlertsPage` | Admin alert creation |
| `/privacy-policy` | `PrivacyPolicy` | Legal page |
| `/terms-of-service` | `TermsOfService` | Legal page |

## Architecture Patterns

### Session Identity
Users are identified by a `taptrao_session` httpOnly cookie (UUID, created on first API call, 1-year expiry). No user accounts or login — sessions are the identity.

### Storage Layer
`server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` class. All database access goes through the exported `storage` singleton. When adding new data operations, add the method to `IStorage` first, then implement in `DatabaseStorage`.

### API Communication
The client uses `apiRequest(method, url, data?)` from `client/src/lib/queryClient.ts`. All requests include `credentials: "include"` for cookie-based session tracking. React Query handles caching with `staleTime: Infinity` (no auto-refetch) and `retry: false`.

### Token Gating
- First compliance lookup is free (`freeLookupUsed` flag)
- Subsequent lookups cost 1 token
- Endpoints return HTTP 402 when tokens are insufficient
- Client shows buy-tokens modal on 402 responses

### Data Seeding
`server/seed.ts` seeds reference data (destinations, origins, commodities, frameworks, AfCFTA rules) on startup if tables are empty. Seed functions (`seedPrompt2` through `seedPrompt5`) are called in `registerRoutes()`.

### PDF Generation
Two PDF generators use pdfkit:
- `server/twinlog-pdf.ts` — TwinLog Trail (6-page audit record)
- `server/eudr-pdf.ts` — EUDR Due Diligence Statement

Both stream the PDF response directly and compute SHA-256 hashes asynchronously.

### Build Process
`script/build.ts` runs:
1. `rm -rf dist`
2. Vite builds client → `dist/public/`
3. esbuild bundles server → `dist/index.cjs` (CJS format, minified, select deps bundled)

## Design System

**Theme:** Dark-mode only. Background `#0D1117`, cards `#161B27`/`#1C2333`.

**Colors (CSS custom properties in `tokens.css`):**
- Primary: `#427EFF` (blue)
- Success: `#22C55E` (green)
- Warning: `#F59E0B` (amber)
- Error: `#EF4444` (red)
- Text: 95% white → 55% → 28% opacity hierarchy

**Typography:**
- Body: `Plus Jakarta Sans`
- Headings: `Fraunces` (serif)
- Labels/Mono: `DM Mono`

**Risk badge colors:** GREEN = safe, AMBER = caution, RED = high risk, STOP = trade prohibited.

## Testing

Tests are integration tests requiring a running server and populated database:

```bash
# Start the dev server first, then in another terminal:
npx vitest run
```

Test file: `tests/api.test.ts` — covers reference data endpoints, compliance checks, readiness score engine, demurrage calculator, LC checks, token balance, templates, alerts, dashboard stats, and supplier inbox.

Quick smoke test: `node scripts/bot-test.mjs` (38 assertions against a running server).

Test configuration: `vitest.config.ts` — 30s timeout, scoped to `tests/**/*.test.ts`.

## Key Conventions

1. **Shared types live in `shared/schema.ts`** — both server and client import from `@shared/schema`
2. **No direct DB access outside storage.ts** — always go through the `storage` singleton
3. **Route handlers in `server/routes.ts`** — all API routes are registered in `registerRoutes()`
4. **Session ID via cookie** — use `getSessionId(req, res)` in route handlers
5. **Zod validation for request bodies** — use schemas from `@shared/schema` (e.g., `lcCheckRequestSchema`)
6. **HTTP 402 for token gating** — client expects this status code for "buy tokens" UX
7. **Stripe dedup via `stripeSessionId`** — prevents double-crediting tokens
8. **Integrity hashes** — SHA-256 hashes on lookups, LC checks, and PDFs for audit trails
9. **shadcn/ui components** — add new UI components via shadcn CLI (`npx shadcn@latest add <component>`)
10. **Page files are self-contained** — each page in `client/src/pages/` contains its own state, queries, and UI
