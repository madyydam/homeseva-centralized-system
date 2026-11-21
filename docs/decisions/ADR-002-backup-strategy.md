# ADR-002 — Backup & Disaster Recovery Strategy

**Date:** 2026-10-29 (Updated November 2026)  
**Status:** Accepted & Implemented  
**Branch:** `production-migration`

## Context
HomeSeva houses critical business operations across 10 businesses (bookings, financial invoices, CRM leads, stock ledgers). A multi-tiered backup architecture is required to guarantee zero data loss, fast recovery, and automated maintenance on the self-hosted VPS.

## Decisions

### 1. Automated Nightly Whole-Database Backup (Disaster Recovery)
- **Tool:** Shell automation script (`scripts/backup-db.sh`) executing `docker exec -t homeseva_postgres pg_dump` with gzip compression.
- **Schedule:** Automated nightly execution via cron job (`0 2 * * *`).
- **Storage:** Host-level `/opt/homeseva/backups` directory, with automated retention pruning keeping the last 7 daily backups.
- **Format:** `homeseva_backup_YYYYMMDD_HHMMSS.sql.gz`.
- **Target Recovery Objective:** RPO (Recovery Point Objective) <= 24 hours; RTO (Recovery Time Objective) <= 30 minutes.

### 2. Authenticated Admin Backup API (`/api/admin/backup`)
- **Endpoint:** `GET /api/admin/backup`
- **Authorization:** Strictly gated by `getCurrentSuperAdminSession()`; returns `401 Unauthorized` for non-admin actors.
- **Credential Masking:** Sensitive credentials (passwords, PINs, master keys) are dynamically replaced with `[PROTECTED_CREDENTIAL]` to prevent credential exfiltration.
- **Payload:** Structured JSON dump containing tenant configurations, business roles, tab access rules, and non-sensitive metadata for auditing or cross-environment synchronization.

### 3. Per-Business Scoped Export (Selective Migration)
- Scoped database queries using `businessResolver.ts` canonical UUIDs (`b1000000-0000-0000-0000-000000000001` through `...010`).
- Allows individual businesses to export their isolated records (CRM leads, tickets, orders, rental inventory) without touching adjacent company data.

## Retention & Storage Policy
- **Daily Backups:** Kept for 7 days on local VPS host disk.
- **Weekly / Off-Site Sync:** Scheduled synchronization to S3-compatible cold storage (Cloudflare R2 / AWS S3) for disaster isolation.
- **Audit Logging:** Every backup trigger, download, or restoration event is recorded in PostgreSQL `audit_logs` with actor identifier, timestamp, and IP address.
