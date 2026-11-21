# HomeSeva Central ERP — Current Application Status & Architecture

**Last Updated:** November 2026  
**Status:** Hardened, Self-Hosted PostgreSQL (Prisma), Standalone Docker & Production-Optimized  
**Branch:** `production-migration`  
**Automated Test Pass Rate:** 74/74 Passing (100% Green, 0 Failures)

---

## 1. Executive Summary

The entire HomeSeva multi-tenant ERP platform has been audited, migrated from legacy cloud dependencies (Supabase) to a high-performance **Self-Hosted PostgreSQL & Prisma ORM** architecture on a Hostinger KVM 2 VPS (2 vCPU, 8 GB RAM, Ubuntu 24.04 LTS), and hardened against security vulnerabilities, memory leaks, and connection exhaustion.

### Key Architectural Highlights:

1. **Self-Hosted PostgreSQL 16 & Prisma ORM (100% Supabase Free):**
   - Completely uninstalled all Supabase SDKs (`@supabase/supabase-js`, `@supabase/ssr`) and deleted client libraries.
   - Direct PostgreSQL database engine orchestrated via Prisma ORM (`packages/db/prisma/schema.prisma`).
   - Unconditional singleton connection pool in `packages/db/src/client.ts` with connection pooling caps (`connection_limit=15&pool_timeout=20`) preventing connection exhaustion and database crashes.
2. **Deterministic Canonical Multi-Tenant Resolver:**
   - All 10 business workspaces are deterministically identified by canonical UUIDs (`b1000000-0000-0000-0000-000000000001` through `...010`) via `packages/db/src/businessResolver.ts`.
   - Legacy aliases (e.g. `crockery-rental` -> `horeca-essentials`, `printbooth` -> `adjs`) automatically resolve to canonical business entities.
3. **Enterprise Security & Cryptographic Hashing Engine:**
   - **Bcrypt Hashing (`apps/web/src/lib/crypto.ts`):** All Super Admin master credentials and staff passwords/PINs are stored as salted Bcrypt hashes (cost factor 10). Legacy rows are automatically and transparently upgraded to Bcrypt upon successful verification with zero downtime.
   - **Non-Blocking Asynchronous Verification:** Eradicated all blocking `compareSync` and `hashSync` calls from Node.js API handlers, preventing event loop starvation.
   - **Strict Individual Member Authentication:** Every staff member authenticates with their individual assigned email, password, and security PIN via `/api/auth/member-login`. Access is strictly isolated by `businessId` and `roleId`.
   - **30-Day Persistent Session Cookies (`ONE_MONTH_SESSION_SECONDS = 2,592,000s`):** Eliminates daily re-login friction for operational staff while maintaining finite cryptographic token expiration in HttpOnly, Secure, SameSite=Lax cookies.
   - **Account Lockout & Brute-Force Rate Limiting:** 5 consecutive failed attempts trigger an automated 15-minute account lockout on both Super Admin credentials and individual staff member accounts (`failedAttempts` and `lockedUntil`).
4. **Super Admin 4-Factor Authentication & Master Credentials Reset:**
   - Multi-Factor Authentication: Master Username, Master Password, 4-Digit Security PIN, and 8-Digit Master Key.
   - Interactive 3D visual lock verification with debounced background validation (`/api/auth/super-admin/verify-field`).
   - Dedicated "Reset Master Credentials" modal on `/super-admin/signin` requiring verification of all 3 current master security factors before updating.
5. **Production Footprint & Resource Optimization:**
   - **1.23 GB Footprint Reduction:** Repository size decreased from 2.60 GB to 1.37 GB by purging build caches (`.turbo`, `apps/desktop/dist`), removing unversioned compiled binaries (`HomeSeva-Setup-1.3.0.exe`), and enforcing strict `.gitignore` rules.
   - **Next.js Standalone Build:** Enabled `output: 'standalone'` in `apps/web/next.config.mjs`. Docker container builds trace exact dependencies into `.next/standalone` (56.7 MB minimal package) rather than copying 1 GB of `node_modules` (94% smaller container image).
   - **Node.js Heap Cap:** Configured `--max-old-space-size=1024` in `Dockerfile.web` to prevent heap spikes on the 8 GB VPS host.
   - **Safe API Pagination:** Enforced strict pagination (`take: 500` default, max 1000) on CRM leads and operational orders/tickets (`take: 200`), eliminating out-of-memory (OOM) risks.
   - **Staff Laptop Battery & CPU Throttling:** Integrated the HTML5 Page Visibility API (`document.hidden` / `visibilitychange`) into reporting views, automatically freezing background polling intervals when employee tabs are minimized or hidden.
6. **Zero Runtime Dynamic DDL & Strict ACID Transactions:**
   - Eradicated all runtime `CREATE TABLE IF NOT EXISTS` and `$executeRawUnsafe` statements from API routes.
   - All multi-step inventory, booking, and invoice mutations (e.g. Crockery rental booking item sync) are wrapped in atomic interactive ACID transactions (`prisma.$transaction`).

---

## 2. Active Workspaces & Sub-Companies

The platform hosts 10 isolated business workspaces with deterministic canonical UUIDs:

| # | Business Workspace | Canonical Slug | Canonical UUID | Key Operational Modules |
|---|---|---|---|---|
| 1 | **Prefab Construction Solutions** | `prefab-construction` | `b1000000-0000-0000-0000-000000000001` | Civil engineering, BOQ estimation, site daily reports, materials desk |
| 2 | **HoReCa Essentials & Crockery Rental** | `horeca-essentials` | `b1000000-0000-0000-0000-000000000002` | Crockery rental engine, inventory ledger, bookings, dispatch/returns, invoices |
| 3 | **Gentle Hair Wigs Studio** | `gentle-hair-wigs` | `b1000000-0000-0000-0000-000000000003` | Multi-studio CRM (Viman Nagar, Ravet, Kolhapur), telecalling reports, appointments |
| 4 | **Ecolab Institutional Distribution** | `ecolab-distribution` | `b1000000-0000-0000-0000-000000000004` | Institutional accounts, chemical safety compliance, dispatch ledger |
| 5 | **HS Co-working Spaces** | `hs-coworking` | `b1000000-0000-0000-0000-000000000005` | Hot desks, dedicated cabins, facility access, member billing |
| 6 | **First Mover Advantage** | `first-mover-advantage` | `b1000000-0000-0000-0000-000000000006` | SaaS product metrics, platform operations, subscription billing |
| 7 | **ADJS Printbooth Digital Printing** | `adjs` | `b1000000-0000-0000-0000-000000000007` | Commercial printing CRM, machine orders, support tickets, daily reporting |
| 8 | **DVR Enterprise** | `dvr-enterprise` | `b1000000-0000-0000-0000-000000000008` | Industrial goods trading, supplier dispatches, accounts ledger |
| 9 | **NDA Security & Facility Care** | `nda-services` | `b1000000-0000-0000-0000-000000000009` | Guard deployment rosters, site surveillance audits, facility care |
| 10 | **HS Real Estate & Assets** | `hs-real-estate` | `b1000000-0000-0000-0000-000000000010` | Commercial leasing portfolios, tenant agreements, asset management |

---

## 3. Database Schema Architecture

Database migrations and models are managed via Prisma: `packages/db/prisma/schema.prisma`.

### Core Multi-Tenant Tables:
- `super_admin_credentials`: Salted Bcrypt hashes for Super Admin username, password, 4-digit PIN, 8-digit master key, failed attempt counters, and lockout timestamps.
- `businesses`: Registry of all 10 canonical businesses (`slug`, `name`, `subtitle`, `themeColor`, `isActive`, `config`).
- `business_roles`: Business-specific roles and default role templates.
- `role_members`: Individual staff members assigned to a business and role, with individual Bcrypt-hashed passwords, PINs, active status, `failedAttempts`, and `lockedUntil`.
- `tabs`: Workspace functional tabs linked to businesses.
- `role_tab_access`: Fine-grained tab permissions per role (`canView`, `canEdit`).
- `audit_logs`: Immutable audit ledger tracking authentication events, IP addresses, actor identifiers, and actions.
- `items`, `customers`, `bookings`, `booking_items`, `stock_ledger`, `invoices`, `payments`: Crockery rental relational engine with interactive ACID transactions.
- `printbooth_leads`, `printbooth_machine_orders`, `printbooth_support_tickets`: Strongly typed operational models for Printbooth.
- `telecaller_daily_reports`, `printbooth_daily_reports`: Daily reporting logs with normalized UTC midnight date indexing.

### Seed & Migration Scripts:
- **Prisma Seed Script:** `packages/db/src/seed.ts` (Executes automatically via `pnpm db:seed`, provisions deterministic UUIDs, Bcrypt-hashes all credentials, and configures default tab permissions).
- **Production VPS Setup Script:** `scripts/vps-setup.sql` (Creates required indexes, extensions, and tables for clean VPS initialization).
- **Automated Backup Script:** `scripts/backup-db.sh` (Runs nightly timestamped `pg_dump` with gzip compression and 7-day retention).

---

## 4. Key Operational API Routes

| Endpoint | Method | Security & Scope | Description |
|---|---|---|---|
| `/api/auth/super-admin/login` | POST | 4-Factor Bcrypt, Rate Limited | Authenticates Super Admin, issues 24-hour `homeseva_sa_token` HttpOnly cookie |
| `/api/auth/super-admin/verify-field` | POST | Rate Limited (15m lock after 5 fails) | Real-time debounced single-factor verification for 3D lock UI |
| `/api/auth/super-admin/reset-credentials` | POST | 3-Factor Current Auth Required | Validates current password, PIN4, PIN8 before updating master credentials |
| `/api/auth/member-login` | POST | Bcrypt, Tenant Scoped, Rate Limited | Authenticates staff member with email, password, and PIN; issues 30-day cookie |
| `/api/auth/businesses` | GET | Public / Tenant Catalog | Lists active business workspaces, roles, and tabs with fallback resiliency |
| `/api/admin/backup` | GET | Super Admin Session Required | Streams encrypted/sanitized database backup with credentials masked |
| `/api/admin/credentials` | GET/POST | Super Admin Session Required | Inspects, rotates, and generates secure credentials for business roles |
| `/api/admin/roles` | GET/POST | Super Admin Session Required | Manages roles and permissions per business workspace |
| `/api/admin/tab-access` | GET/POST | Super Admin Session Required | Configures tab visibility and edit capabilities per role |

---

## 5. Automated Verification & Quality Assurance

All features, security defenses, and optimizations are backed by comprehensive automated test suites:

```bash
# Step 1 Security & Auth Verification (25 assertions)
node scripts/test-step1-security-suite.mjs

# Step 2 Database Architecture & API Hardening (32 assertions)
node scripts/test-step2-database-suite.mjs

# Optimization & Resource Reduction Suite (17 assertions)
node scripts/test-optimization-suite.mjs

# Full TypeScript Compilation Check (5/5 packages green)
pnpm type-check

# ESLint Linting Suite (0 warnings, 0 errors)
pnpm lint
```

**Total Automated Tests:** 74 Passed, 0 Failed.
