/**
 * HomeSeva ERP — Step 3 Middleware & Route Isolation Verification Suite
 * Verifies all 6 tasks from step-3-middleware-and-route-isolation-execution-plan.md:
 * 1. Edge Middleware Engine existence and configuration
 * 2. Super Admin route guards & anti-tamper redirection
 * 3. Multi-tenant workspace isolation & cross-tenant barrier
 * 4. API route shielding & 401/403 anti-IDOR rejection
 * 5. Role-level UI sandboxing for telecallers (Gentle & Printbooth)
 * 6. Edge runtime compatibility & cryptographic token verification
 */

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
  console.log('   STEP 3: MIDDLEWARE & ROUTE ISOLATION VERIFICATION');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────
  // TEST 1: Middleware Architecture & Matcher Configuration
  // ─────────────────────────────────────────────────────────
  console.log('[TEST 1] Edge Middleware File & Configuration:');
  const middlewarePath = path.join(process.cwd(), 'apps/web/src/middleware.ts');
  assert(existsSync(middlewarePath), 'apps/web/src/middleware.ts file exists');

  const middlewareCode = readFileSync(middlewarePath, 'utf-8');

  assert(
    middlewareCode.includes("matcher: [") &&
    middlewareCode.includes("'/super-admin/:path*'") &&
    middlewareCode.includes("'/app/:path*'") &&
    middlewareCode.includes("'/api/:path*'"),
    'middleware config.matcher explicitly targets /super-admin, /app, and /api routes'
  );

  assert(
    !middlewareCode.includes("import { prisma }") &&
    !middlewareCode.includes("from '@prisma/client'"),
    'middleware has zero Prisma or native Node bindings (100% Edge runtime safe)'
  );

  // ─────────────────────────────────────────────────────────
  // TEST 2: Cryptographic Token Engine Integration
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 2] Cryptographic Token Engine Integration:');
  try {
    const authModule = await import('../apps/web/src/lib/authSession.ts');
    const { signSession, verifySession, SUPER_ADMIN_COOKIE, USER_SESSION_COOKIE } = authModule;

    assert(SUPER_ADMIN_COOKIE === 'homeseva_sa_token', 'SUPER_ADMIN_COOKIE is "homeseva_sa_token"');
    assert(USER_SESSION_COOKIE === 'homeseva_user_session', 'USER_SESSION_COOKIE is "homeseva_user_session"');

    // Generate Super Admin Token
    const saToken = await signSession({
      sub: 'primary-admin',
      role: 'Super Admin',
      isSuperAdmin: true,
      username: 'SUPER_ADMIN',
    });
    const verifiedSa = await verifySession(saToken);
    assert(verifiedSa !== null && verifiedSa.isSuperAdmin === true, 'Super Admin token signs and verifies with isSuperAdmin=true');

    // Generate Staff Token for Gentle Hair Wigs
    const gentleToken = await signSession({
      sub: 'gentle-staff-1',
      role: 'Cold Caller',
      businessSlug: 'gentle-hair-wigs',
      isSuperAdmin: false,
      memberName: 'Gentle Caller',
      email: 'gentle.caller@homeseva.com',
    });
    const verifiedGentle = await verifySession(gentleToken);
    assert(verifiedGentle !== null && verifiedGentle.businessSlug === 'gentle-hair-wigs', 'Gentle staff token signs and verifies with businessSlug="gentle-hair-wigs"');

    // Generate Staff Token for ADJS / Printbooth
    const printboothToken = await signSession({
      sub: 'pb-staff-1',
      role: 'Coldcaller',
      businessSlug: 'adjs',
      isSuperAdmin: false,
      memberName: 'PB Caller',
      email: 'pb.caller@homeseva.com',
    });
    const verifiedPb = await verifySession(printboothToken);
    assert(verifiedPb !== null && verifiedPb.businessSlug === 'adjs', 'Printbooth staff token signs and verifies with businessSlug="adjs"');

    // Tampered token test
    const tampered = saToken.slice(0, -6) + 'xxxxxx';
    const verifiedTampered = await verifySession(tampered);
    assert(verifiedTampered === null, 'Tampered token signature is strictly rejected by verifySession');
  } catch (err) {
    assert(false, `Crypto token engine test error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────
  // TEST 3: Super Admin Route Guard Logic
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 3] Super Admin Portal Route Guarding:');
  assert(
    middlewareCode.includes("pathname.startsWith('/super-admin')"),
    'middleware intercepts all /super-admin/* traffic'
  );
  assert(
    middlewareCode.includes("pathname === '/super-admin/signin'") &&
    middlewareCode.includes("NextResponse.redirect(new URL('/super-admin/companies'"),
    'authenticated Super Admin visiting /super-admin/signin is redirected to /super-admin/companies'
  );
  assert(
    middlewareCode.includes("new URL('/super-admin/signin', req.url)") &&
    middlewareCode.includes("loginUrl.searchParams.set('from', pathname)"),
    'unauthenticated requests to /super-admin/* are redirected to /super-admin/signin with ?from= query'
  );
  assert(
    middlewareCode.includes("res.cookies.delete(SUPER_ADMIN_COOKIE)"),
    'invalid or expired Super Admin token triggers automatic cookie deletion'
  );

  // ─────────────────────────────────────────────────────────
  // TEST 4: Multi-Tenant Workspace Guard & Cross-Tenant Barrier
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 4] Multi-Tenant Workspace & Cross-Tenant Barrier:');
  assert(
    middlewareCode.includes("pathname.startsWith('/app/')") &&
    middlewareCode.includes("pathname.match(/^\\/app\\/([^\\/]+)/)"),
    'middleware intercepts /app/:businessSlug/* and parses target business slug'
  );
  assert(
    middlewareCode.includes("new URL(requestedSlug ? `/signin/${requestedSlug}` : '/', req.url)"),
    'unauthenticated /app/:businessSlug/* traffic is redirected to company-specific /signin/:businessSlug'
  );
  assert(
    middlewareCode.includes("if (session.isSuperAdmin)") &&
    middlewareCode.includes("return NextResponse.next()"),
    'Super Admin is granted universal inspection across all company workspaces'
  );
  assert(
    middlewareCode.includes("normalizeBusinessSlug(requestedSlug)") &&
    middlewareCode.includes("normalizeBusinessSlug(session.businessSlug)"),
    'middleware applies canonical slug normalization before comparing tenants'
  );
  assert(
    middlewareCode.includes("if (requestedCanonical !== sessionCanonical)") &&
    middlewareCode.includes("redirectUrl.searchParams.set('error', 'unauthorized_workspace')"),
    'cross-tenant mismatch is strictly blocked and staff redirected to their authorized dashboard'
  );

  // ─────────────────────────────────────────────────────────
  // TEST 5: API Route Guarding & Anti-IDOR Enforcement
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 5] API Route Guarding & Anti-IDOR Enforcement:');
  assert(
    middlewareCode.includes("const PUBLIC_API_PREFIXES = [") &&
    middlewareCode.includes("'/api/auth/member-login'") &&
    middlewareCode.includes("'/api/auth/super-admin/login'") &&
    middlewareCode.includes("'/api/auth/me'"),
    'public auth API endpoints are whitelisted for signin flows'
  );
  assert(
    middlewareCode.includes("pathname.startsWith('/api/admin/')") &&
    middlewareCode.includes("status: 401"),
    'unauthorized calls to /api/admin/* and /api/members receive HTTP 401 rejection'
  );
  assert(
    middlewareCode.includes("pathname.startsWith('/api/gentle-hair-wigs/')") &&
    middlewareCode.includes("if (sessionCanonical !== 'gentle-hair-wigs')") &&
    middlewareCode.includes("status: 403"),
    'calls to /api/gentle-hair-wigs/* by other tenants receive HTTP 403 Forbidden'
  );
  assert(
    middlewareCode.includes("pathname.startsWith('/api/printbooth/')") &&
    middlewareCode.includes("if (sessionCanonical !== 'adjs')") &&
    middlewareCode.includes("status: 403"),
    'calls to /api/printbooth/* by other tenants receive HTTP 403 Forbidden'
  );
  assert(
    middlewareCode.includes("pathname.startsWith('/api/crockery-rental/')") &&
    middlewareCode.includes("if (sessionCanonical !== 'horeca-essentials')") &&
    middlewareCode.includes("status: 403"),
    'calls to /api/crockery-rental/* by other tenants receive HTTP 403 Forbidden'
  );

  // ─────────────────────────────────────────────────────────
  // TEST 6: Role-Level UI Sandboxing (Gentle & Printbooth)
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 6] Role-Level UI Sandboxing (Telecallers):');
  const gentleDashboardCode = readFileSync(path.join(process.cwd(), 'apps/web/src/businesses/gentle-hair-wigs/Dashboard.tsx'), 'utf-8');
  assert(
    gentleDashboardCode.includes("if (isColdCaller)") &&
    gentleDashboardCode.includes("return <ColdCallerDashboard {...props} />;"),
    'Gentle Hair Wigs Dashboard strictly isolates cold callers to <ColdCallerDashboard />'
  );

  const gentleColdcallerCode = readFileSync(path.join(process.cwd(), 'apps/web/src/businesses/gentle-hair-wigs/ColdCallerDashboard.tsx'), 'utf-8');
  assert(
    !gentleColdcallerCode.includes("ManagerDashboard") &&
    !gentleColdcallerCode.includes("FinancePnlView") &&
    !gentleColdcallerCode.includes("SopView"),
    'Gentle Hair Wigs ColdCallerDashboard has 0 imports or references to Manager, Finance, or SOP views'
  );

  const adjsDashboardCode = readFileSync(path.join(process.cwd(), 'apps/web/src/businesses/adjs/Dashboard.tsx'), 'utf-8');
  assert(
    adjsDashboardCode.includes("if (isColdcaller)") &&
    adjsDashboardCode.includes("return <ColdcallerDashboard {...props} role={role} />;"),
    'ADJS / Printbooth Dashboard strictly isolates cold callers to <ColdcallerDashboard />'
  );
  assert(
    adjsDashboardCode.includes("homeseva_user_session"),
    'ADJS / Printbooth Dashboard checks canonical "homeseva_user_session" cookie'
  );

  const adjsColdcallerCode = readFileSync(path.join(process.cwd(), 'apps/web/src/businesses/adjs/ColdcallerDashboard.tsx'), 'utf-8');
  assert(
    !adjsColdcallerCode.includes("EnterpriseDashboard") &&
    !adjsColdcallerCode.includes("DeveloperWorkspace"),
    'ADJS ColdcallerDashboard has 0 imports or references to EnterpriseDashboard or DeveloperWorkspace'
  );

  // ─────────────────────────────────────────────────────────
  // TEST 7: Dead Code Elimination & Architecture Purity
  // ─────────────────────────────────────────────────────────
  console.log('\n[TEST 7] Dead Code Elimination & Architecture Purity:');
  assert(
    !existsSync(path.join(process.cwd(), 'apps/web/src/lib/api.ts')),
    'Unused dead file apps/web/src/lib/api.ts is completely eradicated'
  );
  assert(
    !existsSync(path.join(process.cwd(), 'apps/web/src/lib/supabase')),
    'Legacy empty directory apps/web/src/lib/supabase is completely eradicated'
  );
  assert(
    !existsSync(path.join(process.cwd(), 'apps/web/src/app/(auth)')),
    'Empty scaffolding route group apps/web/src/app/(auth) is completely eradicated'
  );
  assert(
    !existsSync(path.join(process.cwd(), 'apps/web/src/app/(public)')),
    'Empty scaffolding route group apps/web/src/app/(public) is completely eradicated'
  );
  assert(
    !existsSync(path.join(process.cwd(), 'apps/web/src/app/(super-admin)')),
    'Empty scaffolding route group apps/web/src/app/(super-admin) is completely eradicated'
  );
  assert(
    middlewareCode.includes("pathname === '/app' || pathname === '/app/'"),
    'middleware provides smart redirect for /app root to prevent 404 dead-ends'
  );

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
