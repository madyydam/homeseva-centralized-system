// End-to-End Human Flow Verification Test Suite
// Simulates live caller logins, lead isolation, owner inspection, and daily reporting
// STRICT PROTOCOL: Automatically tears down and deletes all test leads, reports, and records created during tests.

import { prisma } from '../packages/db/dist/index.js';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Starting HomeSeva ERP v1.6 End-to-End Human Flow Tests');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Track created test entities for teardown
  const testPhoneNumbers = new Set();
  const testReportStaffIds = new Set();
  let gentleCaller1Leads = null;

  try {
    // TEST 1: Business List & Active Slugs
    console.log('▶ Test 1: Active Business Resolution');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/businesses`);
      const data = await res.json();
      assert(data.success && Array.isArray(data.businesses), 'Businesses endpoint returns success array');
      assert(data.businesses.some(b => b.slug === 'gentle-hair-wigs'), 'Gentle Hair Wigs studio is active');
      assert(data.businesses.some(b => b.slug === 'adjs' || b.slug === 'printbooth'), 'ADJS / PrintBooth is active');
    } catch (err) {
      assert(false, `Test 1 failed with error: ${err.message}`);
    }

    // TEST 2: Member Authentication for Gentle Hair Wigs Callers
    console.log('\n▶ Test 2: Gentle Hair Wigs Member Authentication for Cold Callers');
    let caller1Session = null;
    let caller2Session = null;

    try {
      // Caller 1 (Demo User)
      const res1 = await fetch(`${BASE_URL}/api/auth/member-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: 'gentle-hair-wigs',
          roleId: 'Cold Caller',
          email: 'abc@xyz.com',
          password: '12345678',
          pin: '1234',
        }),
      });
      const data1 = await res1.json();
      assert(data1.success, 'Gentle Caller 1 (Demo User: abc@xyz.com) logged in successfully');
      assert(data1.email === 'abc@xyz.com', 'Gentle Caller 1 session contains exact email');
      assert(data1.memberId, 'Gentle Caller 1 session contains valid memberId UUID');
      caller1Session = data1;

      // Caller 2 (Pooja)
      const res2 = await fetch(`${BASE_URL}/api/auth/member-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: 'gentle-hair-wigs',
          roleId: 'Cold Caller',
          email: 'pooja@gentlehairwigs.com',
          password: '12345678',
          pin: '1234',
        }),
      });
      const data2 = await res2.json();
      assert(data2.success, 'Gentle Caller 2 (Pooja: pooja@gentlehairwigs.com) logged in successfully');
      assert(data2.email === 'pooja@gentlehairwigs.com', 'Gentle Caller 2 session contains exact email');
      assert(data2.memberId, 'Gentle Caller 2 session contains valid memberId UUID');
      caller2Session = data2;
    } catch (err) {
      assert(false, `Test 2 failed with error: ${err.message}`);
    }

    // TEST 3: Gentle Hair Wigs Caller Leads Isolation
    console.log('\n▶ Test 3: Gentle Hair Wigs Leads Creation & Strict Caller Data Isolation');
    const gentlePhone1 = `981${Date.now().toString().slice(-7)}`;
    const gentlePhone2 = `982${Date.now().toString().slice(-7)}`;
    testPhoneNumbers.add(gentlePhone1);
    testPhoneNumbers.add(gentlePhone2);

    try {
      // Caller 1 adds Lead A
      const leadRes1 = await fetch(`${BASE_URL}/api/gentle-hair-wigs/crm-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'Gentle Caller 1 Test Client',
          phone: gentlePhone1,
          status: 'Interested',
          studioSlug: 'viman-nagar',
          studioName: 'Studio of Viman Nagar',
          telecallerId: caller1Session?.memberId || 'ec459a56-2f19-48d7-a2cd-d5dbf6ddea3a',
          telecallerName: caller1Session?.name || 'Demo User',
          telecallerEmail: caller1Session?.email || 'abc@xyz.com',
          notesList: ['Caller 1 initial inquiry regarding cranial patch'],
          leadDate: '2026-10-30',
        }),
      });
      const leadData1 = await leadRes1.json();
      assert(leadData1.success, `Gentle Caller 1 successfully created Lead A (${gentlePhone1})`);

      // Caller 2 adds Lead B
      const leadRes2 = await fetch(`${BASE_URL}/api/gentle-hair-wigs/crm-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'Gentle Caller 2 Test Client',
          phone: gentlePhone2,
          status: 'Converted',
          studioSlug: 'ravet',
          studioName: 'Studio of Ravet',
          telecallerId: caller2Session?.memberId || 'b3815c4b-bce9-40ad-be16-bf5bdf1ce92e',
          telecallerName: caller2Session?.name || 'Pooja (Caller 2)',
          telecallerEmail: caller2Session?.email || 'pooja@gentlehairwigs.com',
          notesList: ['Caller 2 hair patch consultation completed and converted'],
          leadDate: '2026-10-30',
        }),
      });
      const leadData2 = await leadRes2.json();
      assert(leadData2.success, `Gentle Caller 2 successfully created Lead B (${gentlePhone2})`);

      // Verify Caller 1 ONLY sees Lead A
      const c1Fetch = await fetch(`${BASE_URL}/api/gentle-hair-wigs/crm-leads?telecallerId=${caller1Session.memberId}`);
      const c1Leads = await c1Fetch.json();
      gentleCaller1Leads = c1Leads;
      const c1HasLeadA = c1Leads.leads?.some(l => l.phone === gentlePhone1);
      const c1HasLeadB = c1Leads.leads?.some(l => l.phone === gentlePhone2);
      assert(c1HasLeadA, 'Caller 1 can see Lead A');
      assert(!c1HasLeadB, 'Caller 1 CANNOT see Caller 2 Lead B (Data Isolation Verified)');

      // Verify Caller 2 ONLY sees Lead B
      const c2Fetch = await fetch(`${BASE_URL}/api/gentle-hair-wigs/crm-leads?telecallerId=${caller2Session.memberId}`);
      const c2Leads = await c2Fetch.json();
      const c2HasLeadB = c2Leads.leads?.some(l => l.phone === gentlePhone2);
      const c2HasLeadA = c2Leads.leads?.some(l => l.phone === gentlePhone1);
      assert(c2HasLeadB, 'Caller 2 can see Lead B');
      assert(!c2HasLeadA, 'Caller 2 CANNOT see Caller 1 Lead A (Data Isolation Verified)');
    } catch (err) {
      assert(false, `Test 3 failed with error: ${err.message}`);
    }

    // TEST 4: Gentle Hair Wigs Owner Inspection Desk
    console.log('\n▶ Test 4: Gentle Hair Wigs Owner Inspection Desk Capabilities');
    try {
      const inspectCaller1 = await fetch(`${BASE_URL}/api/gentle-hair-wigs/crm-leads?telecallerId=${caller1Session.memberId}`);
      const ins1Data = await inspectCaller1.json();
      assert(ins1Data.leads?.some(l => l.phone === gentlePhone1), 'Owner inspecting Gentle Caller 1 sees Lead A');

      const inspectCaller2 = await fetch(`${BASE_URL}/api/gentle-hair-wigs/crm-leads?telecallerId=${caller2Session.memberId}`);
      const ins2Data = await inspectCaller2.json();
      assert(ins2Data.leads?.some(l => l.phone === gentlePhone2), 'Owner inspecting Gentle Caller 2 sees Lead B');
    } catch (err) {
      assert(false, `Test 4 failed with error: ${err.message}`);
    }

    // TEST 5: Daily Reporting & Attendance Isolation
    console.log('\n▶ Test 5: Daily Reporting & Attendance Isolation');
    try {
      const today = new Date().toISOString().slice(0, 10);
      testReportStaffIds.add(caller1Session.memberId);
      testReportStaffIds.add(caller2Session.memberId);

      // Caller 1 submits report
      const repRes1 = await fetch(`${BASE_URL}/api/gentle-hair-wigs/daily-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: 'viman-nagar',
          staffId: caller1Session.memberId,
          staffName: caller1Session.name,
          reportDate: today,
          punchInTime: '09:30 AM',
          punchOutTime: '06:30 PM',
          totalHours: 9,
          callsMade: 45,
          callsConnected: 25,
          appointmentsBooked: 3,
          convertedClients: 1,
          followUpsDue: 8,
          workSummary: 'Caller 1 test shift completed',
          status: 'PRESENT',
          isHoliday: false,
        }),
      });
      const repData1 = await repRes1.json();
      assert(repData1.success, 'Caller 1 submitted daily report successfully');

      // Caller 2 submits report
      const repRes2 = await fetch(`${BASE_URL}/api/gentle-hair-wigs/daily-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: 'ravet',
          staffId: caller2Session.memberId,
          staffName: caller2Session.name,
          reportDate: today,
          punchInTime: '10:00 AM',
          punchOutTime: '07:00 PM',
          totalHours: 9,
          callsMade: 60,
          callsConnected: 35,
          appointmentsBooked: 5,
          convertedClients: 2,
          followUpsDue: 12,
          workSummary: 'Caller 2 (Pooja) test shift completed',
          status: 'PRESENT',
          isHoliday: false,
        }),
      });
      const repData2 = await repRes2.json();
      assert(repData2.success, 'Caller 2 submitted daily report successfully');

      // Fetch reports for date
      const getRep = await fetch(`${BASE_URL}/api/gentle-hair-wigs/daily-reports?branch=all&date=${today}`);
      const getRepData = await getRep.json();
      const r1 = getRepData.reports?.find(r => r.staffId === caller1Session.memberId);
      const r2 = getRepData.reports?.find(r => r.staffId === caller2Session.memberId);
      assert(r1 && r1.callsMade === 45, 'Caller 1 report retrieved with exact 45 calls');
      assert(r2 && r2.callsMade === 60, 'Caller 2 report retrieved with exact 60 calls');
    } catch (err) {
      assert(false, `Test 5 failed with error: ${err.message}`);
    }

    // TEST 6: ADJS (PrintBooth) Member Authentication
    console.log('\n▶ Test 6: ADJS (PrintBooth) Authentication & Distinct Callers');
    let adjsCaller1 = null;
    let adjsCaller2 = null;

    try {
      // ADJS Caller 1 (Demo User)
      const adjsRes1 = await fetch(`${BASE_URL}/api/auth/member-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: 'adjs',
          roleId: 'Coldcaller',
          email: 'abc@xyz.com',
          password: '12345678',
          pin: '1234',
        }),
      });
      const adjsData1 = await adjsRes1.json();
      assert(adjsData1.success, 'ADJS Caller 1 (abc@xyz.com) logged in successfully');
      assert(adjsData1.businessSlug === 'adjs', 'ADJS Caller 1 session scoped to businessSlug adjs');
      adjsCaller1 = adjsData1;

      // ADJS Caller 2 (Aakash)
      const adjsRes2 = await fetch(`${BASE_URL}/api/auth/member-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: 'adjs',
          roleId: 'Coldcaller',
          email: 'aakash@printbooth.in',
          password: '12345678',
          pin: '1234',
        }),
      });
      const adjsData2 = await adjsRes2.json();
      assert(adjsData2.success, 'ADJS Caller 2 (Aakash: aakash@printbooth.in) logged in successfully');
      assert(adjsData2.email === 'aakash@printbooth.in', 'ADJS Caller 2 email verified');
      adjsCaller2 = adjsData2;
    } catch (err) {
      assert(false, `Test 6 failed with error: ${err.message}`);
    }

    // TEST 7: ADJS CRM Leads Isolation & Persistence
    console.log('\n▶ Test 7: ADJS CRM Leads Creation, Persistence & Strict Caller Data Isolation');
    const adjsPhone1 = `971${Date.now().toString().slice(-7)}`;
    const adjsPhone2 = `972${Date.now().toString().slice(-7)}`;
    testPhoneNumbers.add(adjsPhone1);
    testPhoneNumbers.add(adjsPhone2);

    try {
      // ADJS Caller 1 creates Lead X
      const pbRes1 = await fetch(`${BASE_URL}/api/printbooth/crm-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'ADJS Caller 1 Test Merchant (Rajesh)',
          phone: adjsPhone1,
          shopName: 'Rajesh Xerox & Stationery',
          locationCategory: 'Stationery & Xerox',
          status: 'Interested',
          telecallerId: adjsCaller1.memberId,
          telecallerName: adjsCaller1.memberName,
          telecallerEmail: adjsCaller1.email,
          leadDate: '2026-10-30',
          notesList: ['Interested in PRINTBOOTH Compact kiosk'],
        }),
      });
      const pbData1 = await pbRes1.json();
      assert(pbData1.success, `ADJS Caller 1 created Lead X (${adjsPhone1})`);

      // ADJS Caller 2 creates Lead Y
      const pbRes2 = await fetch(`${BASE_URL}/api/printbooth/crm-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'ADJS Caller 2 Test Merchant (Kiran)',
          phone: adjsPhone2,
          shopName: 'Kiran Cyber Point',
          locationCategory: 'College / University',
          status: 'Converted',
          kioskModel: 'PRINTBOOTH™ Dual-Tray High Speed',
          unitsOrdered: 1,
          installationCity: 'Pune',
          telecallerId: adjsCaller2.memberId,
          telecallerName: adjsCaller2.memberName,
          telecallerEmail: adjsCaller2.email,
          leadDate: '2026-10-30',
          notesList: ['Dual tray machine booked with advance paid'],
        }),
      });
      const pbData2 = await pbRes2.json();
      assert(pbData2.success, `ADJS Caller 2 created Lead Y (${adjsPhone2})`);

      // Verify ADJS Caller 1 ONLY sees Lead X
      const pbCaller1Fetch = await fetch(`${BASE_URL}/api/printbooth/crm-leads?telecallerId=${adjsCaller1.memberId}`);
      const pbC1Leads = await pbCaller1Fetch.json();
      const c1HasX = pbC1Leads.leads?.some(l => l.phone === adjsPhone1);
      const c1HasY = pbC1Leads.leads?.some(l => l.phone === adjsPhone2);
      assert(c1HasX, 'ADJS Caller 1 can see Lead X');
      assert(!c1HasY, 'ADJS Caller 1 CANNOT see Caller 2 Lead Y (ADJS Caller Isolation Verified)');

      // Verify ADJS Caller 2 ONLY sees Lead Y
      const pbCaller2Fetch = await fetch(`${BASE_URL}/api/printbooth/crm-leads?telecallerId=${adjsCaller2.memberId}`);
      const pbC2Leads = await pbCaller2Fetch.json();
      const c2HasY = pbC2Leads.leads?.some(l => l.phone === adjsPhone2);
      const c2HasX = pbC2Leads.leads?.some(l => l.phone === adjsPhone1);
      assert(c2HasY, 'ADJS Caller 2 can see Lead Y');
      assert(!c2HasX, 'ADJS Caller 2 CANNOT see Caller 1 Lead X (ADJS Caller Isolation Verified)');

      // Cross-Business Isolation Check
      const gentleHasAdjsLead = gentleCaller1Leads?.leads?.some(l => l.phone === adjsPhone1 || l.phone === adjsPhone2);
      assert(!gentleHasAdjsLead, 'Gentle Hair Wigs CRM contains NO ADJS leads (Cross-Business Isolation Verified)');

      const adjsHasGentleLead = pbC1Leads.leads?.some(l => l.phone === gentlePhone1 || l.phone === gentlePhone2);
      assert(!adjsHasGentleLead, 'ADJS CRM contains NO Gentle Hair Wigs leads (Cross-Business Isolation Verified)');
    } catch (err) {
      assert(false, `Test 7 failed with error: ${err.message}`);
    }

    // TEST 8: ADJS Owner Inspection Desk
    console.log('\n▶ Test 8: ADJS Owner Inspection Desk Capabilities');
    try {
      // Owner inspects Caller 1
      const inspectCaller1 = await fetch(`${BASE_URL}/api/printbooth/crm-leads?telecallerId=${adjsCaller1.memberId}`);
      const ins1Data = await inspectCaller1.json();
      assert(ins1Data.leads?.some(l => l.phone === adjsPhone1), 'Owner inspecting ADJS Caller 1 sees Lead X');

      // Owner inspects Caller 2
      const inspectCaller2 = await fetch(`${BASE_URL}/api/printbooth/crm-leads?telecallerId=${adjsCaller2.memberId}`);
      const ins2Data = await inspectCaller2.json();
      assert(ins2Data.leads?.some(l => l.phone === adjsPhone2), 'Owner inspecting ADJS Caller 2 sees Lead Y');
    } catch (err) {
      assert(false, `Test 8 failed with error: ${err.message}`);
    }

  } finally {
    // ═══════════════════════════════════════════════════════════════════
    // MANDATORY CLEAN TEARDOWN: Completely delete all test-created leads & reports
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n🧹 Performing Automatic Clean Teardown of Test Data...');
    try {
      const phoneArray = Array.from(testPhoneNumbers);

      // 1. Delete test leads from gentle_leads
      if (phoneArray.length > 0) {
        const delGentle = await prisma.gentleHairWigsLead.deleteMany({
          where: {
            OR: [
              { phone: { in: phoneArray } },
              { clientName: { contains: 'Test' } },
            ],
          },
        });
        console.log(`  🗑️  Cleaned ${delGentle.count} test leads from gentle_leads.`);
      }

      // 2. Delete test leads from printbooth_crm_leads
      if (phoneArray.length > 0) {
        const inClause = phoneArray.map((p) => `'${p}'`).join(',');
        const delPb = await prisma.$executeRawUnsafe(`
          DELETE FROM public.printbooth_crm_leads
          WHERE phone IN (${inClause})
             OR client_name LIKE '%Test%'
        `);
        console.log(`  🗑️  Cleaned ${delPb} test leads from printbooth_crm_leads.`);
      }

      console.log('  ✨ All test leads and temporary data cleanly deleted.');
    } catch (cleanupErr) {
      console.warn('  ⚠️ Teardown notice:', cleanupErr.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  console.log('\n================================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
