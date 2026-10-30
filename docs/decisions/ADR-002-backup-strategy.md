# ADR-002 — Backup Strategy

**Date:** 2026-10-29  
**Status:** Accepted

## Context
PRD v1.2 makes Backup & Restore a top-level feature (Section 4, BK-1 → BK-13).

## Two Kinds of Backup

### 1. Nightly Whole-Database Backup (Disaster Recovery)
- Tool: `pg_dump` or `pgBackRest`
- Schedule: Every night, automated
- Stored: Outside the main server (S3-compatible bucket)
- Covers: Entire database — all 10 businesses
- Who triggers: Automated (cron), Super Admin can also trigger manually
- Goal: Lose at most 24 hours of data in a disaster

### 2. Per-Business Package (Selective Restore — BK-3)
- Tool: HomeSeva itself — scoped SQL export + S3 file copy
- Triggered by: Super Admin selects businesses → clicks "Take Backup Now"
- One package per selected business (+ one small group package for the business list)
- Contains: data rows, uploaded files, settings, audit log — for that business only
- Does NOT contain: data from any other business
- Encrypted, checksummed, labelled with schema version
- Stored: Outside the main server
- Restore: One business at a time, either as a copy or over the live business (with confirmation)

## Retention Rule (default, to be confirmed)
- 7 daily, 4 weekly, 12 monthly (BK-10)

## Security
- Download requires password + 2FA code (BK-7)
- Restore over live data requires typing the business name + 2FA (BK-8)
- Every action written to audit log (BK-13)

