# HomeSeva Central ERP — Production Migration Plan (PLAN.md)

This plan defines the exact, numbered tasks required to transform HomeSeva ERP from a vibe-coded prototype into a hardened, production-ready enterprise platform running on self-hosted PostgreSQL and ready for VPS deployment.

---

## Task Overview & Dependency Graph

```
[Phase 1: Security & Cleanup]
  ├── Task 1: Neutralize Hardcoded Secrets & Committed Artifacts
  ├── Task 2: Remove Redundant 'dve-enterprises' Directory & Debug Files
  └── Task 3: Establish Automated Test Runner (`pnpm test`)

[Phase 2: Database Schema & Migration Architecture]
  ├── Task 4: Harmonize Canonical Business Registry IDs
  ├── Task 5: Consolidate Database Schema into Prisma & Versioned SQL
  └── Task 6: Seed Script Driven by Environment Variables

[Phase 3: Supabase Elimination & Server Query Layer]
  ├── Task 7: Replace Supabase Client with Direct PostgreSQL / Prisma Engine
  ├── Task 8: Uninstall Supabase SDK Packages & Purge Env References
  └── Task 9: Remove Supabase RLS Policies in Favor of Server Enforcement

[Phase 4: Server-Side Auth, Password Hashing & RBAC]
  ├── Task 10: Bcrypt Password & PIN Hashing Engine
  ├── Task 11: Eliminate Credential Oracles (`verify-field` Endpoints)
  ├── Task 12: Session Lifetime & Security Cookie Hardening
  └── Task 13: Next.js Server-Side Middleware for Route & API Protection

[Phase 5: Eradicate Mock Data & LocalStorage Dependency]
  ├── Task 14: Eliminate Universal Demo User (`abc@xyz.com`) Across All Seeds
  ├── Task 15: Dynamic Role & Business Hydration (Remove Hardcoded Catalogs)
  └── Task 16: Migrate 7 LocalStorage-Only Business Modules to PostgreSQL Persistence

[Phase 6: Feature Hardening & Security Bug Fixes]
  ├── Task 17: Secure & Authenticate Backup Generation / Download System
  ├── Task 18: Close Open Mail Relay (`/api/email/test`) & Secure SMTP
  ├── Task 19: Persistent Daily Reporting Engine (Eliminate Volatile In-Memory Maps)
  └── Task 20: Persist Google Sheets Iframe Links to PostgreSQL

[Phase 7: VPS Production Deployment & Operations]
  ├── Task 21: Production Docker Compose & Localhost PostgreSQL Security
  ├── Task 22: Nginx Reverse Proxy with HTTPS / SSL & Security Headers
  └── Task 23: Automated Nightly Database Backup & Rotation Cron Job
```

---

## Detailed Task Specifications

### TASK 1: Neutralize Hardcoded Secrets & Committed Artifacts
* **What will change**: Remove hardcoded Gmail SMTP app password (`ocfpvxposnxevbhg`), personal email address (`madhurdhadve7@gmail.com`), and hardcoded fallback HMAC keys from source code and example env files. Replace with strict environment variable reads (`process.env.SMTP_PASS`, `process.env.AUTH_SECRET`) that fail fast if missing in production.
* **Files affected**:
  * `apps/web/src/lib/email.ts`
  * `apps/web/src/app/api/email/test/route.ts`
  * `apps/web/src/lib/authSession.ts`
  * `.env.vps.example`
* **Risk**: Low. Local development will require valid `.env` values or mocked local SMTP.
* **Rollback Note**: Revert modified files with `git checkout`.
* **Exact Verification Test**:
  ```bash
  git grep -in "ocfpvxposnxevbhg"
  git grep -in "homeseva_production_super_secret"
  # Both commands must return ZERO matches.
  ```

---

### TASK 2: Remove Redundant 'dve-enterprises' Directory & Debug Files
* **What will change**: Delete the phantom duplicate directory `apps/web/src/businesses/dve-enterprises/` (a typo copy of `dvr-enterprise`). Remove references from `apps/web/src/businesses/index.ts`. Remove stray debug text files in `apps/desktop/` (`err.txt`, `err2.txt`, `out.txt`, `out2.txt`).
* **Files affected**:
  * `apps/web/src/businesses/dve-enterprises/` (DELETED)
  * `apps/web/src/businesses/index.ts`
  * `apps/desktop/err.txt`, `err2.txt`, `out.txt`, `out2.txt` (DELETED)
* **Risk**: Low. Verified that all routing resolves to `dvr-enterprise`.
* **Rollback Note**: `git checkout -- apps/web/src/businesses/`
* **Exact Verification Test**:
  ```bash
  pnpm build
  # Build succeeds with zero missing module errors.
  ```

---

### TASK 3: Establish Automated Test Runner (`pnpm test`)
* **What will change**: Add `"test": "turbo run test"` to root `package.json`. Add a test runner script in `@homeseva/web` using Node's native test runner (`node --test`) to test authentication, permission enforcement, and business data isolation with real HTTP and database assertions.
* **Files affected**:
  * `package.json`
  * `apps/web/package.json`
  * `apps/web/test/auth.test.ts`
  * `apps/web/test/isolation.test.ts`
* **Risk**: Low. Adds testing infrastructure without affecting runtime code.
* **Rollback Note**: `git checkout -- package.json apps/web/package.json`
* **Exact Verification Test**:
  ```bash
  pnpm test
  # Exits with code 0 and reports test suite results.
  ```

---

### TASK 4: Harmonize Canonical Business Registry IDs
* **What will change**: Standardize the 10 business IDs across the entire project. Reconcile the discrepancy between `database/00_core_platform.sql` (`b1000000-0000-0000-0000-000000000001`..`010`), `seed.ts` (`'1'`..`'10'`), and routes hardcoding `'3'`, `'adjs'`, or `'crockery-rental'`. Use canonical slug-based resolution on the server so business lookup is always consistent and foreign key constraints never fail.
* **Files affected**:
  * `database/00_core_platform.sql`
  * `packages/db/src/seed.ts`
  * `apps/web/src/app/api/gentle-hair-wigs/seed/route.ts`
  * `apps/web/src/app/api/gentle-hair-wigs/crm-leads/route.ts`
  * `apps/web/src/app/api/gentle-hair-wigs/daily-reports/route.ts`
  * `apps/web/src/app/api/gentle-hair-wigs/sync/route.ts`
  * `apps/web/src/app/api/printbooth/orders/route.ts`
  * `apps/web/src/app/api/printbooth/tickets/route.ts`
  * `apps/web/src/app/api/crockery-rental/sync/route.ts`
* **Risk**: Medium. Requires updating foreign key queries to use canonical business identifiers.
* **Rollback Note**: Revert SQL and API routes with git.
* **Exact Verification Test**:
  ```bash
  pnpm --filter @homeseva/web exec ts-node -e "/* verify business foreign key constraints */"
  ```

---

### TASK 5: Consolidate Database Schema into Prisma & Versioned SQL
* **What will change**: Update `packages/db/prisma/schema.prisma` to include models for all tables:
  * Core platform: `super_admin_credentials`, `business_roles`, `role_members`, `role_tab_access`, `telecaller_daily_reports`
  * All 10 businesses: Prefab (`prefab_projects`, `prefab_site_logs`), Ecolab (`ecolab_products`, `ecolab_orders`), Coworking (`coworking_desks`, `coworking_memberships`), FMA (`fma_apps`, `fma_subscriptions`), DVR (`dvr_materials`, `dvr_trade_orders`), NDA (`nda_sites`, `nda_guards`), Real Estate (`real_estate_properties`, `real_estate_leases`).
  Run `prisma generate` and produce clean, repeatable migrations.
* **Files affected**:
  * `packages/db/prisma/schema.prisma`
  * `database/` SQL files (standardized constraints and indexes)
* **Risk**: Medium. Changing Prisma schema requires regenerating the client and ensuring all types match.
* **Rollback Note**: Revert `schema.prisma` and run `pnpm db:generate`.
* **Exact Verification Test**:
  ```bash
  pnpm --filter @homeseva/db build
  # Generates Prisma client cleanly with all models present.
  ```

---

### TASK 6: Seed Script Driven by Environment Variables
* **What will change**: Rewrite `packages/db/src/seed.ts` to be completely idempotent and read initial Super Admin credentials from environment variables (`SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_TEMP_PASSWORD`, `SUPER_ADMIN_PIN4`, `SUPER_ADMIN_PIN8`). Seed only the 10 business records and default role structures with ZERO mock users.
* **Files affected**:
  * `packages/db/src/seed.ts`
  * `scripts/vps-setup.sql`
* **Risk**: Low. Replaces obsolete seed logic.
* **Rollback Note**: Revert `packages/db/src/seed.ts`.
* **Exact Verification Test**:
  ```bash
  pnpm --filter @homeseva/db seed
  # Successfully seeds Super Admin and 10 businesses into PostgreSQL without mock users.
  ```

---

### TASK 7: Replace Supabase Client with Direct PostgreSQL / Prisma Engine
* **What will change**: In all 13 API routes currently calling `getAdminClient()` from Supabase, replace `admin.from('table').select(...)` with direct `prisma[model]` queries or parameterized `prisma.$queryRaw` queries.
* **Files affected**:
  * `apps/web/src/app/api/admin/credentials/route.ts`
  * `apps/web/src/app/api/admin/roles/route.ts`
  * `apps/web/src/app/api/admin/tab-access/route.ts`
  * `apps/web/src/app/api/auth/businesses/route.ts`
  * `apps/web/src/app/api/auth/member-login/route.ts`
  * `apps/web/src/app/api/auth/super-admin/login/route.ts`
  * `apps/web/src/app/api/auth/verify/route.ts`
  * `apps/web/src/app/api/gentle-hair-wigs/daily-reports/route.ts`
  * `apps/web/src/app/api/members/route.ts`
  * `apps/web/src/app/api/printbooth/daily-report/route.ts`
* **Risk**: High. Core routing logic changes from PostgREST syntax to Prisma ORM.
* **Rollback Note**: Revert API routes with `git checkout`.
* **Exact Verification Test**:
  ```bash
  pnpm build
  # Type check and build pass; test authentication endpoints against local PostgreSQL.
  ```

---

### TASK 8: Uninstall Supabase SDK Packages & Purge Env References
* **What will change**: Remove `@supabase/supabase-js` and `@supabase/ssr` from `apps/web/package.json` and root `package.json`. Delete `apps/web/src/lib/supabase/` entirely. Remove Supabase variables from `turbo.json`, `.env.vps.example`, and `docker-compose.vps.yml`.
* **Files affected**:
  * `apps/web/package.json`
  * `package.json`
  * `pnpm-lock.yaml`
  * `apps/web/src/lib/supabase/admin.ts` (DELETED)
  * `apps/web/src/lib/supabase/client.ts` (DELETED)
  * `apps/web/src/lib/supabase/server.ts` (DELETED)
  * `turbo.json`
  * `docker-compose.vps.yml`
  * `.env.vps.example`
  * `scripts/test-e2e-human-flow.mjs`
* **Risk**: High. Any remaining Supabase import will trigger build errors.
* **Rollback Note**: Revert package files and run `pnpm install`.
* **Exact Verification Test**:
  ```bash
  git grep -in "supabase" -- ":!docs" ":!*.md"
  # Returns ZERO occurrences in code and configs.
  pnpm build
  # Monorepo builds with zero errors.
  ```

---

### TASK 9: Remove Supabase RLS Policies in Favor of Server Enforcement
* **What will change**: Remove Supabase-specific RLS policies (`ENABLE ROW LEVEL SECURITY`, `CREATE POLICY deny_anon_*`) from `database/00_core_platform.sql` and `scripts/vps-setup.sql`. On a self-hosted PostgreSQL database accessed via Node.js connection pooling, access control must be enforced authoritatively on the server, not in brittle SQL policies.
* **Files affected**:
  * `database/00_core_platform.sql`
  * `scripts/vps-setup.sql`
* **Risk**: Medium. Must ensure application layer enforces isolation (handled in Tasks 10 & 13).
* **Rollback Note**: Revert SQL files.
* **Exact Verification Test**:
  ```bash
  # Execute SQL against clean PostgreSQL instance; runs with zero syntax or permission errors.
  ```

---

### TASK 10: Bcrypt Password & PIN Hashing Engine
* **What will change**:
  * Update `business_roles` and `role_members` schema to store `password_hash TEXT` and `pin_hash TEXT` instead of plaintext.
  * In `api/auth/member-login/route.ts` and `api/auth/verify/route.ts`, verify credentials using `bcrypt.compare()`.
  * In `api/members/route.ts` and `api/admin/roles/route.ts`, hash new passwords and PINs using `bcrypt.hash()` with cost factor 10 before saving. Never return password hashes in response payloads.
* **Files affected**:
  * `database/00_core_platform.sql`
  * `packages/db/prisma/schema.prisma`
  * `apps/web/src/app/api/auth/member-login/route.ts`
  * `apps/web/src/app/api/auth/verify/route.ts`
  * `apps/web/src/app/api/members/route.ts`
  * `apps/web/src/app/api/admin/roles/route.ts`
  * `apps/web/src/app/api/admin/credentials/route.ts`
* **Risk**: High. Changes authentication verification algorithm.
* **Rollback Note**: Revert auth routes and schema.
* **Exact Verification Test**:
  ```bash
  # Test member login with hashed password in database; login succeeds.
  # Inspect database row: verify password is a $2b$10$... bcrypt hash, not plaintext.
  ```

---

### TASK 11: Eliminate Credential Oracles (`verify-field` Endpoints)
* **What will change**: Remove `/api/auth/role/verify-field` and `/api/auth/super-admin/verify-field`. On the client side in `signin/[businessSlug]/page.tsx` and `super-admin/signin/page.tsx`, trigger the key and lock animation on form submission during atomic login rather than making pre-flight HTTP requests per keystroke.
* **Files affected**:
  * `apps/web/src/app/api/auth/role/verify-field/route.ts` (DELETED)
  * `apps/web/src/app/api/auth/super-admin/verify-field/route.ts` (DELETED)
  * `apps/web/src/app/signin/[businessSlug]/page.tsx`
  * `apps/web/src/app/super-admin/signin/page.tsx`
* **Risk**: Medium. UI animation logic is simplified to trigger on submit.
* **Rollback Note**: Restore deleted files and component state.
* **Exact Verification Test**:
  ```bash
  # Verify signin page renders, animation plays on submit, and unauthorized credential probing is blocked.
  ```

---

### TASK 12: Session Lifetime & Security Cookie Hardening
* **What will change**: Replace 100-year and 99-year session cookie durations with standard enterprise session timeouts:
  * Staff sessions: 8 hours (`28800` seconds) or 7 days with sliding expiration.
  * Super Admin sessions: 2 hours (`7200` seconds).
  * Require `AUTH_SECRET` environment variable (min 32 chars) and eliminate the hardcoded fallback string.
  * Enforce `httpOnly: true`, `secure: true` (in production), and `sameSite: 'lax'`.
* **Files affected**:
  * `apps/web/src/lib/authSession.ts`
  * `apps/web/src/app/api/auth/member-login/route.ts`
  * `apps/web/src/app/api/auth/verify/route.ts`
  * `apps/web/src/app/api/auth/super-admin/login/route.ts`
* **Risk**: Low. Standard security hardening.
* **Rollback Note**: Revert `authSession.ts`.
* **Exact Verification Test**:
  ```bash
  # Inspect Set-Cookie header on login response: Max-Age must be <= 604800, not 3153600000.
  ```

---

### TASK 13: Next.js Server-Side Middleware for Route & API Protection
* **What will change**: Create `apps/web/src/middleware.ts` to enforce server-side authentication, role-based access control, and strict business workspace isolation on all `/api/*` and `/app/*` routes before requests hit route handlers.
  * Block unauthorized access to `/api/admin/*` (Super Admin session required).
  * Enforce that a user logged into Business A cannot query or mutate data for Business B.
* **Files affected**:
  * `apps/web/src/middleware.ts` (NEW)
* **Risk**: Medium. Middleware applies globally, so route matching rules must be precise.
* **Rollback Note**: Delete or adjust `middleware.ts`.
* **Exact Verification Test**:
  ```bash
  # Send curl request to /api/admin/backup without cookie -> returns 401 Unauthorized.
  # Send curl request with Business A cookie to Business B API -> returns 403 Forbidden.
  ```

---

### TASK 14: Eliminate Universal Demo User (`abc@xyz.com`) Across All Seeds
* **What will change**: Remove all SQL seed inserts of `abc@xyz.com` / `12345678` / `1234` from `database/01_prefab_construction.sql` through `database/10_hs_real_estate.sql` and `scripts/vps-setup.sql`. The database starts completely clean: only the Super Admin account is provisioned via seed. Real staff members are created through the Super Admin console or seed script.
* **Files affected**:
  * `database/01_prefab_construction.sql` through `10_hs_real_estate.sql`
  * `scripts/vps-setup.sql`
* **Risk**: Low. Ensures zero demo accounts exist in production.
* **Rollback Note**: Revert SQL files.
* **Exact Verification Test**:
  ```bash
  git grep -in "abc@xyz.com"
  # Must return ZERO matches across the entire codebase.
  ```

---

### TASK 15: Dynamic Role & Business Hydration (Remove Hardcoded Catalogs)
* **What will change**:
  * In `apps/web/src/app/page.tsx`, replace the hardcoded `BUSINESSES` array with a dynamic fetch from `/api/auth/businesses`.
  * In `apps/web/src/app/signin/[businessSlug]/page.tsx`, remove `DEFAULT_BUSINESS_ROLES` fallback catalog; fetch active roles dynamically from the database.
  * In `apps/web/src/app/super-admin/companies/page.tsx`, remove pre-filled default passwords (`12345678` / `1234`); require explicit strong inputs or generate random secure credentials.
* **Files affected**:
  * `apps/web/src/app/page.tsx`
  * `apps/web/src/app/signin/[businessSlug]/page.tsx`
  * `apps/web/src/app/super-admin/companies/page.tsx`
* **Risk**: Medium. Requires reliable dynamic loading state.
* **Rollback Note**: Revert UI files.
* **Exact Verification Test**:
  ```bash
  # Test homepage and signin page; roles load dynamically from database.
  ```

---

### TASK 16: Migrate 7 LocalStorage-Only Business Modules to PostgreSQL Persistence
* **What will change**: Create unified database persistence APIs and wire the client-side `./db.ts` adapters in:
  1. `prefab-construction` (Sites, BOQ, Labor, Billing)
  2. `ecolab-distribution` (Products, Orders, Audits)
  3. `hs-coworking` (Desks, Memberships, Bookings)
  4. `first-mover-advantage` (Apps, Subscriptions, Platform Metrics)
  5. `dvr-enterprise` (Materials, Trading Orders, Dispatches)
  6. `nda-services` (Sites, Guards, Incidents)
  7. `hs-real-estate` (Properties, Leases, Maintenance)
  Data created or edited in any of these modules must persist in PostgreSQL and survive app restart.
* **Files affected**:
  * `apps/web/src/app/api/business/[slug]/route.ts` (Unified API or per-module routes)
  * `apps/web/src/businesses/*/db.ts`
  * `packages/db/prisma/schema.prisma`
* **Risk**: High. Replaces client-side storage with network API calls.
* **Rollback Note**: Revert business `db.ts` files.
* **Exact Verification Test**:
  ```bash
  # Create a record in Prefab Construction -> restart server -> record still loads from PostgreSQL.
  ```

---

### TASK 17: Secure & Authenticate Backup Generation / Download System
* **What will change**:
  * Require valid Super Admin session in `GET` and `POST` handlers in `apps/web/src/app/api/admin/backup/route.ts`.
  * Replace formula-estimated fake stats with real PostgreSQL `pg_stat_user_tables` row counts and byte sizes.
  * Calculate authentic SHA-256 checksums from real dumped data.
* **Files affected**:
  * `apps/web/src/app/api/admin/backup/route.ts`
  * `apps/web/src/app/super-admin/backup/page.tsx`
* **Risk**: Medium. Authenticates endpoint and ensures real file streams.
* **Rollback Note**: Revert `apps/web/src/app/api/admin/backup/route.ts`.
* **Exact Verification Test**:
  ```bash
  # Unauthenticated GET /api/admin/backup -> returns 401.
  # Super Admin GET /api/admin/backup?download=gentle-hair-wigs -> downloads valid snapshot with matching SHA-256.
  ```

---

### TASK 18: Close Open Mail Relay (`/api/email/test`) & Secure SMTP
* **What will change**: Restrict `GET /api/email/test` to authenticated Super Admin sessions only or disable it in production (`NODE_ENV === 'production'`). Validate recipient addresses against registered member domains.
* **Files affected**:
  * `apps/web/src/app/api/email/test/route.ts`
* **Risk**: Low. Eliminates an open mail relay vulnerability.
* **Rollback Note**: Revert `route.ts`.
* **Exact Verification Test**:
  ```bash
  # Unauthenticated curl to /api/email/test?to=attacker@gmail.com -> returns 401 Unauthorized.
  ```

---

### TASK 19: Persistent Daily Reporting Engine (Eliminate Volatile In-Memory Maps)
* **What will change**: In `apps/web/src/app/api/gentle-hair-wigs/daily-reports/route.ts` and `apps/web/src/app/api/printbooth/daily-report/route.ts`, eliminate in-memory `Map` caches. Write daily reports and attendance directly to `telecaller_daily_reports` and `printbooth_daily_reports` tables in PostgreSQL using Prisma.
* **Files affected**:
  * `apps/web/src/app/api/gentle-hair-wigs/daily-reports/route.ts`
  * `apps/web/src/app/api/printbooth/daily-report/route.ts`
* **Risk**: Medium. Daily report submissions persist directly to SQL.
* **Rollback Note**: Revert route files.
* **Exact Verification Test**:
  ```bash
  # Submit a daily report -> restart web process -> fetch reports -> report is present in database.
  ```

---

### TASK 20: Persist Google Sheets Iframe Links to PostgreSQL
* **What will change**: Update `apps/web/src/businesses/gentle-hair-wigs/GoogleSheetsView.tsx` to read and save Google Sheets URLs from the `sheet_links` table in PostgreSQL via an authenticated API endpoint (`/api/admin/sheet-links` or business sync), rather than browser `localStorage`.
* **Files affected**:
  * `apps/web/src/businesses/gentle-hair-wigs/GoogleSheetsView.tsx`
  * `apps/web/src/app/api/sheet-links/route.ts` (NEW)
* **Risk**: Low. Replaces localStorage with database backing.
* **Rollback Note**: Revert `GoogleSheetsView.tsx`.
* **Exact Verification Test**:
  ```bash
  # Save a Google Sheet link in Viman Nagar branch -> reload on another browser -> sheet URL persists.
  ```

---

### TASK 21: Production Docker Compose & Localhost PostgreSQL Security
* **What will change**:
  * Update `docker-compose.vps.yml` so that PostgreSQL port `5432` binds strictly to `127.0.0.1:5432` (never `0.0.0.0:5432`), preventing external access.
  * Ensure the Next.js production build runs with clean production environment variables.
  * Remove all Supabase variables from Docker configuration.
* **Files affected**:
  * `docker-compose.vps.yml`
  * `docker-compose.yml`
  * `Dockerfile.web`
* **Risk**: Low. Standard container isolation.
* **Rollback Note**: Revert compose files.
* **Exact Verification Test**:
  ```bash
  # Inspect port bindings: verify postgres is bound only to 127.0.0.1 or internal docker network.
  ```

---

### TASK 22: Nginx Reverse Proxy with HTTPS / SSL & Security Headers
* **What will change**:
  * Update `nginx/nginx.conf` with production-grade security headers: `X-Content-Type-Options nosniff`, `X-Frame-Options SAMEORIGIN`, `X-XSS-Protection "1; mode=block"`, `Strict-Transport-Security`, and Content Security Policy (allowing Google Sheets iframes).
  * Document Certbot SSL setup steps in `VPS_DEPLOYMENT_GUIDE.md`.
* **Files affected**:
  * `nginx/nginx.conf`
  * `VPS_DEPLOYMENT_GUIDE.md`
* **Risk**: Low. Nginx configuration tuning.
* **Rollback Note**: Revert `nginx.conf`.
* **Exact Verification Test**:
  ```bash
  # Validate nginx configuration syntax: nginx -t -c nginx/nginx.conf.
  ```

---

### TASK 23: Automated Nightly Database Backup & Rotation Cron Job
* **What will change**:
  * Hardening `scripts/db-backup.sh`: Ensure automated pg_dump runs via local PostgreSQL socket or `127.0.0.1`, verifies checksums, stores in `/backups/homeseva`, rotates after 7 days, and supports optional S3/MinIO upload.
  * Document cron configuration (`0 2 * * * /path/to/homeseva/scripts/db-backup.sh`).
* **Files affected**:
  * `scripts/db-backup.sh`
  * `VPS_DEPLOYMENT_GUIDE.md`
* **Risk**: Low. Backup script optimization.
* **Rollback Note**: Revert `scripts/db-backup.sh`.
* **Exact Verification Test**:
  ```bash
  # Test execute db-backup.sh dry-run or against local PostgreSQL; dump and sha256 files are produced.
  ```

---

## Definition of Done (DoD)

The project will only be declared production-ready when all of the following conditions are met and proven by real command output:

1. **Clean Monorepo Build**: `pnpm install`, `pnpm build`, `pnpm type-check`, and `pnpm lint` pass with zero warnings and zero errors.
2. **Automated Test Suite**: `pnpm test` executes cleanly and passes all integration tests.
3. **Zero Supabase**: `git grep -in "supabase"` returns zero occurrences across all code, configurations, packages, and environment files (excluding historical docs/ADRs).
4. **Zero Mock / Demo Data**: `git grep -in "abc@xyz.com"` and default passwords return zero occurrences. The database is initialized via a clean seed script with credentials supplied solely by environment variables.
5. **Server-Side Security**:
   - All passwords and PINs are bcrypt hashed.
   - All API routes and pages are guarded on the server by Next.js middleware and session validation.
   - Cross-business data access is strictly forbidden (User in Business A receives 403 when requesting Business B data).
   - Credential oracles and open mail relays are completely removed.
6. **True Persistence Across All 10 Businesses**:
   - Create, edit, and delete operations in every business module persist to PostgreSQL and survive an app/server restart.
7. **Production VPS Readiness**:
   - Docker Compose, Nginx reverse proxy with security headers, and automated backup scripts are verified and documented.
