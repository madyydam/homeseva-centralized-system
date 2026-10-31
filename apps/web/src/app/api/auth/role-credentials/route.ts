import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

export interface RoleCredential {
  role: string;
  label: string;
  password: string;
  pin: string;
  department: string;
  lastUpdated?: string | undefined;
}

export interface BusinessCredentials {
  businessId: string;
  businessSlug: string;
  businessName: string;
  roles: RoleCredential[];
}

// Standard company catalog and default credentials
const DEFAULT_BUSINESS_CREDENTIALS: Record<string, { id: string; name: string; roles: RoleCredential[] }> = {
  'gentle-hair-wigs': {
    id: '3',
    name: 'Gentle Hair Wigs',
    roles: [
      { role: 'Studio Manager', label: 'Studio Manager', password: 'GentleHair@123', pin: '2408', department: 'Operations' },
      { role: 'Cold Caller', label: 'Cold Caller / Telecaller', password: 'Telecaller@123', pin: '1100', department: 'Telecalling' },
      { role: 'Senior Wig Specialist & Stylist', label: 'Senior Wig Specialist & Stylist', password: 'Stylist@123', pin: '3300', department: 'Styling' },
      { role: 'Scalp & Measurement Consultant', label: 'Scalp & Measurement Consultant', password: 'Consultant@123', pin: '4400', department: 'Consultation' },
      { role: 'Billing & Front Desk', label: 'Billing & Front Desk', password: 'Billing@123', pin: '5500', department: 'Front Desk' },
      { role: 'Inventory Coordinator (Wigs & Patches)', label: 'Inventory Coordinator (Wigs & Patches)', password: 'Stock@123', pin: '6600', department: 'Inventory' },
      { role: 'Studio Partner / Owner', label: 'Studio Partner / Owner', password: 'Owner@123', pin: '9999', department: 'Executive' },
    ],
  },
  'horeca-essentials': {
    id: '2',
    name: 'HoReCa Essentials & Crockery Rental',
    roles: [
      { role: 'General Manager', label: 'General Manager', password: 'Horeca@123', pin: '2020', department: 'Management' },
      { role: 'Sales Representative (Essentials)', label: 'Sales Representative (Essentials)', password: 'Sales@123', pin: '2100', department: 'Sales' },
      { role: 'Rental Logistics Supervisor', label: 'Rental Logistics Supervisor', password: 'Rental@123', pin: '2200', department: 'Rental' },
      { role: 'Inventory & Warehousing Desk', label: 'Inventory & Warehousing Desk', password: 'Warehouse@123', pin: '2300', department: 'Inventory' },
      { role: 'Banquet Billing & Invoicing', label: 'Banquet Billing & Invoicing', password: 'Billing@123', pin: '2400', department: 'Finance' },
    ],
  },
  'prefab-construction': {
    id: '1',
    name: 'Prefab Construction Solutions',
    roles: [
      { role: 'Project Director', label: 'Project Director', password: 'Prefab@123', pin: '1010', department: 'Projects' },
      { role: 'Civil Site Engineer', label: 'Civil Site Engineer', password: 'Engineer@123', pin: '1020', department: 'Engineering' },
      { role: 'Procurement & Materials Desk', label: 'Procurement & Materials Desk', password: 'Procure@123', pin: '1030', department: 'Procurement' },
      { role: 'Billing & Contract Estimator', label: 'Billing & Contract Estimator', password: 'Billing@123', pin: '1040', department: 'Commercial' },
    ],
  },
  'ecolab-distribution': {
    id: '4',
    name: 'Ecolab Institutional Distribution',
    roles: [
      { role: 'Distribution Manager', label: 'Distribution Manager', password: 'Ecolab@123', pin: '4010', department: 'Operations' },
      { role: 'Institutional Key Account Executive', label: 'Key Account Executive', password: 'Accounts@123', pin: '4020', department: 'Sales' },
      { role: 'Chemical Safety & Stock Auditor', label: 'Safety & Stock Auditor', password: 'Auditor@123', pin: '4030', department: 'Compliance' },
      { role: 'Billing & Dispatch Desk', label: 'Billing & Dispatch Desk', password: 'Dispatch@123', pin: '4040', department: 'Logistics' },
    ],
  },
  'hs-coworking': {
    id: '5',
    name: 'HS Co-working Spaces',
    roles: [
      { role: 'Community Manager', label: 'Community Manager', password: 'Cowork@123', pin: '5010', department: 'Community' },
      { role: 'Front Desk Coordinator', label: 'Front Desk Coordinator', password: 'FrontDesk@123', pin: '5020', department: 'Reception' },
      { role: 'Facility & Access Desk', label: 'Facility & Access Desk', password: 'Facility@123', pin: '5030', department: 'Operations' },
    ],
  },
  'first-mover-advantage': {
    id: '6',
    name: 'First Mover Advantage',
    roles: [
      { role: 'Product Lead', label: 'Product Lead', password: 'Product@123', pin: '6010', department: 'Product' },
      { role: 'DevOps & Platform Desk', label: 'DevOps & Platform Desk', password: 'Platform@123', pin: '6020', department: 'Engineering' },
      { role: 'Billing & Accounts', label: 'Billing & Accounts', password: 'Finance@123', pin: '6030', department: 'Finance' },
    ],
  },
  'printbooth': {
    id: '7',
    name: 'Printbooth Digital Printing',
    roles: [
      { role: 'Production Supervisor', label: 'Production Supervisor', password: 'Print@123', pin: '7010', department: 'Production' },
      { role: 'Machine Operator', label: 'Machine Operator', password: 'Operator@123', pin: '7020', department: 'Press' },
      { role: 'Counter & Delivery Desk', label: 'Counter & Delivery Desk', password: 'Counter@123', pin: '7030', department: 'Dispatch' },
    ],
  },
  'dve-enterprises': {
    id: '8',
    name: 'DVE Enterprises',
    roles: [
      { role: 'Trading Manager', label: 'Trading Manager', password: 'Trading@123', pin: '8010', department: 'Trade' },
      { role: 'Dispatch Coordinator', label: 'Dispatch Coordinator', password: 'Dispatch@123', pin: '8020', department: 'Logistics' },
      { role: 'Accounts Desk', label: 'Accounts Desk', password: 'Accounts@123', pin: '8030', department: 'Finance' },
    ],
  },
  'nda-services': {
    id: '9',
    name: 'NDA Security & Facility Care',
    roles: [
      { role: 'Operations Head', label: 'Operations Head', password: 'Security@123', pin: '9010', department: 'Security' },
      { role: 'Deployment Officer', label: 'Deployment Officer', password: 'Officer@123', pin: '9020', department: 'Field' },
      { role: 'Admin Desk', label: 'Admin Desk', password: 'Admin@123', pin: '9030', department: 'Administration' },
    ],
  },
  'hs-real-estate': {
    id: '10',
    name: 'HS Real Estate & Assets',
    roles: [
      { role: 'Portfolio Lead', label: 'Portfolio Lead', password: 'Property@123', pin: '1110', department: 'Portfolio' },
      { role: 'Leasing Executive', label: 'Leasing Executive', password: 'Leasing@123', pin: '1120', department: 'Leasing' },
      { role: 'Accounts & Legal', label: 'Accounts & Legal', password: 'Legal@123', pin: '1130', department: 'Legal' },
    ],
  },
};

// In-memory runtime override cache for seamless instant feedback across server restarts
const memoryCache: Record<string, Record<string, { password?: string; pin?: string; lastUpdated: string }>> = {};

// Helper: load credentials for a business from DB + fallback
async function getCredentialsForBusiness(slug: string) {
  const catalog = DEFAULT_BUSINESS_CREDENTIALS[slug] || DEFAULT_BUSINESS_CREDENTIALS['gentle-hair-wigs']!;
  const businessId = catalog.id;

  const resultRoles: RoleCredential[] = [];

  // Try DB
  let dbUsers: Array<{ roleId: string; passwordHash: string; totpSecret: string | null; updatedAt: Date }> = [];
  try {
    dbUsers = await prisma.user.findMany({
      where: { businessId },
      select: { roleId: true, passwordHash: true, totpSecret: true, updatedAt: true },
    });
  } catch (err) {
    // DB not yet populated or offline, will use defaults + memory cache
  }

  const dbMap = new Map(dbUsers.map((u) => [u.roleId, u]));
  const memMap = memoryCache[slug] || {};

  for (const defaultRole of catalog.roles) {
    const dbEntry = dbMap.get(defaultRole.role);
    const memEntry = memMap[defaultRole.role];

    const currentPass = memEntry?.password || dbEntry?.passwordHash || defaultRole.password;
    const currentPin = memEntry?.pin || dbEntry?.totpSecret || defaultRole.pin;
    const lastUp = memEntry?.lastUpdated || (dbEntry?.updatedAt ? dbEntry.updatedAt.toISOString() : undefined);

    resultRoles.push({
      ...defaultRole,
      password: currentPass,
      pin: currentPin,
      lastUpdated: lastUp,
    });
  }

  return {
    businessId,
    businessSlug: slug,
    businessName: catalog.name,
    roles: resultRoles,
  };
}

// GET: Retrieve company credentials (for Super Admin management or role list)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const businessSlug = searchParams.get('businessSlug');

  try {
    // If requesting all companies for Super Admin Console
    if (action === 'all') {
      const allCompanies: BusinessCredentials[] = [];
      for (const slug of Object.keys(DEFAULT_BUSINESS_CREDENTIALS)) {
        const creds = await getCredentialsForBusiness(slug);
        allCompanies.push(creds);
      }
      return NextResponse.json({ success: true, companies: allCompanies });
    }

    // If requesting specific company
    const targetSlug = businessSlug || 'gentle-hair-wigs';
    const company = await getCredentialsForBusiness(targetSlug);
    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Error fetching role credentials:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST: Verify credentials during Sign In OR Update credentials by Super Admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, businessSlug, role, password, pin, newPassword, newPin, credentials } = body;

    const slug = businessSlug || 'gentle-hair-wigs';
    const catalog = DEFAULT_BUSINESS_CREDENTIALS[slug] || DEFAULT_BUSINESS_CREDENTIALS['gentle-hair-wigs']!;
    const businessId = catalog.id;

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION 1: VERIFY SIGN IN CREDENTIALS
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!role) {
        return NextResponse.json({ success: false, error: 'Please select a role' }, { status: 400 });
      }

      const creds = await getCredentialsForBusiness(slug);
      const roleCred = creds.roles.find((r) => r.role === role);

      if (!roleCred) {
        return NextResponse.json({ success: false, error: `Role "${role}" not configured for this business.` }, { status: 404 });
      }

      const enteredPass = (password || '').trim();
      const enteredPin = (pin || '').trim();

      const expectedPass = roleCred.password.trim();
      const expectedPin = roleCred.pin.trim();

      if (!enteredPass) {
        return NextResponse.json({ success: false, error: 'Please enter your password.' }, { status: 400 });
      }

      // Check Password
      if (enteredPass !== expectedPass) {
        return NextResponse.json({ success: false, error: 'Incorrect password for this role.' }, { status: 401 });
      }

      // Check PIN (if PIN is required/configured)
      if (expectedPin && enteredPin !== expectedPin) {
        return NextResponse.json({ success: false, error: 'Incorrect 4-digit security PIN.' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        role: roleCred.role,
        businessSlug: slug,
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION 2: SUPER ADMIN UPDATE SINGLE ROLE CREDENTIALS
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'update') {
      if (!role || !newPassword) {
        return NextResponse.json({ success: false, error: 'Role and new password are required' }, { status: 400 });
      }

      const cleanPass = newPassword.trim();
      const cleanPin = (newPin || '').trim();
      const nowStr = new Date().toISOString();

      // Update memory cache
      if (!memoryCache[slug]) memoryCache[slug] = {};
      memoryCache[slug][role] = {
        password: cleanPass,
        pin: cleanPin,
        lastUpdated: nowStr,
      };

      // Persist to PostgreSQL if available
      try {
        await prisma.user.upsert({
          where: {
            roleId_businessId: {
              roleId: role,
              businessId: businessId,
            },
          },
          create: {
            roleId: role,
            businessId: businessId,
            passwordHash: cleanPass,
            totpSecret: cleanPin,
            isActive: true,
            isSuperAdmin: false,
          },
          update: {
            passwordHash: cleanPass,
            totpSecret: cleanPin,
            isActive: true,
          },
        });
      } catch (dbErr) {
        console.warn('DB upsert user warning (saved in cache):', dbErr);
      }

      return NextResponse.json({
        success: true,
        message: `Credentials for "${role}" updated successfully.`,
        role,
        password: cleanPass,
        pin: cleanPin,
        lastUpdated: nowStr,
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION 3: SUPER ADMIN BATCH UPDATE ALL ROLES FOR A COMPANY
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'batch-update') {
      if (!Array.isArray(credentials)) {
        return NextResponse.json({ success: false, error: 'Credentials array is required' }, { status: 400 });
      }

      const nowStr = new Date().toISOString();
      if (!memoryCache[slug]) memoryCache[slug] = {};

      for (const item of credentials) {
        if (!item.role || !item.password) continue;
        const pass = item.password.trim();
        const p = (item.pin || '').trim();

        memoryCache[slug][item.role] = {
          password: pass,
          pin: p,
          lastUpdated: nowStr,
        };

        try {
          await prisma.user.upsert({
            where: {
              roleId_businessId: {
                roleId: item.role,
                businessId: businessId,
              },
            },
            create: {
              roleId: item.role,
              businessId: businessId,
              passwordHash: pass,
              totpSecret: p,
              isActive: true,
              isSuperAdmin: false,
            },
            update: {
              passwordHash: pass,
              totpSecret: p,
              isActive: true,
            },
          });
        } catch (dbErr) {
          // ignore individual DB errors, memory cache persists
        }
      }

      return NextResponse.json({
        success: true,
        message: `All credentials for ${catalog.name} updated successfully.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in role-credentials POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
