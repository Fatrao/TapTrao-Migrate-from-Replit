# TapTrao - Trade Compliance Platform

## Overview
TapTrao is a trade compliance lookup tool for commodity traders. Its primary purpose is to help users determine tariffs, regulatory requirements, and compliance obligations for trading goods between African origin countries and international destinations, without requiring an ERP system. The platform provides a compliance lookup flow, allowing users to select origin, destination, and commodity to receive detailed compliance results, including tariff rates, SPS requirements, document checklists, and stop-flag warnings. Key features include an LC Document Checker, a token-based payment system for premium features, trade template saving, and a "TwinLog Trail" PDF generation for audit records.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter.
- **State Management**: TanStack React Query for server state.
- **UI Components**: Shadcn/UI (new-york style) built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming.
- **Design Language**: African landscape-inspired color palette (ochre, forest green, terracotta, warm white, cream).
- **Typography**: Plus Jakarta Sans (headings), Inter (body), JetBrains Mono (code/refs) from Google Fonts.
- **Border Radii**: .75rem (lg), .5rem (md), .25rem (sm).
- **Key Pages**: Home, Dashboard, Lookup, LC Check, My Trades, Supplier Inbox, Alerts, Templates, Pricing, Admin Data, Admin Alerts.
- **Navigation**: Top NavBar with responsive mobile menu; landing page has a standalone nav.
- **SEO**: Per-page title and meta description.

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (via tsx).
- **Architecture**: Monolithic server serving API routes and the SPA.
- **API Pattern**: RESTful JSON APIs under `/api/`.
- **Build**: esbuild for server, Vite for client.
- **Dev Mode**: Vite dev server as middleware in Express with HMR.
- **Production**: Static files served from `dist/public/`, server from `dist/index.cjs`.

### Database
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation.
- **Schema Location**: `shared/schema.ts`.
- **Migrations**: Drizzle Kit.
- **Key Tables**: `destinations`, `regional_frameworks`, `origin_countries`, `commodities`, `afcfta_roo`, `lookups`, `lc_checks`, `user_tokens`, `token_transactions`, `company_profiles`, `twinlog_downloads`, `supplier_requests`, `supplier_uploads`, `templates`, `alert_subscriptions`, `regulatory_alerts`, `alert_reads`.
- **Custom Enums**: `commodity_type`, `general_rule`, `lc_verdict`, `token_transaction_type`.

### Storage Layer
- **Pattern**: Repository/Storage pattern with `IStorage` interface in `server/storage.ts`.
- **Implementation**: `DatabaseStorage` using Drizzle queries.

### Shared Code
- The `shared/` directory contains schema definitions and types used by both frontend and backend.
- Includes Drizzle-zod generated Zod validation schemas and shared types for `Destination`, `OriginCountry`, `Commodity`, `ComplianceResult`, `RequirementDetail`.
- `RequirementDetail` includes rich metadata for compliance requirements.

### Compliance Engine Features
- **Expandable Document Details**: Rich metadata for each requirement.
- **Portal Guides**: Mappings to submission portals (e.g., IPAFFS, TRACES).
- **Document Codes**: Standard customs codes per document type.
- **Supplier Brief Generation**: Email/WhatsApp formatted messages for supplier-side documents.
- **Customs Data Pack**: CSV export with compliance details.
- **Evidence Hashing**: SHA-256 hash for compliance check references.
- **Document Statuses**: `PENDING`, `READY`, `RISK_ACCEPTED` with owner and due-by fields.
- **Next Actions Panel**: Displays top 5 pending documents by urgency with action hints.
- **Progress Indicators**: "X of Y ready" counters for document sections.

### LC Document Checker
- **Engine**: `server/lc-engine.ts` for cross-checking LC terms against supplier documents using UCP 600 rules.
- **Checks**: Beneficiary name, amount/quantity (5% tolerance), currency, port, date validation (21-day rule), CHED reference, goods description similarity.
- **Verdict**: `COMPLIANT`, `COMPLIANT_WITH_NOTES`, `DISCREPANCIES_FOUND`.
- **Correction Generator**: Email/WhatsApp formatted messages for critical discrepancies.
- **Evidence Hashing**: SHA-256 integrity hash for LC check references.
- **Frontend**: 3-step wizard at `/lc-check`.

### Token System & Payments
- **Session Identity**: `taptrao_session` httpOnly cookie.
- **Token Model**: 1 trade credit = 1 full compliance lookup + 1 bundled LC check.
- **Free Lookup**: First compliance lookup is free; premium features gated.
- **Trade Packs**: Tiered purchase options (Single, 3-Trade, 10-Trade, 25-Trade).
- **LC Re-checks**: $9.99 per additional LC check.
- **Stripe Checkout**: For purchasing token packs and LC re-checks.
- **Stripe Webhook**: Handles `checkout.session.completed` events for crediting tokens.
- **Token Balance API**: Provides current token and LC balance.
- **Token Gating**: Endpoints return 402 for insufficient tokens.

### Trade Template System
- **Table**: `templates` for saving compliance results.
- **Constraint**: One template per corridor per session.
- **Stale Detection**: Checks if template data is outdated without consuming tokens.
- **Refresh**: Reruns compliance check for a template, updating its snapshot and usage stats.
- **Template Save**: Option to save lookup results as templates.
- **Template Load**: View cached results with staleness indicators.
- **My Templates Page**: Lists saved templates with actions.

### Regulatory Alerts & Corridor Watching
- **Corridor Watch**: After compliance lookup, users can "Watch this corridor" (max 3 free corridors).
- **Tables**: `alert_subscriptions` (user watches), `regulatory_alerts` (seeded + admin-created), `alert_reads` (mark read).
- **Seeded Alerts**: 2 EUDR deadline alerts (Dec 2026 large operators, Jun 2027 SMEs).
- **Alerts Page**: `/alerts` shows relevant alerts for watched corridors, auto-marks read via IntersectionObserver.
- **Sidebar Badge**: Blue badge shows unread alert count.
- **Admin Alert Creation**: `/admin/alerts/new` with password protection (ADMIN_PASSWORD env var).
- **API**: POST `/api/alerts/subscribe`, GET `/api/alerts`, GET `/api/alerts/unread-count`, POST `/api/alerts/:id/read`, POST `/api/admin/alerts`.

### EUDR Due Diligence Workflow
- **Trigger**: Activates when commodity has `triggers_eudr=true` AND destination is EU, GB, or CH.
- **Table**: `eudr_records` with plot coordinates, cutoff date, evidence, supplier verification, sanctions, risk assessment, statement JSON/PDF, draft/complete status, 5-year retention.
- **Lookup Integration**: `eudr_complete` boolean on `lookups` table; amber alert block in results triggers wizard.
- **4-Step Wizard**: `/eudr/:lookupId` — Geolocation, Evidence, Supplier Verification, Risk Assessment & PDF Statement.
- **PDF**: `server/eudr-pdf.ts` generates A4 EUDR Due Diligence Statement with SHA-256 hash.
- **API**: GET `/api/eudr/:lookupId`, POST `/api/eudr`, PATCH `/api/eudr/:id`, POST `/api/eudr/:id/generate-statement`.

### Company Profile & TwinLog Trail
- **Company Profile Page**: `/settings/profile` for managing company details.
- **Profile Required**: TwinLog Trail PDF generation requires a completed company profile.
- **TwinLog Trail PDF**: Server-side generated PDF via pdfkit (`server/twinlog-pdf.ts`), a 6-page A4 document providing a comprehensive audit record of compliance.
- **API**: POST `/api/twinlog/generate` for PDF generation, GET/POST `/api/company-profile`.
- **Audit Log**: Records each PDF download in `twinlog_downloads` with a SHA-256 hash.

### Testing
- **Vitest**: Unit/integration test runner with `tests/api.test.ts` (30 tests covering reference data, compliance checks, readiness score, demurrage, LC checks, tokens, templates, alerts, dashboard, supplier inbox).
- **Bot Test**: `scripts/bot-test.mjs` — quick 38-assertion smoke test script runnable via `node scripts/bot-test.mjs`.
- **Test API Endpoints**: `/api/test/readiness-score` (POST) and `/api/test/demurrage` (POST) — dev-only endpoints for isolated engine testing, gated by `NODE_ENV !== 'production'`.
- **Config**: `vitest.config.ts` scoped to `tests/**/*.test.ts`.
- **Run**: `npx vitest run` or `node scripts/bot-test.mjs`.

## External Dependencies
- **PostgreSQL**: Primary database.
- **connect-pg-simple**: For PostgreSQL-backed sessions.
- **Stripe**: For payments and webhooks.
- **cookie-parser**: For HTTP cookie parsing.
- **pdfkit**: For server-side PDF generation.