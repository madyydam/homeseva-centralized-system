# ADR-001 — Tech Stack Decision

**Date:** 2026-10-29 (Updated 2026-10-31)  
**Status:** Accepted & Implemented

## Context
HomeSeva serves ~500 users across 10 diverse businesses from one centralized portal, requiring strict per-business data isolation, dynamic role assignment, zero hardcoded frontend credentials, and Supabase as the single source of truth.

## Decisions

| Layer | Choice | Details / Reason |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR + dynamic imports per business module; TypeScript first. WaveBackground 3D UI preserved. |
| **Backend / API** | Next.js Route Handlers | `/api/auth/*` and `/api/admin/*` running with `force-dynamic` execution. |
| **Database** | Supabase PostgreSQL | Single Source of Truth. Idempotent master setup (`scripts/supabase_master_setup.sql`) with Row Level Security (RLS). |
| **Supabase Client** | `@supabase/ssr` + `@supabase/supabase-js` | Browser client, server cookie client, and elevated service-role client (`src/lib/supabase/admin.ts`). |
| **Authentication (Super Admin)** | 4-Factor Authentication | Username + Password + 4-Digit PIN + 8-Digit Master Key. Stored as salted bcrypt hashes in `public.super_admin_credentials`. |
| **Authentication (Staff)** | Dynamic Business Role Login | Company -> Branch/Division -> Role -> Password + PIN. Stored in `public.business_roles` for Super Admin oversight. |
| **Session Security** | Web Crypto API JWTs | `homeseva_sa_token` & `homeseva_user_session` in HttpOnly, Secure, SameSite=Lax cookies, verified in Next.js Edge Middleware. |
| **Lockout Protection** | Rate Limiter | 5 consecutive failed attempts trigger an automated 15-minute lockout on both Super Admin and Staff roles. |
| **Audit Trail** | Supabase `audit_logs` | All logins, role changes, and credential rotations logged with IP and actor metadata. |

## Consequences
- **Zero Frontend Hardcoding**: No credentials, users, roles, or business configs are hardcoded in the frontend. All data is fetched live from Supabase.
- **Single SQL Script**: All database schema, tables, indexes, RLS, and seeds are consolidated into `scripts/supabase_master_setup.sql` with zero data loss (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`).
