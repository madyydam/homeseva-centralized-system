# ADR-003 — Authentication & Authorization Flow

**Date:** 2026-10-29 (Updated 2026-10-31)  
**Status:** Accepted & Implemented

## 1. Super Admin Authentication (4-Factor Security Vault)

### Credentials:
- **Username:** `madyydam`
- **Master Password:** `Msd@7821`
- **4-Digit Security PIN:** `7821`
- **8-Digit Master Key:** `78200145`
- **Storage:** Stored as salted bcrypt hashes inside Supabase table `public.super_admin_credentials`.

### Sign-In Experience (`/super-admin/signin`):
1. User enters `/super-admin/signin`.
2. Form layout: Compact 2x2 grid (2 fields in a row) engineered to fit 100% inside standard viewport height without page scrolling.
3. **Live Debounced Verification:** As the user pauses for 1 second while typing any field, the client sends a background request to `/api/auth/super-admin/verify-field`.
4. **Super 3D Bomb Detonation Animation:**
   - When a factor matches in Supabase:
     - **3D Surge:** Lock zooms up to `scale(1.65)` and `translateZ(110px)` in perspective.
     - **Detonation:** Explodes with dual 360° expanding shockwave rings, intense white flash, and 12 radial spark debris particles.
     - **Recoil & Settle:** Shackle violently pops open (-30° recoil) and settles into a radiant neon 3D unlocked state.
5. Once all 4 locks burst open, the user clicks **Authenticate & Open Control Panel**, issuing `POST /api/auth/super-admin/login`.
6. Server verifies all 4 bcrypt hashes, resets failed attempts, logs to `audit_logs`, and issues an HttpOnly `homeseva_sa_token` session cookie (24-hour validity).

---

## 2. Staff Role-Based Authentication

### Model:
- No individual personal user sign-ups. Multiple staff members in a business branch share role credentials.
- Staff passwords and PINs are stored in `public.business_roles` in Supabase so that Super Admin can inspect, rotate, and copy them in `/super-admin/credentials`.

### Sign-In Experience (`/signin/[businessSlug]`):
1. User selects business from public portal.
2. If business has multiple branches/divisions (e.g. *Gentle Hair Wigs* studios in Viman Nagar / Ravet / Kolhapur or *HoReCa Essentials* sales vs. crockery rental), user selects branch/division.
3. Dynamically fetches active roles from Supabase via `/api/auth/businesses?slug=[slug]`.
4. User selects Role from dropdown, enters Password and 4-digit PIN.
5. Server validates against `public.business_roles` via `/api/auth/verify`.
6. On success: Sets HttpOnly `homeseva_user_session` cookie (12-hour validity) and redirects to `/app/[businessSlug]/dashboard`.

---

## 3. Rate Limiting & Lockout Policy
- **Threshold:** 5 consecutive failed verification attempts.
- **Lockout Duration:** 15 minutes.
- Enforced on both Super Admin (`super_admin_credentials.locked_until`) and Staff roles (`business_roles.locked_until`).
- Remaining lockout minutes are displayed to the user.

---

## 4. Route Protection & Edge Middleware
- `apps/web/src/middleware.ts` runs on Edge runtime using Web Crypto API.
- Guard `/super-admin/*`: Requires valid `homeseva_sa_token` with `isSuperAdmin: true`.
- Guard `/app/:businessSlug/*`: Requires valid session with matching `businessSlug` or active Super Admin session.
- Unauthenticated requests are immediately redirected to respective login screens.
