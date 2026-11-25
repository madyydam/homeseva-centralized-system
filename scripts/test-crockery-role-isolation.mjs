import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function testRoleIsolation() {
  console.log('🧪 Starting Crockery & Essentials Sales Role Isolation Test Suite...\n');

  // Test 1: Query API with slug=crockery-rental
  console.log('Test 1: GET /api/auth/businesses?slug=crockery-rental');
  const res1 = await fetch(`${BASE_URL}/api/auth/businesses?slug=crockery-rental`);
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true, 'API returned success=true');
  const roles1 = data1.business.roles.map(r => r.role_id);
  console.log('Roles returned for crockery-rental:', roles1);
  assert.strictEqual(roles1.length, 5, 'Exactly 5 roles for Crockery Rental');
  assert(roles1.includes('Owner'), 'Includes Owner');
  assert(roles1.includes('General Manager'), 'Includes General Manager');
  assert(roles1.includes('Rental Logistics Supervisor'), 'Includes Rental Logistics Supervisor');
  assert(roles1.includes('Inventory & Warehousing Desk'), 'Includes Inventory & Warehousing Desk');
  assert(roles1.includes('Banquet Billing & Invoicing'), 'Includes Banquet Billing & Invoicing');
  assert(!roles1.includes('Store Manager'), 'Must NOT include Store Manager');
  assert(!roles1.includes('Sales Representative (Essentials)'), 'Must NOT include Sales Representative');
  assert(!roles1.includes('Billing & Accounts'), 'Must NOT include Billing & Accounts');
  console.log('✅ Test 1 PASSED: Crockery Rental contains ZERO sales roles!\n');

  // Test 2: Query API with slug=essentials-sales
  console.log('Test 2: GET /api/auth/businesses?slug=essentials-sales');
  const res2 = await fetch(`${BASE_URL}/api/auth/businesses?slug=essentials-sales`);
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true, 'API returned success=true');
  const roles2 = data2.business.roles.map(r => r.role_id);
  console.log('Roles returned for essentials-sales:', roles2);
  assert(roles2.length >= 4, 'Has Essentials Sales roles');
  assert(roles2.includes('Store Manager'), 'Includes Store Manager');
  assert(roles2.includes('Sales Representative (Essentials)'), 'Includes Sales Representative (Essentials)');
  assert(roles2.includes('Billing & Accounts'), 'Includes Billing & Accounts');
  assert(roles2.includes('Logistics & Dispatch'), 'Includes Logistics & Dispatch');
  assert(!roles2.includes('Rental Logistics Supervisor'), 'Must NOT include Rental Logistics Supervisor');
  assert(!roles2.includes('Banquet Billing & Invoicing'), 'Must NOT include Banquet Billing & Invoicing');
  console.log('✅ Test 2 PASSED: Essentials Sales contains ZERO crockery roles!\n');

  // Test 3: Query API with slug=horeca-essentials&division=crockery-rental
  console.log('Test 3: GET /api/auth/businesses?slug=horeca-essentials&division=crockery-rental');
  const res3 = await fetch(`${BASE_URL}/api/auth/businesses?slug=horeca-essentials&division=crockery-rental`);
  const data3 = await res3.json();
  assert.strictEqual(data3.success, true, 'API returned success=true');
  const roles3 = data3.business.roles.map(r => r.role_id);
  console.log('Roles returned with division=crockery-rental:', roles3);
  assert.strictEqual(roles3.length, 5, 'Exactly 5 roles for Crockery Rental');
  assert(!roles3.includes('Store Manager'), 'Must NOT include Store Manager');
  assert(!roles3.includes('Sales Representative (Essentials)'), 'Must NOT include Sales Representative');
  console.log('✅ Test 3 PASSED: Parent slug with division=crockery-rental returns strictly Crockery roles!\n');

  // Test 4: Query API with slug=horeca-essentials&division=essentials-sales
  console.log('Test 4: GET /api/auth/businesses?slug=horeca-essentials&division=essentials-sales');
  const res4 = await fetch(`${BASE_URL}/api/auth/businesses?slug=horeca-essentials&division=essentials-sales`);
  const data4 = await res4.json();
  assert.strictEqual(data4.success, true, 'API returned success=true');
  const roles4 = data4.business.roles.map(r => r.role_id);
  console.log('Roles returned with division=essentials-sales:', roles4);
  assert(!roles4.includes('Rental Logistics Supervisor'), 'Must NOT include Rental Logistics Supervisor');
  assert(!roles4.includes('Banquet Billing & Invoicing'), 'Must NOT include Banquet Billing & Invoicing');
  console.log('✅ Test 4 PASSED: Parent slug with division=essentials-sales returns strictly Sales roles!\n');

  console.log('🎉 ALL 4 CROCKERY & SALES ROLE ISOLATION TESTS PASSED PERFECTLY!');
}

testRoleIsolation().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
