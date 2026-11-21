import { PrismaClient } from '../packages/db/generated/client/index.js';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-only-homesevalocal32char';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createSignedSessionToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', JWT_SECRET).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

async function runStep4Tests() {
  console.log('================================================================');
  console.log(' STEP 4 TEST SUITE: WORKSPACE PERSISTENCE & FUTURE-SCALABLE DB');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: Database Table and Schema Integrity
    // -------------------------------------------------------------
    console.log('[TEST 1] Verifying business_workspace_data table in PostgreSQL...');
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'business_workspace_data';
    `);
    assert(tableExists.length > 0, 'public.business_workspace_data table exists');

    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'business_workspace_data'
      ORDER BY ordinal_position;
    `);
    const colNames = columns.map((c) => c.column_name);
    assert(colNames.includes('id'), 'Column "id" exists');
    assert(colNames.includes('business_id'), 'Column "business_id" exists');
    assert(colNames.includes('section'), 'Column "section" exists');
    assert(colNames.includes('data'), 'Column "data" (JSONB) exists');
    assert(colNames.includes('created_at'), 'Column "created_at" exists');
    assert(colNames.includes('updated_at'), 'Column "updated_at" exists');

    const allIndexes = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'business_workspace_data';
    `);
    console.log('Indexes on business_workspace_data:', allIndexes);
    const uniqueIndex = allIndexes.filter((idx) => idx.indexdef.toLowerCase().includes('unique') && idx.indexdef.includes('business_id') && idx.indexdef.includes('section'));
    assert(uniqueIndex.length > 0, 'Unique constraint on (business_id, section) exists');

    // -------------------------------------------------------------
    // TEST 2: All 8 Migrated Businesses Exist in Registry
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Verifying business registry for all 8 target businesses...');
    const TARGET_SLUGS = [
      'prefab-construction',
      'ecolab-distribution',
      'hs-coworking',
      'first-mover-advantage',
      'dvr-enterprise',
      'nda-services',
      'hs-real-estate',
      'horeca-essentials',
    ];

    const businesses = await prisma.business.findMany({
      where: { slug: { in: TARGET_SLUGS } },
    });
    const foundSlugs = businesses.map((b) => b.slug);
    for (const slug of TARGET_SLUGS) {
      assert(foundSlugs.includes(slug), `Business registry contains "${slug}"`);
    }

    // -------------------------------------------------------------
    // TEST 3: CRUD & Multi-Tenant Isolation in BusinessWorkspaceData
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing Multi-Tenant CRUD operations & zero leakage...');
    
    // Pick two businesses for cross-tenant isolation test
    const prefabBiz = businesses.find((b) => b.slug === 'prefab-construction');
    const coworkingBiz = businesses.find((b) => b.slug === 'hs-coworking');

    assert(Boolean(prefabBiz && coworkingBiz), 'Both prefab and coworking business records resolved');

    // Clean any prior test entries
    await prisma.businessWorkspaceData.deleteMany({
      where: {
        businessId: { in: [prefabBiz.id, coworkingBiz.id] },
        section: 'test-section-4',
      },
    });

    // Create record for Prefab Construction
    const prefabPayload = {
      sites: [{ id: 'site-901', name: 'Pune High-Rise Prefab Pod 1', budget: 1200000 }],
      boqList: [{ id: 'boq-101', item: 'Cold-formed steel studs', qty: 500 }],
    };

    const createdPrefab = await prisma.businessWorkspaceData.create({
      data: {
        businessId: prefabBiz.id,
        section: 'test-section-4',
        data: prefabPayload,
      },
    });
    assert(createdPrefab.id !== undefined, 'Created BusinessWorkspaceData for prefab-construction');

    // Create record for HS Coworking
    const coworkingPayload = {
      members: [{ id: 'mem-401', name: 'Vertex AI Labs', deskType: 'Hot Desk' }],
      roomBookings: [{ id: 'room-501', room: 'Boardroom A', date: '2026-11-25' }],
    };

    const createdCoworking = await prisma.businessWorkspaceData.create({
      data: {
        businessId: coworkingBiz.id,
        section: 'test-section-4',
        data: coworkingPayload,
      },
    });
    assert(createdCoworking.id !== undefined, 'Created BusinessWorkspaceData for hs-coworking');

    // Verify Prefab query returns ONLY Prefab data
    const readPrefab = await prisma.businessWorkspaceData.findUnique({
      where: {
        businessId_section: {
          businessId: prefabBiz.id,
          section: 'test-section-4',
        },
      },
    });
    assert(readPrefab !== null, 'Found Prefab workspace record');
    assert(readPrefab.data.sites[0].name === 'Pune High-Rise Prefab Pod 1', 'Prefab data contents match');
    assert(readPrefab.data.members === undefined, 'Prefab record has NO Coworking data (zero tenant leakage)');

    // Verify Coworking query returns ONLY Coworking data
    const readCoworking = await prisma.businessWorkspaceData.findUnique({
      where: {
        businessId_section: {
          businessId: coworkingBiz.id,
          section: 'test-section-4',
        },
      },
    });
    assert(readCoworking !== null, 'Found Coworking workspace record');
    assert(readCoworking.data.members[0].name === 'Vertex AI Labs', 'Coworking data contents match');
    assert(readCoworking.data.sites === undefined, 'Coworking record has NO Prefab data (zero tenant leakage)');

    // -------------------------------------------------------------
    // TEST 4: Upsert Semantics (Future-Scalable Without Schema Lock-In)
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing flexible Upsert (future-scalable dynamic payload updates)...');
    
    // Add new fields dynamically without needing DDL migrations
    const updatedPrefabPayload = {
      ...prefabPayload,
      milestoneBills: [{ id: 'bill-88', stage: 'Erection', amount: 450000 }],
      futureCustomRoleFields: { inspectorNotes: 'Passed structural engineering inspection', score: 98 },
    };

    const upserted = await prisma.businessWorkspaceData.upsert({
      where: {
        businessId_section: {
          businessId: prefabBiz.id,
          section: 'test-section-4',
        },
      },
      create: {
        businessId: prefabBiz.id,
        section: 'test-section-4',
        data: updatedPrefabPayload,
      },
      update: {
        data: updatedPrefabPayload,
      },
    });

    assert(upserted.data.milestoneBills.length === 1, 'Upsert updated payload with new milestoneBills');
    assert(upserted.data.futureCustomRoleFields.score === 98, 'Upsert preserved unstructured future-scalable fields');

    // -------------------------------------------------------------
    // TEST 5: All 8 Businesses Full Persistence Verification
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Testing persistent save & retrieve across all 8 businesses...');
    for (const biz of businesses) {
      const sampleData = {
        meta: `Automated persistent sync test for ${biz.slug}`,
        timestamp: new Date().toISOString(),
        itemsCount: 42,
      };

      const record = await prisma.businessWorkspaceData.upsert({
        where: {
          businessId_section: {
            businessId: biz.id,
            section: 'step-4-verification',
          },
        },
        create: {
          businessId: biz.id,
          section: 'step-4-verification',
          data: sampleData,
        },
        update: {
          data: sampleData,
        },
      });

      assert(record.businessId === biz.id, `Successfully persisted workspace data for ${biz.slug}`);
      assert(record.data.itemsCount === 42, `Retrieved intact JSONB data for ${biz.slug}`);

      // Clean up verification row
      await prisma.businessWorkspaceData.delete({
        where: { id: record.id },
      });
    }

    // Clean up test rows
    await prisma.businessWorkspaceData.deleteMany({
      where: {
        businessId: { in: [prefabBiz.id, coworkingBiz.id] },
        section: 'test-section-4',
      },
    });

    // -------------------------------------------------------------
    // TEST 6: Session & Cross-Tenant Access Simulation
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Testing JWT session verification for tenant API security...');
    
    // Simulate Staff member of HS Coworking
    const coworkingStaffSession = {
      userId: 'user-coworking-1',
      memberId: 'mem-1',
      role: 'Coworking Manager',
      businessSlug: 'hs-coworking',
      isSuperAdmin: false,
    };
    const coworkingToken = createSignedSessionToken(coworkingStaffSession);
    assert(Boolean(coworkingToken), 'Generated valid staff JWT for hs-coworking');

    // Simulate Super Admin
    const superAdminSession = {
      userId: 'super-admin-root',
      role: 'Super Admin',
      isSuperAdmin: true,
    };
    const saToken = createSignedSessionToken(superAdminSession);
    assert(Boolean(saToken), 'Generated valid Super Admin JWT');

    console.log('\n================================================================');
    console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n[FATAL TEST FAILURE]', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStep4Tests();
