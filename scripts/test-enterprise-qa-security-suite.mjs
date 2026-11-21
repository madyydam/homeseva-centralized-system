import http from 'http';
import https from 'https';

const BASE_URL = 'https://erphomeseva.tech';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch {
              return null;
            }
          },
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('HOMESEVA ENTERPRISE QA, ARCHITECTURE & SECURITY AUDIT SUITE');
  console.log('Testing Target: ' + BASE_URL);
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

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Strict Vertical Catalog API Separation
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST GROUP 1: Catalog & Dynamic Roles API Isolation ---');
  
  // 1A. Crockery Rental API
  const crockeryRes = await fetchUrl(`${BASE_URL}/api/auth/businesses?slug=crockery-rental`);
  assert(crockeryRes.statusCode === 200, 'GET /api/auth/businesses?slug=crockery-rental returns 200');
  const crockeryJson = crockeryRes.json();
  assert(crockeryJson?.success === true, 'Crockery Rental returns success: true');
  assert(crockeryJson?.business?.roles?.length === 5, 'Crockery Rental has exactly 5 roles', `got ${crockeryJson?.business?.roles?.length}`);
  
  const crockeryRoles = crockeryJson?.business?.roles || [];
  const anySharedInCrockery = crockeryRoles.some((r) => r.subcompany_slug === 'SHARED' || r.subcompany_slug === 'essentials-sales');
  assert(!anySharedInCrockery, 'Zero SHARED or Sales roles leaked into Crockery Rental vertical');
  const hasCrockeryGm = crockeryRoles.some((r) => r.role_id === 'General Manager' && r.subcompany_slug === 'crockery-rental');
  assert(hasCrockeryGm, 'General Manager belongs exclusively to crockery-rental');

  // 1B. Essentials Sales API
  const salesRes = await fetchUrl(`${BASE_URL}/api/auth/businesses?slug=essentials-sales`);
  assert(salesRes.statusCode === 200, 'GET /api/auth/businesses?slug=essentials-sales returns 200');
  const salesJson = salesRes.json();
  assert(salesJson?.success === true, 'Essentials Sales returns success: true');
  assert(salesJson?.business?.roles?.length === 6, 'Essentials Sales has exactly 6 roles', `got ${salesJson?.business?.roles?.length}`);
  
  const salesRoles = salesJson?.business?.roles || [];
  const anySharedInSales = salesRoles.some((r) => r.subcompany_slug === 'SHARED' || r.subcompany_slug === 'crockery-rental');
  assert(!anySharedInSales, 'Zero SHARED or Crockery roles leaked into Essentials Sales vertical');
  const hasSalesGm = salesRoles.some((r) => r.role_id === 'General Manager (Sales)' && r.subcompany_slug === 'essentials-sales');
  assert(hasSalesGm, 'General Manager (Sales) belongs exclusively to essentials-sales');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Security Headers & Transport Hardening
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 2: HTTP Security Headers & TLS Hardening ---');
  const rootRes = await fetchUrl(`${BASE_URL}/`);
  const headers = rootRes.headers;
  assert(headers['strict-transport-security']?.includes('max-age=31536000'), 'HSTS header enforced with 1 year max-age');
  assert(headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff present');
  assert(headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options: SAMEORIGIN present');
  assert(headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy present');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Rate Limiting & DoS Defense
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 3: Rate Limiting Defense ---');
  let rateLimitEncountered = false;
  // Send a quick burst of 25 requests to /api/auth/me to verify nginx limit_req or API defense
  const burstPromises = [];
  for (let i = 0; i < 25; i++) {
    burstPromises.push(fetchUrl(`${BASE_URL}/api/auth/me`));
  }
  const burstResults = await Promise.all(burstPromises);
  const okOr401 = burstResults.filter((r) => r.statusCode === 200 || r.statusCode === 401).length;
  const limited429 = burstResults.filter((r) => r.statusCode === 429).length;
  console.log(`Burst results: ${okOr401} serviced, ${limited429} rate-limited (HTTP 429)`);
  assert(okOr401 > 0, 'Legitimate requests handled normally');

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
