# ADR-001 — Tech Stack Decision (Self-Hosted PostgreSQL & Production Architecture)

**Date:** 2026-10-29 (Updated November 2026)  
**Status:** Accepted & Implemented  
**Branch:** `production-migration`

## Context
HomeSeva serves ~500 users across 10 diverse businesses from one centralized portal, requiring strict per-business data isolation, individual staff member authentication, zero hardcoded credentials, and high-performance operation on a self-hosted Hostinger KVM 2 VPS (2 vCPU, 8 GB RAM) without third-party vendor lock-in or recurring cloud database costs.

## Decisions

| Layer | Choice | Details / Reason |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR + dynamic imports per business module; TypeScript first. Interactive 3D locks and responsive UI. |
| **Backend / API** | Next.js Route Handlers | Node.js runtime with `force-dynamic` execution; fully asynchronous non-blocking event loop. |
| **Database** | Self-Hosted PostgreSQL 16 | Direct self-hosted database on Hostinger VPS; zero external cloud vendor dependency. |
| **ORM & Data Layer** | Prisma ORM (`@homeseva/db`) | Strongly typed schema, automatic migrations, connection pool singleton with `connection_limit=15`. |
| **Containerization** | Docker & Docker Compose | Multi-stage build with Next.js `output: 'standalone'` reducing container size from 1.2 GB to 56 MB. |
| **Reverse Proxy & SSL** | Caddy v2 | Automated Let's Encrypt TLS certificate provisioning and HTTPS termination for `erphomeseva.tech`. |
| **Authentication (Super Admin)** | 4-Factor Authentication | Master Username, Password, 4-Digit PIN, 8-Digit Master Key. Stored as salted Bcrypt hashes in `super_admin_credentials`. |
| **Authentication (Staff)** | Individual Member Login | Company -> Branch/Division -> Assigned Role -> Individual Email + Password + Security PIN. Stored in `role_members`. |
| **Password Hashing** | Asynchronous Bcrypt (`bcryptjs`) | Cost factor 10, non-blocking asynchronous calls (`compare` / `hash`), with zero-downtime auto-rehash for legacy rows. |
| **Session Security** | Web Crypto API JWTs | HttpOnly, Secure, SameSite=Lax cookies: 30-day lifetime for staff (`ONE_MONTH_SESSION_SECONDS`), 24-hour for Super Admin. |
| **Lockout Protection** | Automated Account Lockout | 5 consecutive failed attempts trigger an automated 15-minute lockout on `failedAttempts` and `lockedUntil`. |
| **Audit Trail** | PostgreSQL `audit_logs` | Immutable audit trail capturing login events, IP addresses, actors, and metadata. |
| **Client Optimization** | Page Visibility API | Background polling intervals automatically pause when employee browser tab is hidden or minimized. |

## Consequences
- **Zero Third-Party Database Lock-in**: Complete removal of Supabase dependencies (`@supabase/supabase-js`, `@supabase/ssr`). Complete data ownership and zero external monthly API costs.
- **Ultra-Lightweight Footprint**: Next.js standalone container reduces image size by 94%, ensuring effortless operation within 1024 MB Node.js heap limit on the 8 GB VPS.
- **Connection Safety**: PostgreSQL connection pooling caps (`connection_limit=15`) prevent database connection spikes and server memory crashes under concurrent usage.
- **Comprehensive Verification**: 74 automated test assertions pass with 0 failures across security, database architecture, and performance suites.
