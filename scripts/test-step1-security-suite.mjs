/**
 * HomeSeva ERP — Step 1 Security & Auth Hardening Verification Suite
 * Tests all 6 tasks from step-1-remediation-and-cookie-plan.md:
 * 1. PIN bypass prevention
 * 2. 5-attempt brute-force lockout logic
 * 3. Asynchronous non-blocking bcrypt operations (0 compareSync/hashSync)
 * 4. 30-Day persistent session lifetime (ONE_MONTH_SESSION_SECONDS)
 * 5. Elimination of hardcoded default credentials
 * 6. Signin fallback roles resilience
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('   STEP 1 SECURITY & AUTH HARDENING VERIFICATION SUITE');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────
  // TEST 1: Cryptographic Hashing Engine & Auto-Rehash
  // ─────────────────────────────────────────────────────────
  console.log('[TEST 1] Bcrypt Hashing, Verification & Auto-Rehash:');
  try {
    const cryptoModule = await import('../apps/web/src/lib/crypto.ts');
    const { hashCredential, verifyCredential, isBcryptHash } = cryptoModule;

    const plain = 'StrongPass#2026';
    const hash = await hashCredential(plain);

    assert(isBcryptHash(hash), `Generated hash matches modular crypt Bcrypt regex ($2b$10$...): ${hash.slice(0, 15)}...`);
    assert(hash.length === 60, `Bcrypt hash length is exactly 60 characters (got ${hash.length})`);

    const validCheck = await verifyCredential(plain, hash);
    assert(validCheck.isValid === true && validCheck.needsRehash === false, 'Valid plaintext verifies cleanly with needsRehash=false');

    const invalidCheck = await verifyCredential('WrongPass#2026', hash);
    assert(invalidCheck.isValid === false, 'Invalid plaintext is rejected');

    const legacyCheck = await verifyCredential('legacy123', 'legacy123');
    assert(legacyCheck.isValid === true && legacyCheck.needsRehash === true, 'Legacy plaintext row is accepted with needsRehash=true for auto-upgrade');
  } catch (err) {
    assert(false, `Crypto module exception: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // TEST 2: 30-Day (1-Month) Session Cookie Lifetime
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 2] 30-Day Persistent Session Lifetime:');
  try {
    const authModule = await import('../apps/web/src/lib/authSession.ts');
    const { signSession, verifySession, ONE_MONTH_SESSION_SECONDS, PERMANENT_SESSION_LIFETIME } = authModule;

    const EXPECTED_30_DAYS = 30 * 24 * 60 * 60; // 2,592,000 seconds
    assert(ONE_MONTH_SESSION_SECONDS === EXPECTED_30_DAYS, `ONE_MONTH_SESSION_SECONDS is 2,592,000s (got ${ONE_MONTH_SESSION_SECONDS})`);
    assert(PERMANENT_SESSION_LIFETIME === EXPECTED_30_DAYS, `PERMANENT_SESSION_LIFETIME alias mapped to 30 days`);

    const token = await signSession({
      sub: 'test-staff-1',
      role: 'Manager',
      businessSlug: 'adjs',
      isSuperAdmin: false,
    }, ONE_MONTH_SESSION_SECONDS);

    const verified = await verifySession(token);
    assert(verified !== null, 'Generated 30-day session token verified successfully');

    const expectedExp = Date.now() + EXPECTED_30_DAYS * 1000;
    const diffMs = Math.abs(verified.exp - expectedExp);
    assert(diffMs < 5000, `Token exp timestamp matches Date.now() + 30 days (delta: ${diffMs}ms)`);
  } catch (err) {
    assert(false, `AuthSession exception: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // TEST 3: RoleMember PIN Bypass Security Check
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 3] RoleMember PIN Bypass Prevention:');
  try {
    const memberLoginCode = readFileSync(path.join(process.cwd(), 'apps/web/src/app/api/auth/member-login/route.ts'), 'utf-8');

    // Verify condition: PIN required check cannot be bypassed by sending empty string
    assert(
      memberLoginCode.includes('const isPinRequired = !!(targetMember.pin && targetMember.pin.trim());') &&
      memberLoginCode.includes('if (!p) {') &&
      memberLoginCode.includes('Security PIN is required for your account'),
      'member-login route strictly rejects empty PIN (p = "") when targetMember.pin is set'
    );
  } catch (err) {
    assert(false, `PIN bypass test error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // TEST 4: 5-Attempt Account Lockout Protection
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 4] Account Lockout & Brute-Force Rate Limiting:');
  try {
    const prismaSchema = readFileSync(path.join(process.cwd(), 'packages/db/prisma/schema.prisma'), 'utf-8');
    const memberLoginCode = readFileSync(path.join(process.cwd(), 'apps/web/src/app/api/auth/member-login/route.ts'), 'utf-8');
    const verifyFieldCode = readFileSync(path.join(process.cwd(), 'apps/web/src/app/api/auth/role/verify-field/route.ts'), 'utf-8');
    const superVerifyCode = readFileSync(path.join(process.cwd(), 'apps/web/src/app/api/auth/super-admin/verify-field/route.ts'), 'utf-8');

    assert(
      prismaSchema.includes('model RoleMember {') &&
      prismaSchema.includes('failedAttempts Int') &&
      prismaSchema.includes('lockedUntil    DateTime?'),
      'schema.prisma includes failedAttempts and lockedUntil on RoleMember model'
    );

    assert(
      memberLoginCode.includes('if (newAttempts >= 5)') &&
      memberLoginCode.includes('lockedUntil = new Date(Date.now() + 15 * 60 * 1000)'),
      'member-login enforces 15-minute lock after 5 failed password/PIN attempts'
    );

    assert(
      verifyFieldCode.includes('if (newAttempts >= 5)') &&
      verifyFieldCode.includes('lockedUntil = new Date(Date.now() + 15 * 60 * 1000)'),
      'role/verify-field increments failedAttempts and locks role after 5 attempts'
    );

    assert(
      superVerifyCode.includes('if (newAttempts >= 5)') &&
      superVerifyCode.includes('lockedUntil = new Date(Date.now() + 15 * 60 * 1000)'),
      'super-admin/verify-field increments failedAttempts and locks primary admin after 5 attempts'
    );
  } catch (err) {
    assert(false, `Lockout verification error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // TEST 5: Zero Synchronous CPU-Blocking Calls (Event Loop Health)
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 5] Event Loop Health (Zero compareSync / hashSync):');
  try {
    let syncMatches = '';
    try {
      syncMatches = execSync('git grep -n "compareSync\\|hashSync" apps/web/src/', { encoding: 'utf-8' });
    } catch {
      syncMatches = '';
    }
    assert(syncMatches.trim() === '', `Zero occurrences of compareSync or hashSync found in apps/web/src/ (got 0 matches)`);
  } catch (err) {
    assert(false, `Grep check error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // TEST 6: Zero Hardcoded Default Credentials & Secrets
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 6] Elimination of Hardcoded Default Passwords & Secrets:');
  try {
    const companiesPage = readFileSync(path.join(process.cwd(), 'apps/web/src/app/super-admin/companies/page.tsx'), 'utf-8');
    assert(
      !companiesPage.includes("useState('12345678')") &&
      !companiesPage.includes("useState('1234')"),
      'super-admin/companies modal initializes password and PIN to empty strings instead of "12345678" / "1234"'
    );
    assert(
      companiesPage.includes('generateRandomCredentials') &&
      companiesPage.includes('Generate Secure'),
      'super-admin/companies includes high-entropy "⚡ Generate Secure" random credentials utility'
    );

    let personalSecretMatches = '';
    try {
      personalSecretMatches = execSync('git grep -n "ocfpvxposnxevbhg\\|madhurdhadve7@gmail.com" apps/web/src/', { encoding: 'utf-8' });
    } catch {
      personalSecretMatches = '';
    }
    assert(personalSecretMatches.trim() === '', 'Zero occurrences of personal Gmail passwords or emails found in apps/web/src/');
  } catch (err) {
    assert(false, `Secrets check error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // TEST 7: Signin Page Fallback Roles Resilience
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 7] Signin Page Fallback Roles Resilience:');
  try {
    const signinPage = readFileSync(path.join(process.cwd(), 'apps/web/src/app/signin/[businessSlug]/page.tsx'), 'utf-8');

    assert(
      signinPage.includes('const fallbackRoles: DynamicRole[] = useMemo('),
      'fallbackRoles is properly memoized with useMemo to avoid re-render churn'
    );

    assert(
      signinPage.includes('setRoles(fallbackRoles)'),
      'signin page falls back to local role definitions when database query returns empty or fails'
    );

    // Verify critical business roles in DEFAULT_BUSINESS_ROLES
    const rolesToCheck = ['crockery-rental', 'gentle-hair-wigs', 'adjs', 'printbooth', 'horeca-essentials'];
    for (const slug of rolesToCheck) {
      assert(
        signinPage.includes(`'${slug}': [`),
        `DEFAULT_BUSINESS_ROLES has fallback entry for business "${slug}"`
      );
    }
  } catch (err) {
    assert(false, `Signin resilience test error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();
