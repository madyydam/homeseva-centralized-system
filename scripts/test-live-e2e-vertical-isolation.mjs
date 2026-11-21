import https from 'https';

const BASE_URL = 'https://erphomeseva.tech';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      if (!req.getHeader('Content-Type')) {
        req.setHeader('Content-Type', 'application/json');
      }
      req.write(payload);
    }

    req.end();
  });
}

function extractCookie(headers, cookieName) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  for (const c of setCookie) {
    if (c.startsWith(`${cookieName}=`)) {
      const parts = c.split(';')[0];
      return parts.substring(cookieName.length + 1);
    }
  }
  return null;
}

async function runTest() {
  console.log('================================================================');
  console.log('E2E STRICT VERTICAL ISOLATION & PENETRATION TEST');
  console.log('Target: ' + BASE_URL);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Super Admin Authentication
  console.log('1. Authenticating as Super Admin...');
  const saLogin = await request('/api/auth/super-admin/login', {
    method: 'POST',
    body: {
      username: 'madyydam',
      password: 'ChangeMe@123',
      pin4: '1234',
      pin8: '12345678',
    },
  });

  assert(saLogin.statusCode === 200, 'Super admin login returns 200');
  const saToken = extractCookie(saLogin.headers, 'homeseva_sa_token');
  assert(!!saToken, 'Received homeseva_sa_token cookie');

  // Fetch HoReCa business ID
  const credsRes = await request('/api/admin/credentials', {
    headers: { Cookie: `homeseva_sa_token=${saToken}` },
  });
  const horeca = credsRes.json?.companies?.find((c) => c.businessSlug === 'horeca-essentials');
  assert(!!horeca, 'HoReCa business found in admin companies catalog');
  const bizId = horeca.businessId;

  // 2. Create Crockery Rental Test Member
  const testCrockeryEmail = `qa.crockery.${Date.now()}@homeseva.test`;
  console.log(`\n2. Creating Crockery Rental test member: ${testCrockeryEmail}`);
  const addCrockery = await request('/api/members', {
    method: 'POST',
    headers: { Cookie: `homeseva_sa_token=${saToken}` },
    body: {
      business_id: bizId,
      role_id: 'General Manager',
      subcompany_slug: 'crockery-rental',
      name: 'QA Crockery GM',
      email: testCrockeryEmail,
      password: 'StrongPassword123!',
      pin: '5566',
    },
  });
  assert(addCrockery.json?.success === true, 'Crockery GM member created successfully');
  const crockeryMemberId = addCrockery.json?.member?.id;

  // 3. Create Essentials Sales Test Member
  const testSalesEmail = `qa.sales.${Date.now()}@homeseva.test`;
  console.log(`\n3. Creating Essentials Sales test member: ${testSalesEmail}`);
  const addSales = await request('/api/members', {
    method: 'POST',
    headers: { Cookie: `homeseva_sa_token=${saToken}` },
    body: {
      business_id: bizId,
      role_id: 'General Manager (Sales)',
      subcompany_slug: 'essentials-sales',
      name: 'QA Sales GM',
      email: testSalesEmail,
      password: 'StrongPassword123!',
      pin: '7788',
    },
  });
  assert(addSales.json?.success === true, 'Sales GM member created successfully');
  const salesMemberId = addSales.json?.member?.id;

  // 4. Test Crockery Member Login & Boundary Enforcement
  console.log('\n4. Testing Crockery Member Login & Boundaries...');
  const crockeryLogin = await request('/api/auth/member-login', {
    method: 'POST',
    body: {
      businessSlug: 'crockery-rental',
      roleId: 'General Manager',
      email: testCrockeryEmail,
      password: 'StrongPassword123!',
      pin: '5566',
    },
  });
  assert(crockeryLogin.json?.success === true, 'Crockery GM login succeeded');
  const crockeryUserToken = extractCookie(crockeryLogin.headers, 'homeseva_user_session');
  assert(!!crockeryUserToken, 'Crockery GM received homeseva_user_session cookie');

  // 4A. Crockery GM accesses /app/crockery-rental/dashboard -> Allowed (200)
  const crockeryDashboardRes = await request('/app/crockery-rental/dashboard', {
    headers: { Cookie: `homeseva_user_session=${crockeryUserToken}` },
  });
  assert(crockeryDashboardRes.statusCode === 200, 'Crockery GM authorized to access /app/crockery-rental/dashboard (HTTP 200)');

  // 4B. Crockery GM attempts to access /app/horeca-essentials/dashboard -> BLOCKED (307 redirect to /app/crockery-rental/dashboard)
  const crockeryTamperRes = await request('/app/horeca-essentials/dashboard', {
    headers: { Cookie: `homeseva_user_session=${crockeryUserToken}` },
  });
  const isRedirectedToCrockery = crockeryTamperRes.statusCode === 307 || crockeryTamperRes.statusCode === 302;
  const redirectTarget = crockeryTamperRes.headers.location || '';
  assert(isRedirectedToCrockery && redirectTarget.includes('/app/crockery-rental/dashboard'), 
    'Crockery GM BLOCKED from /app/horeca-essentials/dashboard and redirected to /app/crockery-rental/dashboard',
    `Status ${crockeryTamperRes.statusCode}, Location: ${redirectTarget}`
  );

  // 5. Test Essentials Sales Member Login & Boundary Enforcement
  console.log('\n5. Testing Essentials Sales Member Login & Boundaries...');
  const salesLogin = await request('/api/auth/member-login', {
    method: 'POST',
    body: {
      businessSlug: 'essentials-sales',
      roleId: 'General Manager (Sales)',
      email: testSalesEmail,
      password: 'StrongPassword123!',
      pin: '7788',
    },
  });
  assert(salesLogin.json?.success === true, 'Sales GM login succeeded');
  const salesUserToken = extractCookie(salesLogin.headers, 'homeseva_user_session');
  assert(!!salesUserToken, 'Sales GM received homeseva_user_session cookie');

  // 5A. Sales GM accesses /app/horeca-essentials/dashboard -> Allowed (200)
  const salesDashboardRes = await request('/app/horeca-essentials/dashboard', {
    headers: { Cookie: `homeseva_user_session=${salesUserToken}` },
  });
  assert(salesDashboardRes.statusCode === 200, 'Sales GM authorized to access /app/horeca-essentials/dashboard (HTTP 200)');

  // 5B. Sales GM attempts to access /app/crockery-rental/dashboard -> BLOCKED (307 redirect to /app/horeca-essentials/dashboard)
  const salesTamperRes = await request('/app/crockery-rental/dashboard', {
    headers: { Cookie: `homeseva_user_session=${salesUserToken}` },
  });
  const isRedirectedToSales = salesTamperRes.statusCode === 307 || salesTamperRes.statusCode === 302;
  const salesRedirectTarget = salesTamperRes.headers.location || '';
  assert(isRedirectedToSales && salesRedirectTarget.includes('/app/horeca-essentials/dashboard'),
    'Sales GM BLOCKED from /app/crockery-rental/dashboard and redirected to /app/horeca-essentials/dashboard',
    `Status ${salesTamperRes.statusCode}, Location: ${salesRedirectTarget}`
  );

  // 5C. Sales GM attempts to call /api/crockery-rental/sync -> BLOCKED (HTTP 403 Forbidden)
  const salesApiTamperRes = await request('/api/crockery-rental/sync', {
    method: 'POST',
    headers: { Cookie: `homeseva_user_session=${salesUserToken}` },
    body: { action: 'test_injection' },
  });
  assert(salesApiTamperRes.statusCode === 403, 
    'Sales GM BLOCKED with HTTP 403 from /api/crockery-rental/sync (Zero-Trust API Guard)',
    `got status ${salesApiTamperRes.statusCode}`
  );

  // 6. Cleanup Test Members from DB
  console.log('\n6. Cleaning up test accounts from database...');
  if (crockeryMemberId) {
    await request('/api/members', {
      method: 'DELETE',
      headers: { Cookie: `homeseva_sa_token=${saToken}` },
      body: { member_id: crockeryMemberId },
    });
  }
  if (salesMemberId) {
    await request('/api/members', {
      method: 'DELETE',
      headers: { Cookie: `homeseva_sa_token=${saToken}` },
      body: { member_id: salesMemberId },
    });
  }
  console.log('Cleanup completed cleanly.');

  // Final Results
  console.log('\n================================================================');
  console.log(`FINAL PEN-TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runTest().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
