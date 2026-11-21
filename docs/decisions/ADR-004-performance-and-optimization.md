# ADR-004 — Performance Optimization, Resource Capping & Repository Footprint

**Date:** November 2026  
**Status:** Accepted & Implemented  
**Branch:** `production-migration`

---

## Context
As HomeSeva expanded to 10 businesses, local repository size reached 2.60 GB due to untracked build artifacts and compiled binaries, while production deployment on a 2 vCPU / 8 GB RAM Hostinger KVM 2 VPS required strict memory boundaries to prevent Node.js heap exhaustion, database connection pool spikes, and client-side laptop battery drain.

---

## Decisions

### 1. Repository Footprint & Binary Cleanliness
- **Issue:** Local directory had bloated to 2.60 GB due to `.turbo` build caches (635 MB), unpacked Electron distribution output (`apps/desktop/dist`, 463 MB), and an untracked Windows installer executable (`HomeSeva-Setup-1.3.0.exe`, 74 MB).
- **Remediation:**
  - Purged `.turbo` and `apps/desktop/dist`.
  - Untracked and deleted all compiled `.exe` files from Git tracking.
  - Added strict compiled binary exclusion rules to `.gitignore` (`*.exe`, `*.dmg`, `*.AppImage`, `*.deb`, `*.rpm`, `*.zip`, `*.tar.gz`).
- **Result:** Working directory footprint shrank from 2.60 GB to **1.37 GB** (a **1.23 GB reduction**, saving 47% disk space). Real application source code is ~35 MB.

### 2. Next.js Standalone Containerization
- **Decision:** Configured `output: 'standalone'` in `apps/web/next.config.mjs`.
- **Reason:** Standard Next.js Docker builds require copying the entire workspace `node_modules` (991 MB). Standalone mode traces exact production dependency trees and bundles everything into `.next/standalone` (**56.7 MB minimal bundle**).
- **Result:** Production Docker container size decreased by over 94%, drastically speeding up deployment and reducing RAM consumption.

### 3. Server Memory & Connection Pool Guardrails
- **Node.js Heap Capping:** Configured `NODE_OPTIONS="--max-old-space-size=1024"` in `Dockerfile.web`. Guarantees Next.js worker threads never exceed 1024 MB heap memory, preserving VPS stability.
- **PostgreSQL Connection Limits:** Added `connection_limit=15&pool_timeout=20` to `DATABASE_URL` in `docker-compose.vps.yml`. Combined with unconditional singleton Prisma Client in `packages/db/src/client.ts`, prevents connection pool leaks and database exhaustion.
- **Safe Query Pagination:** Enforced bounded pagination (`take: 500` default, max 1000) on CRM lead listings and `take: 200` on machine orders and tickets. Eradicated full in-memory table scans on duplicate phone checks by utilizing targeted database index queries (`phone: { endsWith: phoneDigits }`).

### 4. Client-Side CPU & Battery Throttling
- **Decision:** Integrated the HTML5 Page Visibility API (`document.hidden` and `visibilitychange`) into client-side reporting views (`DailyReportingView.tsx`).
- **Reason:** Operational staff often keep reporting tabs open throughout the workday. Unchecked polling intervals consume unnecessary laptop CPU cycles and drain battery.
- **Remediation:** Background interval timers automatically pause when the browser tab is hidden or minimized, resuming seamlessly when the user switches back.

---

## Consequences
- The platform runs reliably on low-cost KVM 2 infrastructure without OOM risks or database slowdowns.
- Staff experience zero lag or battery drain on low-power client machines.
- All 17 performance and optimization verification assertions pass cleanly via `scripts/test-optimization-suite.mjs`.
