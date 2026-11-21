import { strict as assert } from 'assert';

const BASE_URL = process.env.BASE_URL || 'https://erphomeseva.tech';
console.log(`\n======================================================`);
console.log(`  STRICT AUTHENTICATION & MULTI-TENANT TEST SUITE`);
console.log(`  Target: ${BASE_URL}`);
console.log(`======================================================\n`);

let passedTests = 0;
let totalTests = 0;

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

async function runTests() {
  const adminCreds = {
    username: 'madyydam',
    password: 'ChangeMe@123',
    pin4: '1234',
    pin8: '12345678',
  };

  // ──────────────────────────────────────────────────────────
  // TEST 1: Super Admin Authentication
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing Super Admin Authentication ---');

  // 1.1 Invalid credentials rejected
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/super-admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'madyydam',
      password: 'WrongPassword!',
      pin4: '1234',
      pin8: '12345678',
    }),
  });
  report('Super Admin rejects incorrect password', badLoginRes.status === 401);

  // 1.2 Valid Super Admin login
  const validAdminRes = await fetch(`${BASE_URL}/api/auth/super-admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCreds),
  });
  const validAdminData = await validAdminRes.json();
  const adminCookie = validAdminRes.headers.get('set-cookie');
  report('Super Admin logs in with valid 4-factor credentials', validAdminRes.status === 200 && validAdminData.success);

  // Extract session cookie for authorized super admin requests
  const adminCookieHeader = adminCookie ? adminCookie.split(';')[0] : '';
  const adminHeaders = {
    'Content-Type': 'application/json',
    Cookie: adminCookieHeader,
  };

  // ──────────────────────────────────────────────────────────
  // TEST 2: Super Admin Forgot / Reset Master Key Flow
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Super Admin Multi-Factor Reset Flow ---');

  // 2.1 Reset fails with wrong current password
  const resetWrongPass = await fetch(`${BASE_URL}/api/auth/super-admin/reset-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'madyydam',
      currentPassword: 'WrongPassword999',
      currentPin4: '1234',
      currentPin8: '12345678',
      newPassword: 'BrandNewPass@123',
      newPin4: '9999',
      newPin8: '88887777',
    }),
  });
  report('Reset rejected when current password is wrong', resetWrongPass.status === 401);

  // 2.2 Reset fails with wrong current 4-digit PIN
  const resetWrongPin4 = await fetch(`${BASE_URL}/api/auth/super-admin/reset-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'madyydam',
      currentPassword: 'ChangeMe@123',
      currentPin4: '0000',
      currentPin8: '12345678',
      newPassword: 'BrandNewPass@123',
      newPin4: '9999',
      newPin8: '88887777',
    }),
  });
  report('Reset rejected when current 4-digit PIN is wrong', resetWrongPin4.status === 401);

  // 2.3 Reset fails with wrong current 8-digit Key
  const resetWrongPin8 = await fetch(`${BASE_URL}/api/auth/super-admin/reset-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'madyydam',
      currentPassword: 'ChangeMe@123',
      currentPin4: '1234',
      currentPin8: '00000000',
      newPassword: 'BrandNewPass@123',
      newPin4: '9999',
      newPin8: '88887777',
    }),
  });
  report('Reset rejected when current 8-digit Key is wrong', resetWrongPin8.status === 401);

  // 2.4 Successful Reset: change to temporary credentials
  const tempCreds = {
    username: 'madyydam',
    currentPassword: 'ChangeMe@123',
    currentPin4: '1234',
    currentPin8: '12345678',
    newPassword: 'TempMasterPass@123',
    newPin4: '8822',
    newPin8: '99887766',
  };
  const resetSuccessRes = await fetch(`${BASE_URL}/api/auth/super-admin/reset-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tempCreds),
  });
  const resetSuccessData = await resetSuccessRes.json();
  report('Reset succeeds when all 3 current factors match', resetSuccessRes.status === 200 && resetSuccessData.success);

  // 2.5 Verify login with NEW credentials
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/super-admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'madyydam',
      password: tempCreds.newPassword,
      pin4: tempCreds.newPin4,
      pin8: tempCreds.newPin8,
    }),
  });
  report('Login succeeds using newly reset master credentials', newLoginRes.status === 200);

  // 2.6 Reset back to original credentials
  const restoreCreds = {
    username: 'madyydam',
    currentPassword: tempCreds.newPassword,
    currentPin4: tempCreds.newPin4,
    currentPin8: tempCreds.newPin8,
    newPassword: adminCreds.password,
    newPin4: adminCreds.pin4,
    newPin8: adminCreds.pin8,
  };
  const restoreRes = await fetch(`${BASE_URL}/api/auth/super-admin/reset-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(restoreCreds),
  });
  report('Restored primary master credentials successfully', restoreRes.status === 200);

  // ──────────────────────────────────────────────────────────
  // TEST 3: Demo Backdoors & Legacy Endpoints Blocked
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Demo Account & Legacy Auth Elimination ---');

  // 3.1 Demo account abc@xyz.com rejected
  const demoLoginRes = await fetch(`${BASE_URL}/api/auth/member-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessSlug: 'adjs',
      roleId: 'owner',
      email: 'abc@xyz.com',
      password: '12345678',
      pin: '1234',
    }),
  });
  report('Demo user abc@xyz.com is rejected in ADJS (no demo accounts)', demoLoginRes.status === 401);

  const demoLoginGentle = await fetch(`${BASE_URL}/api/auth/member-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessSlug: 'gentle',
      roleId: 'caller',
      email: 'abc@xyz.com',
      password: '12345678',
      pin: '1234',
    }),
  });
  report('Demo user abc@xyz.com is rejected in Gentle Hair Wigs', demoLoginGentle.status === 401);

  // 3.2 Legacy verify endpoint disabled
  const legacyVerifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessSlug: 'adjs',
      role: 'owner',
      password: '12345678',
      pin: '1234',
    }),
  });
  report('Legacy /api/auth/verify is disabled and rejected (HTTP 403)', legacyVerifyRes.status === 403);

  // ──────────────────────────────────────────────────────────
  // TEST 4: Strict Member Isolation & Multi-Company Testing
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Multi-Tenant Role Isolation & Allocation ---');

  // Fetch businesses to get real IDs for ADJS and Gentle
  const businessesRes = await fetch(`${BASE_URL}/api/businesses`, { headers: adminHeaders });
  const businessesData = await businessesRes.json();
  const adjsBiz = businessesData.businesses?.find((b) => b.slug === 'adjs' || b.slug === 'printbooth');
  const gentleBiz = businessesData.businesses?.find((b) => b.slug === 'gentle');

  assert(adjsBiz, 'ADJS business exists');
  assert(gentleBiz, 'Gentle business exists');

  const testEmail1 = `test.staff.alpha_${Date.now()}@erphomeseva.tech`;
  const testEmail2 = `test.staff.beta_${Date.now()}@erphomeseva.tech`;

  let createdMemberIds = [];

  try {
    // 4.1 Super Admin creates Member 1 in ADJS (Role: Manager)
    const createMember1Res = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        business_id: adjsBiz.id,
        role_id: 'manager',
        name: 'Alpha Manager',
        email: testEmail1,
        password: 'PassAlpha@123',
        pin: '1122',
      }),
    });
    const createMember1Data = await createMember1Res.json();
    report('Super Admin allocates Member Alpha to ADJS [manager]', createMember1Res.status === 200 && createMember1Data.success);
    if (createMember1Data.member?.id) createdMemberIds.push(createMember1Data.member.id);

    // 4.2 Super Admin creates Member 2 in Gentle (Role: Cold Caller)
    const createMember2Res = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        business_id: gentleBiz.id,
        role_id: 'Cold Caller',
        name: 'Beta Telecaller',
        email: testEmail2,
        password: 'PassBeta@123',
        pin: '3344',
      }),
    });
    const createMember2Data = await createMember2Res.json();
    report('Super Admin allocates Member Beta to Gentle [Cold Caller]', createMember2Res.status === 200 && createMember2Data.success);
    if (createMember2Data.member?.id) createdMemberIds.push(createMember2Data.member.id);

    // 4.3 Legitimate Login Tests
    const alphaLogin = await fetch(`${BASE_URL}/api/auth/member-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'adjs',
        roleId: 'manager',
        email: testEmail1,
        password: 'PassAlpha@123',
        pin: '1122',
      }),
    });
    report('Member Alpha logs into ADJS as manager successfully', alphaLogin.status === 200);

    const betaLogin = await fetch(`${BASE_URL}/api/auth/member-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'gentle',
        roleId: 'Cold Caller',
        email: testEmail2,
        password: 'PassBeta@123',
        pin: '3344',
      }),
    });
    report('Member Beta logs into Gentle as Cold Caller successfully', betaLogin.status === 200);

    // 4.4 Cross-Role Attempt: Alpha tries to log into ADJS as "owner" or "Developer"
    const crossRoleRes = await fetch(`${BASE_URL}/api/auth/member-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'adjs',
        roleId: 'Owner',
        email: testEmail1,
        password: 'PassAlpha@123',
        pin: '1122',
      }),
    });
    const crossRoleData = await crossRoleRes.json();
    report(
      'Cross-role attempt blocked (Alpha cannot log into Owner role in ADJS)',
      crossRoleRes.status === 403 && crossRoleData.wrongRole === true
    );

    // 4.5 Cross-Company Attempt: Alpha tries to log into Gentle
    const crossCompanyRes = await fetch(`${BASE_URL}/api/auth/member-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'gentle',
        roleId: 'manager',
        email: testEmail1,
        password: 'PassAlpha@123',
        pin: '1122',
      }),
    });
    report('Cross-company attempt blocked (Alpha has no record in Gentle)', crossCompanyRes.status === 401);

    // 4.6 Multi-Role Allocation Test:
    // Now Super Admin explicitly allocates Member Alpha to a second company (Gentle) as "Studio Manager"
    const allocateAlphaGentleRes = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        business_id: gentleBiz.id,
        role_id: 'Studio Manager',
        name: 'Alpha Manager',
        email: testEmail1,
        password: 'AlphaGentlePass@456',
        pin: '7788',
      }),
    });
    const allocateAlphaGentleData = await allocateAlphaGentleRes.json();
    report(
      'Super Admin allocates same employee (Alpha) to second company [Gentle -> Studio Manager]',
      allocateAlphaGentleRes.status === 200 && allocateAlphaGentleData.success
    );
    if (allocateAlphaGentleData.member?.id) createdMemberIds.push(allocateAlphaGentleData.member.id);

    // 4.7 Alpha logs into Gentle with Gentle credentials
    const alphaGentleLogin = await fetch(`${BASE_URL}/api/auth/member-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'gentle',
        roleId: 'Studio Manager',
        email: testEmail1,
        password: 'AlphaGentlePass@456',
        pin: '7788',
      }),
    });
    report('Multi-role employee Alpha logs into second company (Gentle) successfully', alphaGentleLogin.status === 200);

    // 4.8 Alpha's Gentle credentials cannot unlock ADJS
    const alphaWrongCrossLogin = await fetch(`${BASE_URL}/api/auth/member-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'adjs',
        roleId: 'manager',
        email: testEmail1,
        password: 'AlphaGentlePass@456', // Gentle password used in ADJS
        pin: '7788',
      }),
    });
    report('Credentials are strictly scoped: Gentle password rejected for ADJS workspace', alphaWrongCrossLogin.status === 401);

  } finally {
    // ──────────────────────────────────────────────────────────
    // CLEANUP: Purge temporary test members so database remains clean
    // ──────────────────────────────────────────────────────────
    console.log('\n--- Cleaning up temporary test members ---');
    for (const memId of createdMemberIds) {
      try {
        await fetch(`${BASE_URL}/api/members`, {
          method: 'DELETE',
          headers: adminHeaders,
          body: JSON.stringify({ id: memId }),
        });
      } catch {}
    }
    console.log(`  Purged ${createdMemberIds.length} temporary test records.`);
  }

  console.log(`\n======================================================`);
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error('\nSuite Execution Terminated with error:', err.message);
  process.exit(1);
});
