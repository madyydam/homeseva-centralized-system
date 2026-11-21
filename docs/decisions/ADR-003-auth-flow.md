# ADR-003 — Authentication & Authorization Flow

**Date:** 2026-10-29 (Updated November 2026)  
**Status:** Accepted & Implemented  
**Branch:** `production-migration`

---

## 1. Super Admin 4-Factor Security Vault

### Architecture:
- **Authentication Factors:**
  1. Master Username
  2. Master Password (minimum 8 characters)
  3. 4-Digit Security PIN
  4. 8-Digit Master Key
- **Storage:** Stored exclusively as salted Bcrypt hashes in PostgreSQL table `super_admin_credentials`.
- **Zero Plaintext Secrets:** Initialized via secure seed script (`packages/db/src/seed.ts`) or environment variables; no plaintext passwords exist in source code or documentation.

### Sign-In Experience (`/super-admin/signin`):
1. **Viewport-Optimized Layout:** Compact 2x2 grid fitting 100% inside standard viewport height without page scrolling.
2. **Real-Time Debounced Verification:** As the administrator types any factor (debounced 1s), the client queries `/api/auth/super-admin/verify-field`.
3. **Interactive 3D Visual Lock:** 
   - Real-time visual feedback: Validated factor unlocks in 3D perspective with particle detonation and glowing neon state.
4. **Final Authentication:** Submitting the form posts to `/api/auth/super-admin/login`.
   - Validates all 4 factors using asynchronous Bcrypt (`verifyCredential`).
   - Resets failed attempt counter upon success.
   - Logs login event to `audit_logs`.
   - Issues HttpOnly, Secure, SameSite=Lax `homeseva_sa_token` session cookie (24-hour validity).

### Master Credentials Reset Flow:
- When the Super Admin needs to rotate or recover credentials, a dedicated modal on `/super-admin/signin` is available.
- **Strict Verification Protocol:** Requires validation of all 3 current master security factors (Current Password, Current PIN-4, Current PIN-8) via `/api/auth/super-admin/reset-credentials`.
- Updates `super_admin_credentials` with newly salted Bcrypt hashes and resets failed attempts.

---

## 2. Individual Staff Member Authentication (`/api/auth/member-login`)

### Model:
- **Individual Member Accounts (`role_members`):** Staff authenticate using their assigned company workspace, branch, dynamic role, individual email address, password, and optional 4-digit security PIN.
- **Strict Tenant & Role Scoping:** The authentication engine strictly queries `role_members` matching `businessId`, `roleId`, and `email`. If an email is recognized under a different role in the business workspace, the API returns a descriptive `403 Access Denied` detailing their assigned roles, preventing role mismatch confusion.
- **Legacy Endpoint Deprecation:** Legacy shared role authentication (`/api/auth/verify`) is permanently disabled with `403 Forbidden` in favor of individual staff member accounts.

### Sign-In Experience (`/signin/[businessSlug]`):
1. User selects business from public portal or direct slug URL.
2. If business has multiple branches (e.g. *Gentle Hair Wigs* studios in Viman Nagar / Ravet / Kolhapur), user selects branch.
3. System fetches active roles dynamically via `/api/auth/businesses?slug=[slug]`. If the database is cold or unseeded, client-side memoized fallback roles ensure the UI never freezes on loading.
4. User selects Role from dropdown, enters assigned Email, Password, and Security PIN.
5. `POST /api/auth/member-login` verifies the credentials against `role_members`.
   - Rejects empty PIN if PIN is configured.
   - Verifies Bcrypt hash asynchronously. If legacy row requires rehash, transparently auto-upgrades to Bcrypt with zero downtime.
6. **30-Day Persistent Session Cookie:**
   - Issues HttpOnly, Secure, SameSite=Lax `homeseva_user_session` cookie valid for 30 days (`ONE_MONTH_SESSION_SECONDS = 2,592,000s`).
   - Eliminates daily re-login friction for operational staff while maintaining finite cryptographic token expiration.
   - Redirects to `/app/[businessSlug]/dashboard`.

---

## 3. Rate Limiting & Account Lockout Defense

- **Threshold:** 5 consecutive failed verification attempts.
- **Lockout Duration:** 15 minutes.
- **Enforcement:**
  - **Super Admin:** Tracked on `super_admin_credentials.failed_attempts` and `super_admin_credentials.locked_until`.
  - **Staff Members:** Tracked on `role_members.failed_attempts` and `role_members.locked_until`.
  - **Verify-Field Oracle Throttling:** Invalid single-factor probes on `/api/auth/super-admin/verify-field` also increment failed attempts and trigger a 15-minute lock after 5 failures.
- **User Feedback:** Clear warning showing remaining attempts (`(3 attempt(s) remaining before 15-minute lock)`), and when locked, displays remaining minutes until unlock.

---

## 4. Session Verification & Route Isolation

- Session tokens are signed and verified using the Web Crypto API (`jose` JWT standard).
- **Super Admin Guard:** Verifies `homeseva_sa_token` contains `{ isSuperAdmin: true }`.
- **Tenant Workspace Guard:** Verifies `homeseva_user_session` contains authorized `businessSlug` or active Super Admin session.
- **Client Fallback:** If session expires or is missing, user is redirected to the appropriate sign-in screen.
