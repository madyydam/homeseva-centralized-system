# ADR-003 — Authentication Flow

**Date:** 2026-10-29  
**Status:** Accepted

## Sign-In Flows

### Business User
1. User clicks business card on home page → `/signin/[businessSlug]`
2. Enters Role ID + password
3. Server: verify credentials AND Role ID belongs to this business (AUTH-2)
4. If first login → force password change (AUTH-3)
5. On success → HttpOnly session cookie + redirect to assigned tabs

### Super Admin
1. Separate link on home page → `/super-admin/signin`
2. Enters email + password
3. Server validates → prompts for TOTP code (AUTH-6, mandatory 2FA)
4. On success → HttpOnly session cookie with `isSuperAdmin: true`

### Owner (2FA mandatory — AUTH-6)
- Same as business user but TOTP is required after password

## Session Rules (AUTH-4)
- HttpOnly, Secure, SameSite=Lax cookie
- Expires after inactivity (default: 8 hours)
- Super Admin can terminate any session from the console

## Rate Limiting (AUTH-5)
- 5 failed attempts → account locked for 15 minutes
- Every attempt (success + failure) written to audit_log

## Server-Side Enforcement (AUTH-7)
Every API request checks:
1. Session is valid and not expired
2. `businessId` in token matches the requested business
3. User has the required `module.action` permission for the route

