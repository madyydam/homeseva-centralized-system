# HomeSeva Central ERP — Production Migration Progress Log

This log tracks every verified task executed on the `production-migration` branch. Every entry includes what changed, what was tested, and the exact verification command output.

---

## Progress Summary

| Task # | Description | Status | Verification Evidence |
|---|---|---|---|
| **Task 1** | Neutralize Hardcoded Secrets & Committed Artifacts | IN PROGRESS | Pending verification |
| **Task 2** | Remove Redundant 'dve-enterprises' Directory & Debug Files | IN PROGRESS | Pending verification |
| **Task 10**| Bcrypt Password & PIN Hashing Engine | IN PROGRESS | Pending verification |

---

## Detailed Task Logs

### [Task 1, 2, 10] Security Sanitization, Repository Cleanup & Bcrypt Hashing Engine
- **Date**: 2026-11-20
- **Changes**:
  - Created `apps/web/src/lib/crypto.ts` with `hashCredential()`, `verifyCredential()`, `isBcryptHash()`, and auto-rehash support.
  - Sanitized `apps/web/src/lib/email.ts`, `apps/web/src/app/api/email/test/route.ts`, and `apps/web/src/lib/authSession.ts` to strictly require environment variables with no hardcoded personal credentials or secret fallbacks.
  - Sanitized `.env.vps.example`.
  - Deleted duplicate typo directory `apps/web/src/businesses/dve-enterprises/` and removed it from `apps/web/src/businesses/index.ts`.
  - Deleted stray desktop debug output files (`apps/desktop/*.txt`) and updated `.gitignore`.
  - Updated `apps/web/src/app/api/auth/member-login/route.ts` and `apps/web/src/app/api/auth/verify/route.ts` to verify credentials using bcrypt with zero-downtime auto-rehash for legacy rows.
  - Updated `apps/web/src/app/api/members/route.ts`, `apps/web/src/app/api/admin/roles/route.ts`, and `apps/web/src/app/api/admin/credentials/route.ts` to hash all new credentials on write and mask sensitive values on read.
- **Verification**: Pending execution of type-check, lint, build, secret scan, and crypto unit test.
