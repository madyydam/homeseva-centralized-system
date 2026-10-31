# HomeSeva Central ERP — Current Application Status & Architecture

**Last Updated:** 31 October 2026  
**Status:** Rebuilt, Verified, & Consolidated

---

## 1. Executive Summary

The entire HomeSeva portal backend, authentication, multi-business isolation, and role management have been completely audited and rebuilt with **Supabase as the Single Source of Truth**.

### Key Architectural Highlights:
1. **Zero Hardcoded Frontend Credentials / Data:**
   - All legacy in-memory credentials, hardcoded passwords, mock users, and test fallback blocks have been **permanently eradicated** from all API routes and frontend pages.
   - If Supabase tables are not migrated, APIs fail closed with an informative `503 Service Unavailable` error directing the administrator to execute the master SQL setup.
2. **Single Consolidated Master SQL File:**
   - Every single schema migration, table definition, RLS policy, index, and seed dataset has been unified into **one non-destructive master SQL script**:
     > `c:\Users\madhu\Desktop\HomeSeva\scripts\supabase_master_setup.sql`
   - All redundant, fragmented, or obsolete SQL files have been cleanly deleted.
3. **Super Admin 4-Factor Authentication & 3D Interactive Lock UX:**
   - 4-Factor Authentication: Master Username (`madyydam`), Master Password (`Msd@7821`), 4-Digit PIN (`7821`), and 8-Digit Master Key (`78200145`).
   - Stored as salted bcrypt hashes in `public.super_admin_credentials`.
   - **Interactive 3D Lock UX:** Real-time debounced (1s) verification. As each credential matches in Supabase, the lock surges to 1.65x in 3D perspective and detonates like a bomb with dual expanding shockwave rings, 12 radial spark debris particles, nuclear flash, and a shackle pop recoil before settling into a glowing neon unlocked state.
   - **Screen-Fitting Layout:** Form organized into a compact 2x2 grid (2 fields in a row) fitting 100% inside standard viewport height without page scrolling.
4. **Multi-Business Staff Dynamic Roles:**
   - Staff select Company -> Branch / Division (e.g. *Gentle Hair Wigs* studios in Viman Nagar / Ravet / Kolhapur or *HoReCa Essentials* sales vs. crockery rental) -> Dynamic Role fetched from Supabase -> enter Password & PIN.
   - Staff passwords and PINs are stored in `public.business_roles` in Supabase so Super Admin can inspect, rotate, and copy them in `/super-admin/credentials`.
5. **Rate Limiting & Lockout:**
   - 5 consecutive failed attempts trigger an automatic 15-minute lockout on both Super Admin and Staff roles.

---

## 2. Master Database Schema (`scripts/supabase_master_setup.sql`)

| Table Name | Primary Key | Description & Scope |
|---|---|---|
| `super_admin_credentials` | `id TEXT ('primary')` | Holds bcrypt hashes for Username, Password, PIN-4, and PIN-8, plus failed attempt counters and lockout timestamps. |
| `businesses` | `id TEXT` | Registry for all 10 businesses (`slug`, `name`, `subtitle`, `theme_color`, `is_active`, `config`). Compatible with existing Prisma TEXT IDs. |
| `business_roles` | `id TEXT` | Dynamic per-business role catalog, labels, departments, passwords, PINs, and lockout status. |
| `tabs` | `id TEXT` | Workspace navigation tabs (`crm`, `telecalling`, `finance`, `crockery_rental`, `inventory`, etc.) linked via `business_id`. |
| `role_tab_access` | `id TEXT` | Granular tab permissions per role (`can_view`, `can_edit`). |
| `audit_logs` | `id TEXT` | Immutable audit trail capturing login events, IP addresses, actors, and metadata. |
| `items`, `customers`, `bookings`, `booking_items`, `stock_ledger`, `invoices`, `payments` | `id UUID` | HoReCa Crockery Rental operational tables, dispatch/return ledger, invoice numbering, and settlement tracking. |

---

## 3. Active Workspaces & Sub-Companies

The platform supports 10 isolated business workspaces:
1. **Prefab Construction Solutions** (`prefab-construction`) — Civil engineering, modular building solutions.
2. **HoReCa Essentials & Crockery Rental** (`horeca-essentials`) — Sub-divisions: Essentials Supply & Crockery Rental.
3. **Gentle Hair Wigs Studio** (`gentle-hair-wigs`) — Studios: Viman Nagar, Ravet, & Kolhapur.
4. **Ecolab Institutional Distribution** (`ecolab-distribution`) — Commercial hygiene, industrial chemicals.
5. **HS Co-working Spaces** (`hs-coworking`) — Desks, private cabins, community ops.
6. **First Mover Advantage** (`first-mover-advantage`) — SaaS application ecosystem.
7. **Printbooth Digital Printing** (`printbooth`) — Commercial printing & packaging.
8. **DVR Enterprise** (`dvr-enterprise`) — Industrial goods & material trading.
9. **NDA Security & Facility Care** (`nda-services`) — Manned guarding & surveillance deployments.
10. **HS Real Estate & Assets** (`hs-real-estate`) — Commercial leasing & asset portfolios.

---

## 4. Operational API Routes

- `POST /api/auth/super-admin/verify-field`: Live debounced single-factor verification against Supabase.
- `POST /api/auth/super-admin/login`: Final 4-factor verification issuing HttpOnly `homeseva_sa_token` session.
- `POST /api/auth/verify`: Staff role authentication against `business_roles` issuing `homeseva_user_session`.
- `GET /api/auth/businesses`: Dynamic catalog of active businesses, roles, and tabs.
- `GET/POST /api/admin/credentials`: Super Admin credential rotation & staff role password/PIN management console.
- `GET/POST /api/admin/roles`: Custom role creation & deletion per business.
- `GET/POST /api/admin/tab-access`: Tab visibility assignment per role.

---

## 5. Deployment Instructions

1. Open **Supabase Dashboard -> SQL Editor**.
2. Copy the entire contents of `scripts/supabase_master_setup.sql`.
3. Click **Run**. The script will safely create all tables, adapt existing columns, seed the 10 businesses, and initialize Super Admin credentials.
4. Navigate to `http://localhost:3000/super-admin/signin` and log in with master credentials (`madyydam` / `Msd@7821` / `7821` / `78200145`).

