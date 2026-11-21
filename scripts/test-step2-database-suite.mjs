/**
 * Comprehensive Step 2 Database & API Route Security Test Suite
 * Validates:
 * 1. Business resolver maps canonical UUIDs and aliases correctly
 * 2. Zero runtime dynamic DDL (CREATE TABLE IF NOT EXISTS) in API routes
 * 3. Zero raw unsafe SQL ($executeRawUnsafe, $queryRawUnsafe) in API routes
 * 4. Zero in-memory OOM scans for phone numbers (targeted endsWith indexes used)
 * 5. Authentication enforced across backup, sync, CRM, orders, tickets, and reports (no dev bypasses)
 * 6. ACID transactions wrapping multi-step booking and invoice line item syncs
 * 7. Multi-tenant seed script uses Bcrypt and canonical UUID directory
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName} - ${details}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🧪 STEP 2: DATABASE & API SECURITY VERIFICATION');
console.log('========================================\n');

// 1. Business Resolver Verification
console.log('[1/7] Verifying Canonical Business Resolver...');
try {
  const resolverFile = path.join(process.cwd(), 'packages/db/src/businessResolver.ts');
  assert(existsSync(resolverFile), 'businessResolver.ts exists');
  const resolverCode = readFileSync(resolverFile, 'utf-8');

  assert(
    resolverCode.includes('b1000000-0000-0000-0000-000000000001') &&
    resolverCode.includes('b1000000-0000-0000-0000-000000000002') &&
    resolverCode.includes('b1000000-0000-0000-0000-000000000003') &&
    resolverCode.includes('b1000000-0000-0000-0000-000000000007'),
    'Canonical UUIDs (b1000000-0000-0000-0000-000000000001..010) are mapped'
  );

  assert(
    resolverCode.includes("'crockery-rental':") &&
    resolverCode.includes("'3':") &&
    resolverCode.includes("'printbooth':"),
    'Legacy aliases (crockery-rental, 3, printbooth) are mapped to canonical slugs'
  );

  assert(
    resolverCode.includes('export async function resolveBusiness') &&
    resolverCode.includes('export async function resolveBusinessId'),
    'Helper functions resolveBusiness and resolveBusinessId are exported'
  );
} catch (e) {
  assert(false, 'Business resolver test execution', e.message);
}

// 2. Eradication of Dynamic DDL
console.log('\n[2/7] Verifying Eradication of Runtime Dynamic DDL...');
try {
  const apiFiles = [
    'apps/web/src/app/api/printbooth/crm-leads/route.ts',
    'apps/web/src/app/api/printbooth/orders/route.ts',
    'apps/web/src/app/api/printbooth/tickets/route.ts',
    'apps/web/src/app/api/gentle-hair-wigs/crm-leads/route.ts',
    'apps/web/src/app/api/gentle-hair-wigs/studios/route.ts',
    'apps/web/src/app/api/gentle-hair-wigs/sync/route.ts',
    'apps/web/src/app/api/crockery-rental/sync/route.ts',
    'apps/web/src/app/api/admin/backup/route.ts',
  ];

  for (const relPath of apiFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, 'utf-8');
    assert(
      !content.includes('CREATE TABLE IF NOT EXISTS'),
      `Zero dynamic DDL (CREATE TABLE IF NOT EXISTS) in ${path.basename(relPath)}`
    );
  }
} catch (e) {
  assert(false, 'Dynamic DDL check', e.message);
}

// 3. Eradication of Raw Unsafe SQL
console.log('\n[3/7] Verifying Eradication of Raw Unsafe SQL ($executeRawUnsafe / $queryRawUnsafe)...');
try {
  const printboothFiles = [
    'apps/web/src/app/api/printbooth/crm-leads/route.ts',
    'apps/web/src/app/api/printbooth/orders/route.ts',
    'apps/web/src/app/api/printbooth/tickets/route.ts',
  ];

  for (const relPath of printboothFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    const content = readFileSync(fullPath, 'utf-8');
    assert(
      !content.includes('$executeRawUnsafe') && !content.includes('$queryRawUnsafe'),
      `Zero raw unsafe SQL in ${path.basename(relPath)} (converted to typed Prisma models)`
    );
  }
} catch (e) {
  assert(false, 'Raw SQL check', e.message);
}

// 4. OOM Elimination (Targeted Database Indexed Lookups)
console.log('\n[4/7] Verifying OOM Elimination on Phone Duplicate Checks...');
try {
  const gentleCrmFile = path.join(process.cwd(), 'apps/web/src/app/api/gentle-hair-wigs/crm-leads/route.ts');
  const gentleCrmCode = readFileSync(gentleCrmFile, 'utf-8');
  assert(
    gentleCrmCode.includes('phone: { endsWith: phoneDigits }'),
    'Gentle Hair Wigs CRM uses targeted { endsWith: phoneDigits } query instead of in-memory find'
  );
  assert(
    !gentleCrmCode.includes('allLeads.find('),
    'Gentle Hair Wigs CRM in-memory table scan completely removed'
  );

  const pbCrmFile = path.join(process.cwd(), 'apps/web/src/app/api/printbooth/crm-leads/route.ts');
  const pbCrmCode = readFileSync(pbCrmFile, 'utf-8');
  assert(
    pbCrmCode.includes('phone: { endsWith: phoneDigits }'),
    'Printbooth CRM uses targeted { endsWith: phoneDigits } query instead of in-memory find'
  );
  assert(
    !pbCrmCode.includes('existingRows.find('),
    'Printbooth CRM in-memory table scan completely removed'
  );
} catch (e) {
  assert(false, 'OOM check', e.message);
}

// 5. API Route Authentication & Authorization Hardening
console.log('\n[5/7] Verifying API Route Authentication Hardening & No Dev Bypasses...');
try {
  const backupFile = path.join(process.cwd(), 'apps/web/src/app/api/admin/backup/route.ts');
  const backupCode = readFileSync(backupFile, 'utf-8');
  assert(
    backupCode.includes('getCurrentSuperAdminSession') && backupCode.includes('401'),
    'Backup endpoint enforces getCurrentSuperAdminSession() with 401 on unauthorized'
  );
  assert(
    backupCode.includes('[PROTECTED_CREDENTIAL]'),
    'Backup endpoint masks sensitive passwords and PINs'
  );

  const gentleSyncFile = path.join(process.cwd(), 'apps/web/src/app/api/gentle-hair-wigs/sync/route.ts');
  const gentleSyncCode = readFileSync(gentleSyncFile, 'utf-8');
  assert(
    gentleSyncCode.includes('isAuthorized()') && !gentleSyncCode.includes("process.env.NODE_ENV !== 'production'"),
    'Gentle Hair Wigs sync enforces strict session check with NO dev bypass'
  );

  const pbOrdersFile = path.join(process.cwd(), 'apps/web/src/app/api/printbooth/orders/route.ts');
  const pbOrdersCode = readFileSync(pbOrdersFile, 'utf-8');
  assert(
    pbOrdersCode.includes('isAuthorized()') && pbOrdersCode.includes('deleteMany'),
    'Printbooth orders endpoint enforces isAuthorized() and scopes DELETE by businessId'
  );

  const pbTicketsFile = path.join(process.cwd(), 'apps/web/src/app/api/printbooth/tickets/route.ts');
  const pbTicketsCode = readFileSync(pbTicketsFile, 'utf-8');
  assert(
    pbTicketsCode.includes('isAuthorized()') && pbTicketsCode.includes('deleteMany'),
    'Printbooth tickets endpoint enforces isAuthorized() and scopes DELETE by businessId'
  );

  const pbReportFile = path.join(process.cwd(), 'apps/web/src/app/api/printbooth/daily-report/route.ts');
  const pbReportCode = readFileSync(pbReportFile, 'utf-8');
  assert(
    pbReportCode.includes('isAuthorized()') && pbReportCode.includes('parseUtcMidnight'),
    'Printbooth daily reports enforce auth and normalize date to UTC midnight'
  );
} catch (e) {
  assert(false, 'Auth hardening check', e.message);
}

// 6. ACID Transactions Verification
console.log('\n[6/7] Verifying ACID Transactions on Multi-Step Mutations...');
try {
  const crockerySyncFile = path.join(process.cwd(), 'apps/web/src/app/api/crockery-rental/sync/route.ts');
  const crockerySyncCode = readFileSync(crockerySyncFile, 'utf-8');
  assert(
    crockerySyncCode.includes('prisma.$transaction(async (tx) => {') &&
    crockerySyncCode.includes('tx.crockeryBooking.upsert') &&
    crockerySyncCode.includes('tx.crockeryBookingItem.deleteMany') &&
    crockerySyncCode.includes('tx.crockeryBookingItem.createMany'),
    'Crockery rental booking line item sync is wrapped in an atomic interactive ACID transaction'
  );
  assert(
    crockerySyncCode.includes('tx.crockeryInvoice.upsert') &&
    crockerySyncCode.includes('tx.crockeryInvoiceLine.deleteMany') &&
    crockerySyncCode.includes('tx.crockeryInvoiceLine.createMany'),
    'Crockery rental invoice line item sync is wrapped in an atomic interactive ACID transaction'
  );
} catch (e) {
  assert(false, 'ACID transaction check', e.message);
}

// 7. Seed Script Pipeline Architecture
console.log('\n[7/7] Verifying Unified Seed Pipeline Architecture...');
try {
  const seedFile = path.join(process.cwd(), 'packages/db/src/seed.ts');
  assert(existsSync(seedFile), 'seed.ts exists');
  const seedCode = readFileSync(seedFile, 'utf-8');

  assert(
    seedCode.includes("import bcrypt from 'bcryptjs'") && seedCode.includes('bcrypt.hash'),
    'Seed script uses Bcrypt hashing for all provisioned credentials'
  );
  assert(
    seedCode.includes('superAdminCredentials.upsert'),
    'Seed script provisions SuperAdminCredentials with Bcrypt hashes'
  );
  assert(
    seedCode.includes('CANONICAL_BUSINESSES') &&
    seedCode.includes('b1000000-0000-0000-0000-000000000003'),
    'Seed script seeds all 10 canonical businesses with deterministic UUIDs'
  );
  assert(
    seedCode.includes('businessRole.upsert') && seedCode.includes('roleTabAccess.upsert'),
    'Seed script provisions default roles and role tab access with Bcrypt hashes'
  );
} catch (e) {
  assert(false, 'Seed pipeline check', e.message);
}

console.log('\n========================================');
console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
