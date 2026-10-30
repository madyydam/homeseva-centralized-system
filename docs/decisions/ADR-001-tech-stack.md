# ADR-001 — Tech Stack Decision

**Date:** 2026-10-29  
**Status:** Accepted

## Context
HomeSeva needs to serve ~500 users across 10 very different businesses from one system, with strict per-business data isolation and role-based access.

## Decisions

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + lazy loading per module; TypeScript first |
| Backend | NestJS (modular) | Module-per-feature maps directly to business modules |
| Database | PostgreSQL 16 + Prisma | RLS for business isolation; Prisma for type-safety |
| Permissions | CASL | Shared rules between frontend and backend |
| Auth | JWT in HttpOnly cookie + Argon2 + TOTP | PRD AUTH-3, AUTH-4, AUTH-6 |
| Cache | Redis | Permission sets + monthly summaries (PF-6) |
| Files | MinIO (dev) / S3 (prod), one folder per business | BF-2: per-business backup scope |
| Backup | pg_dump (nightly) + HomeSeva per-business packages | PRD v1.2 Section 4 |
| Hosting | Docker + Nginx on VPS | Simple ops, daily pg_dump backups |

## Consequences
- All new tables MUST carry a `businessId` (enforced by CI — BF-6)
- All file uploads MUST go to `{bucket}/{businessId}/...` path
- Permissions are checked server-side on every request (AUTH-7)

