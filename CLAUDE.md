# CLAUDE.md — TapTrao Codebase Guide

## What is TapTrao?
TapTrao is a trade compliance SaaS platform for commodity traders. It lets users check tariffs, regulatory requirements, and compliance obligations for trading goods from African origin countries to international destinations — without needing an ERP system. Key capabilities:
* Compliance Lookup: Select commodity + origin + destination → get duty rates, regulatory triggers, document checklists, readiness scores, and risk warnings
* LC Document Checker: Cross-check Letter of Credit terms against supplier documents using UCP 600 rules
* TwinLog Trail: Generate audit-ready PDF evidence records
* EUDR Due Diligence: Build deforestation-regulation compliance statements with geolocation data
* Supplier Inbox: Request and track documents from suppliers via token-gated upload links
* Regulatory Alerts: Watch trade corridors for regulatory changes (max 3 free)
* Trade Templates: Save and reuse compliance corridors with stale-detection
* Demurrage Calculator: Estimate port demurrage costs

## Tech Stack

| Layer | Technology |
|---|---|
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
├── design-refs/                # HTML design mockups (visual reference for components)
│   ├── taptrao-landing.html    # Landing page mock
│   ├── taptrao-dashboard.html  # Dashboard mock
│   └── taptrao-lc-checker.html # LC Checker mock
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
npm run dev                     # Start dev server (Express + Vite HMR) on port 3000

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
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | No | Stripe API key (payments disabled without it) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signature verification |
| `ADMIN_PASSWORD` | No | Password for admin alert creation endpoint |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |

## Path Aliases
Defined in `tsconfig.json` and `vite.config.ts`:
* `@/*` → `client/src/*`
* `@shared/*` → `shared/*`
* `@assets/*` → `attached_assets/*`

---

## Design System — CRITICAL: FOLLOW EXACTLY

**Reference mocks are in `design-refs/` — open these in a browser as your visual target.**

### Layout Architecture (3-Box Model)

Every app page (dashboard, LC checker, trades, etc.) uses this structure:

```
┌──────────────────────────────────────────────────────┐
│  body: #000 black, padding: 10px, gap: 10px, flex    │
│                                                       │
│  ┌───────────┐  ┌──────────────────────────────────┐ │
│  │           │  │  MAIN BOX (fading gradient)      │ │
│  │  SIDEBAR  │  │  border-radius: 18px             │ │
│  │  #242428  │  │                                   │ │
│  │  rounded  │  │  ┌─ NAV LINKS ──────── ICONS ─┐ │ │
│  │  18px     │  │  │ Dashboard | Commodities ... │ │ │
│  │           │  │  └────────────────────────────┘ │ │
│  │  240px    │  │                                   │ │
│  │  wide     │  │  ┌─ GREEN HERO BOX ───────────┐ │ │
│  │           │  │  │ Separate rounded box INSIDE │ │ │
│  │           │  │  │ border-radius: 14px         │ │ │
│  │           │  │  │ Green gradient background   │ │ │
│  │           │  │  │ Breadcrumb, title, subtitle │ │ │
│  │           │  │  └────────────────────────────┘ │ │
│  │           │  │                                   │ │
│  │           │  │  Steps / Forms / Cards / Tables   │ │
│  │           │  │                                   │ │
│  └───────────┘  └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**The landing page** uses a HORIZONTAL nav bar instead of the sidebar:

```
┌──────────────────────────────────────────────────────┐
│  ┌─ HORIZONTAL NAV BAR (#242428, rounded 14px) ────┐ │
│  │ Logo + TapTrao | Links | Log In | Start Free    │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─ MAIN BOX (fading gradient, rounded 18px) ─────┐ │
│  │  Green Hero Box (nested inside, centered)        │ │
│  │  How It Works section                            │ │
│  │  Trust signals section                           │ │
│  │  Pricing hero + Free banner                      │ │
│  │  Trade Packs grid (4 columns)                    │ │
│  │  LC Document Check section                       │ │
│  │  Footer                                          │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**CRITICAL LAYOUT RULES:**
1. The green hero box is INSIDE the main box, NOT a separate top-level element
2. The nav links sit at the TOP of the main box, ABOVE the green hero
3. The main box has ONE continuous fading gradient — content flows within it
4. Body background is pure black (#000) — the boxes float on it with gaps

### Colors

Update `tokens.css` and `tailwind.config.ts` to use these values:

| Token | Value | Usage |
|---|---|---|
| `--bg-body` | `#000000` | Page body background |
| `--bg-sidebar` | `#242428` | Sidebar background, horizontal nav bar |
| `--bg-green-hero` | `linear-gradient(135deg, #0e4e45, #14574a, #1c6352, #327462, #3a7d6a)` | Green hero boxes |
| `--bg-card-dark` | `linear-gradient(160deg, #0e3d34, #0c332c, #0a2e28, #0b2924)` | Pricing cards, dark content cards |
| `--sage` | `#6b9080` | **PRIMARY buttons, CTAs, active page tabs, step indicators** |
| `--sage-hover` | `#5a7a6b` | Button hover states |
| `--green-accent` | `#4ade80` | Sidebar active items, badges, accent text, featured borders |
| `--green-accent-bg` | `rgba(74, 222, 128, 0.1)` | Active sidebar item background tint |
| `--white-card` | `#ffffff` | Form cards, step cards, trust signal cards |
| `--red` | `#ef4444` | Alert badges, notification dots, "Review" status |
| `--amber` | `#eab308` | Warning alerts, "Moderate" risk label |
| `--text-white` | `#ffffff` | Headings on dark/green backgrounds |
| `--text-white-secondary` | `rgba(255,255,255,0.45)` | Subtitles on dark/green backgrounds |
| `--text-white-muted` | `rgba(255,255,255,0.25)` | Section labels on dark backgrounds |
| `--text-dark` | `#1a1a1a` | Headings on white cards |
| `--text-dark-secondary` | `#888888` | Subtitles on white cards |
| `--text-dark-muted` | `#999999` | Table headers, minor labels |

**⚠️ CRITICAL COLOR RULES:**
- **NEVER** use bright `#22c55e` for buttons. Buttons are SAGE `#6b9080`.
- Bright green `#4ade80` is ONLY for accents: sidebar active state, badges, featured card borders, accent text in headings.
- The old blue primary `#427EFF` is DEPRECATED. Replace everywhere with sage `#6b9080`.

### Main Box Gradient

The main content box uses this vertical gradient (dark at top → light at bottom):

```css
background: linear-gradient(180deg,
  #1a1a1c 0%, #1c2420 3%, #1e2e28 6%, #1f3830 9%,
  #214232 12%, #264a38 16%, #2c5540 20%, #356248 25%,
  #3f7056 30%, #4a7e64 35%, #578d74 40%, #659b82 45%,
  #74a890 50%, #85b49e 55%, #96bfab 60%, #a8cab8 65%,
  #bbd5c6 70%, #cddfd3 75%, #dde8e1 80%, #eaf0ec 85%,
  #f2f4f3 90%, #f5f5f5 95%
);
```

**This means:**
- Content at the TOP → dark background → use WHITE text
- Content at the BOTTOM → light background → use DARK text
- White cards (`#fff`) work well in the lower half
- Dark green cards work well in the upper half or on the landing page pricing section

### Typography

| Element | Font | Weight | Size | Tailwind |
|---|---|---|---|---|
| Logo text | Clash Display | 600 | 17px | `font-clash font-semibold text-[17px]` |
| Page titles (h1) | Clash Display | 600–700 | 32–48px | `font-clash font-bold text-4xl` |
| Section headings (h2) | Clash Display | 600 | 30px | `font-clash font-semibold text-3xl` |
| Card headings (h3) | Inter | 600 | 15–17px | `font-sans font-semibold text-base` |
| Stat values | Clash Display | 600 | 26–38px | `font-clash font-semibold text-2xl` |
| Body text | Inter | 400 | 13–14px | `font-sans text-sm` |
| Nav links | Inter | 400 (600 active) | 13.5px | `font-sans text-sm` |
| Labels / uppercase | Inter | 600 | 10–11px | `font-sans font-semibold text-[10px] uppercase tracking-wider` |

**Google Fonts to import:**
```
Clash Display: 400, 500, 600, 700
Inter: 300, 400, 500, 600, 700
```

**⚠️ DEPRECATED FONTS — DO NOT USE:**
- `Plus Jakarta Sans` — replaced by `Inter`
- `Fraunces` — replaced by `Clash Display`
- `DM Mono` — no longer used

### Border Radius

| Element | Radius | Tailwind |
|---|---|---|
| Body-level boxes (sidebar, main box) | 18px | `rounded-[18px]` |
| Inner boxes (green hero, content cards) | 14px | `rounded-[14px]` |
| Form inputs, small elements | 8px | `rounded-lg` |
| Buttons | 8–10px | `rounded-lg` or `rounded-[10px]` |
| Badges, pills | 12–20px | `rounded-full` |

### Spacing

| Element | Value |
|---|---|
| Body padding | 10px |
| Gap between sidebar and main box | 10px |
| Section inner padding | 32–48px |
| Card inner padding | 20–28px |
| Green hero margin (app pages) | `4px 24px 16px` |
| Green hero margin (landing page) | `32px 32px 0` |
| Form card margin | `0 24px 20px` |

---

## Component Patterns

### Sidebar (`AppShell.tsx`)
- Width: 240px, background: `#242428`, border-radius: 18px
- Logo: TapTrao logo image (32×32px, rounded-lg) + "TapTrao" in Clash Display
- Sections with uppercase labels: Menu, Compliance, History
- Active item: `border-left: 3px solid #4ade80`, text `#4ade80`, bg `rgba(74,222,128,0.1)`
- Inactive items: `rgba(255,255,255,0.5)`, hover `rgba(255,255,255,0.8)`
- Red badges for alerts/notifications, sage green badges for counts
- History cards at bottom: dark cards with title + tag pills

### Green Hero Box
- Lives INSIDE the main box, positioned below the nav bar
- Its own `border-radius: 14px`
- Green gradient background (see colors table)
- Subtle radial glow: `radial-gradient(ellipse at 80% 20%, rgba(74,222,128,0.06), transparent 60%)`
- Contains: breadcrumb pill, page title (Clash Display), subtitle, price pill or alert

### Nav Bar (inside main box, top)
- Positioned at the very TOP of the main box
- Left: page links — Dashboard, Commodities, Suppliers, Compliance, Messages
- Right: notification bell (with red dot if unread), chat icon, settings icon, user avatar
- User avatar: blue circle (#3b82f6) with initial "F"
- Link colors: `rgba(255,255,255,0.45)`, active: `#fff font-semibold`

### White Cards (forms, step indicators, trust signals)
- Background: `#ffffff`, border-radius: 14–16px
- Shadow: `0 1px 4px rgba(0,0,0,0.04)`
- Used in the LOWER portion of the gradient where the background is light
- Text colors: headings `#1a1a1a`, body `#888`, labels `#555`

### Dark Green Cards (pricing, LC section)
- Background: `linear-gradient(160deg, #0e3d34, #0c332c, #0a2e28, #0b2924)`
- Border: `1px solid rgba(74,222,128,0.12)` or `rgba(255,255,255,0.08)`
- Featured card: border `#4ade80` with `box-shadow: 0 0 20px rgba(74,222,128,0.08)`
- Text: white headings, `rgba(255,255,255,0.55)` body, `rgba(255,255,255,0.35)` muted

### Buttons
- **Primary (sage):** bg `#6b9080`, text white, hover `#5a7a6b`, rounded-[10px]
- **Secondary:** bg white/transparent, border `#ddd`, text `#333`
- **Ghost:** transparent, border `rgba(255,255,255,0.15)`, text `rgba(255,255,255,0.6)`
- **Featured CTA:** bg `#4ade80`, text `#0e4e45`, font-bold (ONLY for the "Most Popular" pack)
- **NEVER** use `#22c55e` for buttons

### Status Badges
- Pending: bg `#fef3c7`, text `#d97706`
- Compliant: bg `#dcfce7`, text `#16a34a`
- Review/Error: bg `#fee2e2`, text `#ef4444`

### Country Flags
**Always show emoji flags next to country codes and country names.** Flags are a key visual identity element for TapTrao. Examples:
- Trade corridors: `🇬🇭 GH → 🇪🇺 EU`
- Country of Origin: `🇬🇭 Country of Origin`
- Breadcrumbs: `Commodity › Cocoa › 🇬🇭 Ghana`
- Sidebar history: `🇨🇮 Cashew CI → 🇬🇧 UK Q1 2026`

Common flags: 🇬🇭 Ghana, 🇨🇮 Côte d'Ivoire, 🇪🇹 Ethiopia, 🇰🇪 Kenya, 🇹🇿 Tanzania, 🇺🇬 Uganda, 🇳🇬 Nigeria, 🇨🇲 Cameroon → 🇪🇺 EU, 🇬🇧 UK, 🇩🇪 Germany, 🇫🇷 France, 🇮🇹 Italy, 🇪🇸 Spain, 🇨🇭 Switzerland, 🇦🇹 Austria

---

## Pricing Model (for UI reference)

### Trade Packs (1 credit = 1 shipment checked: compliance + LC)
| Pack | Price | Per Shipment | Discount |
|---|---|---|---|
| Single Shipment | $24.99 | $24.99 | — |
| 3 Shipments (Most Popular) | $59.99 | $20.00 | 13% |
| 10 Shipments | $179 | $17.90 | 28% |
| 25 Shipments | $349 | $13.96 | 44% |

### LC Document Check (standalone, without trade credit)
- LC Document Check: $19.99 one-time
- LC Re-check (corrections): $9.99 per re-check
- LC check is included FREE with every trade credit

### First check is always free — no card required.

---

## Database Schema

All tables defined in `shared/schema.ts` using Drizzle ORM. Key tables:

**Reference Data (seeded on startup):**
* `destinations` — 7 destination countries/regions (GB, EU, CH, US, CN, AE, TR)
* `origin_countries` — 18+ African origin countries
* `regional_frameworks` — 5+ trade blocs (ECOWAS, EAC, SADC, CEMAC, COMESA)
* `commodities` — 154+ commodities with HS codes, types, and regulatory trigger flags
* `afcfta_roo` — AfCFTA Rules of Origin by HS heading

**Transactional Data:**
* `lookups` — Compliance check results with readiness scores, TwinLog refs, integrity hashes
* `lc_checks` — LC document validation results with verdicts and correction emails
* `user_tokens` — Session-based token balances (keyed by `taptrao_session` cookie)
* `token_transactions` — Purchase/spend ledger with Stripe session dedup
* `templates` — Saved trade corridors with snapshot data and stale detection
* `company_profiles` — Company registration details for TwinLog PDFs
* `twinlog_downloads` — Audit log of PDF downloads
* `supplier_requests` — Document requests sent to suppliers
* `supplier_uploads` — Files uploaded by suppliers
* `alert_subscriptions` — Corridor watch subscriptions (max 3 per user)
* `regulatory_alerts` — Regulatory change notices
* `alert_reads` — Read tracking per user
* `eudr_records` — EUDR due diligence records

**Custom Enums:** `commodity_type`, `general_rule`, `lc_verdict`, `token_transaction_type`

**Schema changes:** Edit `shared/schema.ts`, then run `npm run db:push`.

## API Routes

All API endpoints are in `server/routes.ts` under `/api/`.

**Reference Data:**
* `GET /api/commodities` — List all commodities
* `GET /api/origins` — List origin countries
* `GET /api/destinations` — List destinations

**Compliance:**
* `POST /api/compliance-check` — Run compliance lookup (body: `{commodityId, originId, destinationId}`)
* `GET /api/lookups/recent` — Recent lookups
* `GET /api/lookups/:id` — Single lookup

**LC Checking:**
* `POST /api/lc-checks` — Run LC document check (validated by `lcCheckRequestSchema`)
* `GET /api/lc-checks/recent` — Recent LC checks
* `POST /api/lc-checks/linked-lookups` — Map lookup IDs to LC check IDs

**Tokens & Payments:**
* `GET /api/tokens/balance` — Current token balance
* `GET /api/tokens/transactions` — Transaction history
* `POST /api/tokens/checkout` — Create Stripe checkout session
* `POST /api/tokens/lc-recheck-checkout` — Stripe checkout for LC re-check ($9.99)
* `GET /api/tokens/verify-purchase` — Verify and credit purchase
* `POST /api/webhooks/stripe` — Stripe webhook handler

**Templates:**
* `GET /api/templates` — List user's templates
* `POST /api/templates` — Save new template
* `GET /api/templates/:id` — Get template
* `GET /api/templates/:id/stale-check` — Check if template data is outdated
* `POST /api/templates/:id/refresh` — Re-run compliance check for template
* `DELETE /api/templates/:id` — Delete template

**Company Profile & TwinLog:**
* `GET /api/company-profile` — Get profile
* `POST /api/company-profile` — Create/update profile
* `POST /api/twinlog/generate` — Generate TwinLog Trail PDF
* `GET /api/twinlog/:lookupId/data` — Get TwinLog data bundle
* `GET /api/verify/:ref` — Public verification of TwinLog reference

**Supplier Management:**
* `GET /api/supplier-inbox` — List supplier requests
* `POST /api/supplier-requests/create-or-get` — Create supplier document request
* `GET /api/upload/:token/data` — Public: get upload form data
* `POST /api/upload/:token/file` — Public: upload document file
* `POST /api/upload/:token/submit` — Public: finalize upload

**Alerts:**
* `POST /api/alerts/subscribe` — Watch a corridor
* `GET /api/alerts/subscriptions` — List subscriptions
* `GET /api/alerts` — Get alerts for user
* `GET /api/alerts/unread-count` — Unread count
* `POST /api/alerts/:alertId/read` — Mark alert read
* `POST /api/admin/alerts` — Admin: create alert (requires `ADMIN_PASSWORD`)

**EUDR:**
* `GET /api/eudr/:lookupId` — Get EUDR record
* `POST /api/eudr` — Create EUDR record
* `PATCH /api/eudr/:id` — Update EUDR record
* `POST /api/eudr/:id/generate-statement` — Generate EUDR PDF statement

**Dev-only test endpoints** (gated by `NODE_ENV !== 'production'`):
* `POST /api/test/readiness-score` — Test readiness score computation
* `POST /api/test/demurrage` — Test demurrage calculation

## Client Routes

All routes defined in `client/src/App.tsx`:

| Route | Page Component | Purpose |
|---|---|---|
| `/` | Home | Marketing landing page with interactive demo |
| `/lookup` | Lookup | Main compliance check tool (77KB) |
| `/lc-check` | LcCheck | LC document validator (92KB) |
| `/dashboard` | Dashboard | User activity overview |
| `/trades` | Trades | Trade history with filtering |
| `/templates` | Templates | Saved corridor templates |
| `/pricing` | Pricing | Token pack purchase page |
| `/alerts` | AlertsPage | Regulatory alert subscriptions |
| `/demurrage` | DemurragePage | Port demurrage calculator |
| `/eudr/:lookupId` | EudrPage | EUDR due diligence form |
| `/inbox` | Inbox | Supplier communication |
| `/upload/:token` | SupplierUploadPage | Token-gated supplier upload |
| `/verify/:ref` | VerifyPage | Public TwinLog reference verification |
| `/settings/profile` | SettingsProfile | Company profile settings |
| `/tokens/success` | TokenSuccess | Payment success confirmation |
| `/admin/data` | AdminData | Admin data management |
| `/admin/alerts/new` | AdminAlertsPage | Admin alert creation |
| `/privacy-policy` | PrivacyPolicy | Legal page |
| `/terms-of-service` | TermsOfService | Legal page |

## Architecture Patterns

### Session Identity
Users are identified by a `taptrao_session` httpOnly cookie (UUID, created on first API call, 1-year expiry). No user accounts or login — sessions are the identity.

### Storage Layer
`server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` class. All database access goes through the exported `storage` singleton. When adding new data operations, add the method to `IStorage` first, then implement in `DatabaseStorage`.

### API Communication
The client uses `apiRequest(method, url, data?)` from `client/src/lib/queryClient.ts`. All requests include `credentials: "include"` for cookie-based session tracking. React Query handles caching with `staleTime: Infinity` (no auto-refetch) and `retry: false`.

### Token Gating
* First compliance lookup is free (`freeLookupUsed` flag)
* Subsequent lookups cost 1 token
* Endpoints return HTTP 402 when tokens are insufficient
* Client shows buy-tokens modal on 402 responses

### Data Seeding
`server/seed.ts` seeds reference data (destinations, origins, commodities, frameworks, AfCFTA rules) on startup if tables are empty. Seed functions (`seedPrompt2` through `seedPrompt5`) are called in `registerRoutes()`.

### PDF Generation
Two PDF generators use pdfkit:
* `server/twinlog-pdf.ts` — TwinLog Trail (6-page audit record)
* `server/eudr-pdf.ts` — EUDR Due Diligence Statement

Both stream the PDF response directly and compute SHA-256 hashes asynchronously.

### Build Process
`script/build.ts` runs:
1. `rm -rf dist`
2. Vite builds client → `dist/public/`
3. esbuild bundles server → `dist/index.cjs` (CJS format, minified, select deps bundled)

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
2. **No direct DB access outside `storage.ts`** — always go through the `storage` singleton
3. **Route handlers in `server/routes.ts`** — all API routes are registered in `registerRoutes()`
4. **Session ID via cookie** — use `getSessionId(req, res)` in route handlers
5. **Zod validation for request bodies** — use schemas from `@shared/schema` (e.g., `lcCheckRequestSchema`)
6. **HTTP 402 for token gating** — client expects this status code for "buy tokens" UX
7. **Stripe dedup via `stripeSessionId`** — prevents double-crediting tokens
8. **Integrity hashes** — SHA-256 hashes on lookups, LC checks, and PDFs for audit trails
9. **shadcn/ui components** — add new UI components via shadcn CLI (`npx shadcn@latest add <component>`)
10. **Page files are self-contained** — each page in `client/src/pages/` contains its own state, queries, and UI
11. **Design mocks in `design-refs/`** — open HTML files in browser as the visual target when building/restyling components
12. **Country flags are mandatory** — always show emoji flags next to country codes, origins, and destinations
