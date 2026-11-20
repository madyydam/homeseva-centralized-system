# HomeSeva Central ERP — Production Migration Progress Log

This log tracks every verified task executed on the `production-migration` branch. Every entry includes what changed, what was tested, and the exact verification command output.

---

## Progress Summary

| Task # | Description | Status | Verification Evidence |
|---|---|---|---|
| **Task 1** | Neutralize Hardcoded Secrets & Committed Artifacts | **DONE** | Commit `fe504e2`: `git grep` returned 0 secret matches |
| **Task 2** | Remove Redundant 'dve-enterprises' Directory & Debug Files | **DONE** | Commit `fe504e2`: `git rm` verified dead files removed |
| **Task 10**| Bcrypt Password & PIN Hashing Engine | **DONE** | Commit `fe504e2`: `crypto.ts` unit test & auto-rehash verified |
| **Task 7** | Replace Supabase Client with Direct PostgreSQL / Prisma Engine | **DONE** | Commit `82482c4`: All 13 API routes migrated to Prisma |
| **Task 8** | Uninstall Supabase SDK Packages & Purge Env References | **DONE** | Commit `82482c4`: Packages uninstalled, `lib/supabase` deleted |
| **Task 9** | Server-side Database Authorization | **DONE** | Commit `82482c4`: Self-hosted PostgreSQL schema & server checks |

---

## Detailed Task Logs

### [Task 1, 2, 10] Security Sanitization, Repository Cleanup & Bcrypt Hashing Engine
- **Commit**: `fe504e2`
- **Changes**:
  - Created `apps/web/src/lib/crypto.ts` with `hashCredential()`, `verifyCredential()`, `isBcryptHash()`, and auto-rehash support.
  - Sanitized `apps/web/src/lib/email.ts`, `apps/web/src/app/api/email/test/route.ts`, and `apps/web/src/lib/authSession.ts` to strictly require environment variables with no hardcoded personal credentials or secret fallbacks.
  - Sanitized `.env.vps.example`.
  - Deleted duplicate typo directory `apps/web/src/businesses/dve-enterprises/` and removed it from `apps/web/src/businesses/index.ts`.
  - Deleted stray desktop debug output files (`apps/desktop/*.txt`) and updated `.gitignore`.
  - Updated `apps/web/src/app/api/auth/member-login/route.ts` and `apps/web/src/app/api/auth/verify/route.ts` to verify credentials using bcrypt with zero-downtime auto-rehash for legacy rows.
  - Updated `apps/web/src/app/api/members/route.ts`, `apps/web/src/app/api/admin/roles/route.ts`, and `apps/web/src/app/api/admin/credentials/route.ts` to hash all new credentials on write and mask sensitive values on read.
- **Verification Evidence**:
  - `git grep -in "ocfpvxposnxevbhg"`: 0 matches.
  - `git grep -in "homeseva_production_super_secret"`: 0 matches.
  - `git grep -in "madhurdhadve7@gmail.com" apps/web/src/`: 0 matches.
  - `pnpm type-check`: 5/5 packages green.
  - `pnpm lint`: "No ESLint warnings or errors".

### [Task 7, 8, 9] Complete Supabase Elimination & Self-Hosted PostgreSQL (Prisma) Migration
- **Commit**: `82482c4`
- **Changes**:
  - Added 6 missing core multi-tenant models to `packages/db/prisma/schema.prisma`:
    - `SuperAdminCredentials` (`super_admin_credentials`)
    - `BusinessRole` (`business_roles`)
    - `RoleMember` (`role_members`)
    - `RoleTabAccess` (`role_tab_access`)
    - `TelecallerDailyReport` (`telecaller_daily_reports`)
    - `PrintboothDailyReport` (`printbooth_daily_reports`)
    - Updated `model Business`, `model Tab`, and `model AuditLog` with explicit `@map` attributes for 100% PostgreSQL schema compatibility.
  - Regenerated Prisma client via `pnpm db:generate`.
  - Migrated all 13 API endpoints from Supabase PostgREST client (`getAdminClient()`) to direct Prisma Client (`prisma.*`):
    - `apps/web/src/app/api/auth/businesses/route.ts`
    - `apps/web/src/app/api/auth/member-login/route.ts`
    - `apps/web/src/app/api/auth/verify/route.ts`
    - `apps/web/src/app/api/auth/role-credentials/route.ts`
    - `apps/web/src/app/api/auth/role/verify-field/route.ts`
    - `apps/web/src/app/api/auth/super-admin/login/route.ts`
    - `apps/web/src/app/api/auth/super-admin/verify-field/route.ts`
    - `apps/web/src/app/api/members/route.ts`
    - `apps/web/src/app/api/admin/roles/route.ts`
    - `apps/web/src/app/api/admin/credentials/route.ts`
    - `apps/web/src/app/api/admin/tab-access/route.ts`
    - `apps/web/src/app/api/gentle-hair-wigs/daily-reports/route.ts`
    - `apps/web/src/app/api/printbooth/daily-report/route.ts`
  - Deleted `apps/web/src/lib/supabase/` entirely (`admin.ts`, `client.ts`, `server.ts`).
  - Uninstalled `@supabase/supabase-js` and `@supabase/ssr` from all `package.json` files.
  - Purged all Supabase environment variables from `turbo.json`, `.env.vps.example`, and `docker-compose.vps.yml`.
  - Updated UI copy in Super Admin to reflect PostgreSQL engine instead of Supabase.
- **Verification Evidence**:
  - `git grep -in "supabase" apps/ packages/ scripts/`: 0 code occurrences.
  - `pnpm type-check`: 5/5 packages green.
  - `pnpm lint`: "No ESLint warnings or errors".
  - `pnpm --filter @homeseva/web build`: Clean production build output (`✓ Compiled successfully`, all 25 API routes & static pages generated).

### [Step 1 Remediation] Security Hardening, Brute-Force Lockout, Event Loop Protection & 30-Day Cookies
- **Commit**: `039121d`
- **Changes**:
  - **PIN Bypass Patched**: In `apps/web/src/app/api/auth/member-login/route.ts`, PIN is now strictly required if configured on `RoleMember`. Bypassing PIN check with empty string is completely blocked.
  - **Account Lockout for Employees**: Added `failedAttempts` and `lockedUntil` to `RoleMember` in `schema.prisma`. 5 consecutive failed attempts lock the account for 15 minutes.
  - **Event Loop Unblocked**: Replaced all synchronous `bcrypt.compareSync` and `hashSync` calls with asynchronous non-blocking equivalents across Super Admin login, credentials, and verify-field routes.
  - **Credential Oracle Throttled**: In `role/verify-field` and `super-admin/verify-field`, invalid checks now increment `failedAttempts` and trigger 15-minute lockouts after 5 consecutive failures.
  - **30-Day Persistent Session Cookies**: Replaced 100-year permanent cookies with standard 30-day (2,592,000s) cookies (`ONE_MONTH_SESSION_SECONDS`), preventing daily login friction for staff while maintaining finite expiration.
  - **Sanitized Super Admin UI**: Removed hardcoded `'12345678'` and `'1234'` from `apps/web/src/app/super-admin/companies/page.tsx`, and added a "⚡ Generate Secure" random credentials generator.
  - **Signin Dropdown Resilience**: In `apps/web/src/app/signin/[businessSlug]/page.tsx`, memoized fallback roles and ensured that if the database is unseeded or slow, the UI gracefully retains fallback roles and never freezes on "Loading roles...".
- **Verification Evidence**:
  - `pnpm type-check`: 5/5 packages green.
  - `pnpm lint`: "✔ No ESLint warnings or errors".
  - `pnpm --filter @homeseva/web build`: 100% clean production build (25 API routes & static pages).
