import crypto from 'crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function run() {
  console.log('================================================================');
  console.log('🧪 RUNNING FULL SYSTEM VPS DEPLOYMENT READINESS VERIFICATION');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. PWA & Web Manifest
  await test('PWA Web Manifest & Metadata Route', async () => {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.name || !data.name.includes('HomeSeva')) {
      throw new Error(`Unexpected name: ${data.name}`);
    }
    if (!Array.isArray(data.icons) || data.icons.length < 2) {
      throw new Error('Missing PWA icons in manifest');
    }
  });

  // 2. Service Worker File
  await test('PWA Service Worker Presence & Fetch Handler', async () => {
    const res = await fetch(`${BASE_URL}/sw.js`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('fetch') || !text.includes('install')) {
      throw new Error('sw.js missing required fetch/install lifecycle events');
    }
  });

  // 3. Super Admin Credential Verification
  await test('Super Admin Step-1 Field Verification', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/super-admin/verify-field`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'username', value: 'madyydam' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success || (!data.matched && !data.valid)) {
      throw new Error(`Super admin username rejected: ${JSON.stringify(data)}`);
    }
  });

  // 4. Businesses List
  await test('Businesses API returns all 10 Workspaces', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/businesses`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.businesses)) {
      throw new Error('Failed to retrieve businesses list');
    }
    if (data.businesses.length < 10) {
      throw new Error(`Expected at least 10 businesses, got ${data.businesses.length}`);
    }
  });

  // 5. Backup API Statistics
  await test('Backup API GET returns Live Business Table Stats', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/backup`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.stats)) {
      throw new Error('Failed to fetch backup stats');
    }
    const hasKiosks = data.stats.find((s) => s.slug === 'adjs' || s.slug === 'printbooth');
    if (!hasKiosks) throw new Error('ADJS/Printbooth business missing in backup stats');
  });

  // 6. Backup API Generation & Snapshot Download
  await test('Backup API POST triggers live snapshot package', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessIds: [] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.packages)) {
      throw new Error('Failed to create backup snapshot package');
    }
  });

  // 7. Backup Download Route
  await test('Backup API GET with ?download=gentle-hair-wigs streams valid JSON dump', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/backup?download=gentle-hair-wigs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.metadata || data.metadata.businessSlug !== 'gentle-hair-wigs') {
      throw new Error('Dump missing valid metadata headers');
    }
    if (!data.data) throw new Error('Dump missing data section');
  });

  // 8. Printbooth CRM Leads CRUD
  let testLeadId = null;
  const testPhone = `9822${Math.floor(100000 + Math.random() * 900000)}`;

  await test('Printbooth CRM Leads - Add Lead', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/crm-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'VPS Test Merchant',
        phone: testPhone,
        shopName: 'VPS Automation Corner',
        status: 'Interested',
        kioskModel: 'PRINTBOOTH™ Compact (Standard)',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.lead?.id) {
      throw new Error(`Failed to add lead: ${JSON.stringify(data)}`);
    }
    testLeadId = data.lead.id;
  });

  await test('Printbooth CRM Leads - Duplicate Phone Prevention', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/crm-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Duplicate Attempt',
        phone: testPhone,
      }),
    });
    const data = await res.json();
    if (res.status !== 409 || data.success) {
      throw new Error(`Expected 409 duplicate rejection, got: ${res.status}`);
    }
  });

  await test('Printbooth CRM Leads - Update Lead Status', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/crm-leads`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testLeadId,
        status: 'Converted',
        kioskModel: 'PRINTBOOTH™ Dual-Tray High Speed',
        unitsOrdered: 2,
        installationCity: 'Pune Central',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Failed to update lead: ${JSON.stringify(data)}`);
    }
  });

  await test('Printbooth CRM Leads - Clean Up Test Lead', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/crm-leads?id=${encodeURIComponent(testLeadId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Failed to delete lead: ${JSON.stringify(data)}`);
    }
  });

  // 9. Printbooth Machine Orders CRUD
  let testOrderId = null;
  await test('Printbooth Machine Orders - Create Order', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantName: 'DevOps Print Services',
        phone: '9988776655',
        shopName: 'DevOps Hub',
        kioskModel: 'PRINTBOOTH™ Compact (Standard)',
        units: 1,
        unitPrice: 285000,
        totalAmount: 285000,
        stage: 'Order Booked',
        city: 'Mumbai',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.order?.id) {
      throw new Error(`Failed to create machine order: ${JSON.stringify(data)}`);
    }
    testOrderId = data.order.id;
  });

  await test('Printbooth Machine Orders - Advance Stage', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testOrderId,
        stage: 'Assembled & Tested',
        trackingNumber: 'TRK-VPS-9988',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Failed to advance order stage: ${JSON.stringify(data)}`);
    }
  });

  // 10. Printbooth Support Tickets CRUD
  let testTicketId = null;
  await test('Printbooth Support Tickets - Create Ticket', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantName: 'Kiosk Support Test',
        phone: '9988776644',
        issueType: 'Setup & Wi-Fi',
        status: 'Open',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.ticket?.id) {
      throw new Error(`Failed to create ticket: ${JSON.stringify(data)}`);
    }
    testTicketId = data.ticket.id;
  });

  await test('Printbooth Support Tickets - Resolve Ticket', async () => {
    const res = await fetch(`${BASE_URL}/api/printbooth/tickets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testTicketId,
        status: 'Resolved',
        resolutionNotes: 'Wi-Fi AP verified and connection stabilized',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Failed to resolve ticket: ${JSON.stringify(data)}`);
    }
  });

  // Cleanup Test Order & Test Ticket
  await test('Clean Up Test Machine Order & Support Ticket', async () => {
    if (testOrderId) {
      await fetch(`${BASE_URL}/api/printbooth/orders?id=${encodeURIComponent(testOrderId)}`, { method: 'DELETE' });
    }
    if (testTicketId) {
      await fetch(`${BASE_URL}/api/printbooth/tickets?id=${encodeURIComponent(testTicketId)}`, { method: 'DELETE' });
    }
  });

  // 11. Gentle Hair Wigs Studios & Leads API
  await test('Gentle Hair Wigs Studios List', async () => {
    const res = await fetch(`${BASE_URL}/api/gentle-hair-wigs/studios`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.studios)) {
      throw new Error('Failed to retrieve studios');
    }
    if (data.studios.length === 0) {
      throw new Error('Expected default studios in database');
    }
  });

  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
