import { strict as assert } from 'assert';
import { prisma, resolveBusinessId } from '../packages/db/dist/index.js';

console.log('\n======================================================');
console.log('🧪 CRM DATABASE STORAGE & PERSISTENCE VERIFICATION SUITE');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function report(name, passed, detail = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
    throw new Error(`Test failed: ${name}`);
  }
}

async function run() {
  const timestamp = Date.now();
  const testPhoneGentle = `998877${timestamp.toString().slice(-4)}`;
  const testPhonePB = `991122${timestamp.toString().slice(-4)}`;

  try {
    // ──────────────────────────────────────────────────────────
    // 1. Connection & Business Resolution
    // ──────────────────────────────────────────────────────────
    console.log('--- 1. Testing Database Connection & Business Canonical IDs ---');
    await prisma.$connect();
    report('Database Connection to PostgreSQL successful', true);

    const gentleBizId = await resolveBusinessId('gentle-hair-wigs');
    const adjsBizId = await resolveBusinessId('adjs');
    report('Gentle Hair Wigs business ID resolved', gentleBizId === 'b1000000-0000-0000-0000-000000000003' || gentleBizId === '3', gentleBizId);
    report('ADJS Printbooth business ID resolved', adjsBizId === 'b1000000-0000-0000-0000-000000000007' || adjsBizId === '7', adjsBizId);

    // ──────────────────────────────────────────────────────────
    // 2. Gentle Hair Wigs CRM CRUD Verification
    // ──────────────────────────────────────────────────────────
    console.log('\n--- 2. Gentle Hair Wigs CRM Storage & Retrieval ---');

    // 2.1 CREATE
    const gentleLead = await prisma.gentleHairWigsLead.create({
      data: {
        businessId: gentleBizId,
        clientName: 'Kunal Sharma (Test)',
        phone: testPhoneGentle,
        studioSlug: 'viman-nagar',
        studioName: 'Studio of Viman Nagar',
        status: 'Interested',
        stage: 'NEW_LEAD',
        source: 'Instagram Ad',
        hairLossConcern: 'Crown Thinning',
        interestCategory: 'Custom French Lace Hair Patch',
        notes: 'Requested consultation for Saturday evening at Viman Nagar lounge.',
        telecallerName: 'Pooja',
      },
    });
    report('Gentle Hair Wigs Lead stored in PostgreSQL', !!gentleLead.id, `ID: ${gentleLead.id}`);

    // 2.2 READ & VERIFY PERSISTENCE
    const retrievedGentle = await prisma.gentleHairWigsLead.findUnique({
      where: { id: gentleLead.id },
    });
    report('Gentle Lead fetched accurately by Primary Key', retrievedGentle?.clientName === 'Kunal Sharma (Test)');
    report('Gentle Lead studio branch persisted properly', retrievedGentle?.studioSlug === 'viman-nagar');
    report('Gentle Lead requirement persisted properly', retrievedGentle?.interestCategory === 'Custom French Lace Hair Patch');

    // 2.3 QUERY BY TARGETED PHONE INDEX (Anti-OOM pattern)
    const phoneQueryResult = await prisma.gentleHairWigsLead.findMany({
      where: {
        businessId: { in: [gentleBizId, '3', 'gentle-hair-wigs'] },
        phone: { endsWith: testPhoneGentle.slice(-8) },
      },
    });
    report('Gentle Lead found via indexed phone suffix search', phoneQueryResult.length >= 1);

    // 2.4 UPDATE
    const updatedGentle = await prisma.gentleHairWigsLead.update({
      where: { id: gentleLead.id },
      data: {
        stage: 'CONSULTATION_SCHEDULED',
        status: 'Confirmed',
        notes: 'Consultation confirmed for Saturday 4 PM with Master Stylist.',
      },
    });
    report('Gentle Lead status updated to Confirmed', updatedGentle.status === 'Confirmed');

    // 2.5 CLEANUP TEARDOWN
    await prisma.gentleHairWigsLead.delete({ where: { id: gentleLead.id } });
    const verifyGentleDeleted = await prisma.gentleHairWigsLead.findUnique({ where: { id: gentleLead.id } });
    report('Gentle Lead cleanly deleted after verification', verifyGentleDeleted === null);

    // ──────────────────────────────────────────────────────────
    // 3. Printbooth CRM CRUD Verification
    // ──────────────────────────────────────────────────────────
    console.log('\n--- 3. Printbooth CRM Storage & Retrieval ---');

    // 3.1 CREATE LEAD
    const pbLead = await prisma.printboothLead.create({
      data: {
        businessId: adjsBizId,
        clientName: 'Rajesh Patil (Test)',
        phone: testPhonePB,
        shopName: 'Patil Photo Studio & Xerox',
        city: 'Pune',
        kioskModel: 'PRINTBOOTH-MINI-X2',
        status: 'Interested',
        unitsOrdered: 2,
        notes: 'Wants live demo at Deccan Gymkhana mall kiosk.',
      },
    });
    report('Printbooth CRM Lead stored in PostgreSQL', !!pbLead.id, `ID: ${pbLead.id}`);

    // 3.2 READ LEAD
    const retrievedPbLead = await prisma.printboothLead.findUnique({
      where: { id: pbLead.id },
    });
    report('Printbooth Lead fetched accurately by Primary Key', retrievedPbLead?.clientName === 'Rajesh Patil (Test)');
    report('Printbooth Lead kiosk model persisted properly', retrievedPbLead?.kioskModel === 'PRINTBOOTH-MINI-X2');

    // 3.3 UPDATE LEAD
    const updatedPbLead = await prisma.printboothLead.update({
      where: { id: pbLead.id },
      data: {
        status: 'Proposal Sent',
        notes: 'Commercial quotation sent for 2 units.',
      },
    });
    report('Printbooth Lead updated to Proposal Sent', updatedPbLead.status === 'Proposal Sent');

    // 3.4 CLEANUP LEAD
    await prisma.printboothLead.delete({ where: { id: pbLead.id } });
    const verifyPbLeadDeleted = await prisma.printboothLead.findUnique({ where: { id: pbLead.id } });
    report('Printbooth Lead cleanly deleted after verification', verifyPbLeadDeleted === null);

    // ──────────────────────────────────────────────────────────
    // 4. Printbooth Machine Orders & Support Tickets
    // ──────────────────────────────────────────────────────────
    console.log('\n--- 4. Printbooth Orders & Tickets Storage ---');

    // 4.1 MACHINE ORDER
    const orderNum = `PB-TEST-${timestamp.toString().slice(-5)}`;
    const pbOrder = await prisma.printboothMachineOrder.create({
      data: {
        businessId: adjsBizId,
        orderNumber: orderNum,
        merchantName: 'Sunil Xerox Hub',
        phone: testPhonePB,
        shopName: 'Sunil Cyber Point',
        city: 'Pune',
        kioskModel: 'PRINTBOOTH-PRO-KIOSK',
        units: 2,
        unitPrice: 125000,
        totalAmount: 250000,
        stage: 'PRODUCTION_QUEUED',
        orderDate: new Date().toISOString().split('T')[0],
      },
    });
    report('Printbooth Machine Order stored in PostgreSQL', !!pbOrder.id, `Order: ${pbOrder.orderNumber}`);

    const retrievedOrder = await prisma.printboothMachineOrder.findUnique({ where: { id: pbOrder.id } });
    report('Printbooth Order retrieved with totalAmount 250000', Number(retrievedOrder?.totalAmount) === 250000);

    await prisma.printboothMachineOrder.delete({ where: { id: pbOrder.id } });
    const verifyOrderDeleted = await prisma.printboothMachineOrder.findUnique({ where: { id: pbOrder.id } });
    report('Printbooth Order cleanly deleted after verification', verifyOrderDeleted === null);

    // 4.2 SUPPORT TICKET
    const ticketNum = `TCK-TEST-${timestamp.toString().slice(-4)}`;
    const pbTicket = await prisma.printboothSupportTicket.create({
      data: {
        businessId: adjsBizId,
        ticketNumber: ticketNum,
        merchantName: 'Sunil Xerox Hub',
        phone: testPhonePB,
        issueType: 'Hardware / Printer Jam',
        status: 'Open',
      },
    });
    report('Printbooth Support Ticket stored in PostgreSQL', !!pbTicket.id, `Ticket: ${pbTicket.ticketNumber}`);

    const updatedTicket = await prisma.printboothSupportTicket.update({
      where: { id: pbTicket.id },
      data: { status: 'Resolved', resolutionNotes: 'Sensors recalibrated and roll reloaded.' },
    });
    report('Printbooth Support Ticket updated to Resolved', updatedTicket.status === 'Resolved');

    await prisma.printboothSupportTicket.delete({ where: { id: pbTicket.id } });
    const verifyTicketDeleted = await prisma.printboothSupportTicket.findUnique({ where: { id: pbTicket.id } });
    report('Printbooth Support Ticket cleanly deleted after verification', verifyTicketDeleted === null);

    // ──────────────────────────────────────────────────────────
    // 5. Daily Reports Persistence (Gentle & Printbooth)
    // ──────────────────────────────────────────────────────────
    console.log('\n--- 5. Daily Reporting Storage & Date Normalization ---');

    // 5.1 GENTLE TELECALLER DAILY REPORT
    const testDate = new Date();
    testDate.setUTCHours(0, 0, 0, 0);

    const gentleReport = await prisma.telecallerDailyReport.upsert({
      where: {
        businessId_telecallerId_reportDate: {
          businessId: gentleBizId,
          telecallerId: `test-caller-${timestamp}`,
          reportDate: testDate,
        },
      },
      update: {
        callsMade: 45,
        callsConnected: 32,
        interestedCount: 8,
        closedCount: 2,
      },
      create: {
        businessId: gentleBizId,
        telecallerId: `test-caller-${timestamp}`,
        telecallerName: 'Pooja (Test)',
        branch: 'viman-nagar',
        reportDate: testDate,
        callsMade: 45,
        callsConnected: 32,
        interestedCount: 8,
        closedCount: 2,
        notes: 'Good response on French lace hair patch inquiries today.',
      },
    });
    report('Gentle Telecaller Daily Report stored with UTC date', gentleReport.callsMade === 45);

    await prisma.telecallerDailyReport.delete({ where: { id: gentleReport.id } });
    const verifyReportDeleted = await prisma.telecallerDailyReport.findUnique({ where: { id: gentleReport.id } });
    report('Gentle Daily Report cleanly deleted after verification', verifyReportDeleted === null);

    // 5.2 PRINTBOOTH DAILY OPS REPORT
    const pbReport = await prisma.printboothDailyReport.upsert({
      where: {
        memberId_reportDate: {
          memberId: `test-staff-${timestamp}`,
          reportDate: testDate,
        },
      },
      update: {
        callsMade: 18,
        machinesSold: 2,
      },
      create: {
        memberId: `test-staff-${timestamp}`,
        memberName: 'Aakash (Test)',
        reportDate: testDate,
        callsMade: 18,
        machinesSold: 2,
        notes: '2 kiosks finalized in Pune East.',
      },
    });
    report('Printbooth Daily Report stored with machinesSold = 2', pbReport.machinesSold === 2);

    await prisma.printboothDailyReport.delete({ where: { id: pbReport.id } });
    const verifyPbReportDeleted = await prisma.printboothDailyReport.findUnique({ where: { id: pbReport.id } });
    report('Printbooth Daily Report cleanly deleted after verification', verifyPbReportDeleted === null);

    // ──────────────────────────────────────────────────────────
    // 6. Tenant Isolation Guarantee
    // ──────────────────────────────────────────────────────────
    console.log('\n--- 6. Cross-Tenant Isolation Verification ---');
    const gentleLeadsUnderADJS = await prisma.gentleHairWigsLead.findMany({
      where: { businessId: adjsBizId },
    });
    report('Gentle Hair Wigs data is 0% visible or mixed under ADJS businessId', gentleLeadsUnderADJS.length === 0);

    const pbLeadsUnderGentle = await prisma.printboothLead.findMany({
      where: { businessId: gentleBizId },
    });
    report('Printbooth data is 0% visible or mixed under Gentle Hair Wigs businessId', pbLeadsUnderGentle.length === 0);

    console.log('\n======================================================');
    console.log(`📊 CRM STORAGE TEST RESULTS: ${passedTests}/${totalTests} PASSED, 0 FAILED`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ CRM Storage Verification Exception:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
