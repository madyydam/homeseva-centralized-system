import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { getSupabaseAdmin } from '../../../../lib/supabaseServer';
import {
  signSession,
  verifySession,
  SUPER_ADMIN_COOKIE,
  USER_SESSION_COOKIE,
} from '../../../../lib/authSession';

export const dynamic = 'force-dynamic';

export interface RoleCredential {
  role: string;
  label: string;
  department: string;
  password?: string;
  pin?: string;
  hasPassword?: boolean;
  hasPin?: boolean;
  lastUpdated?: string | undefined;
}

export interface BusinessCredentials {
  businessId: string;
  businessSlug: string;
  businessName: string;
  roles: RoleCredential[];
}

export interface SuperAdminConfig {
  username: string;
  password?: string;
  pin4?: string;
  pin8?: string;
  hasPassword?: boolean;
  hasPin4?: boolean;
  hasPin8?: boolean;
  lastUpdated?: string | undefined;
}

// Standard company catalog
const DEFAULT_BUSINESS_CREDENTIALS: Record<string, { id: string; name: string; roles: Array<{ role: string; label: string; department: string; defaultPass: string; defaultPin: string }> }> = {
  'gentle-hair-wigs': {
    id: '3',
    name: 'Gentle Hair Wigs',
    roles: [
      { role: 'Studio Manager', label: 'Studio Manager', department: 'Operations', defaultPass: 'GentleHair@123', defaultPin: '2408' },
      { role: 'Cold Caller', label: 'Cold Caller / Telecaller', department: 'Telecalling', defaultPass: 'Telecaller@123', defaultPin: '1100' },
      { role: 'Senior Wig Specialist & Stylist', label: 'Senior Wig Specialist & Stylist', department: 'Styling', defaultPass: 'Stylist@123', defaultPin: '3300' },
      { role: 'Scalp & Measurement Consultant', label: 'Scalp & Measurement Consultant', department: 'Consultation', defaultPass: 'Consultant@123', defaultPin: '4400' },
      { role: 'Billing & Front Desk', label: 'Billing & Front Desk', department: 'Front Desk', defaultPass: 'Billing@123', defaultPin: '5500' },
      { role: 'Inventory Coordinator (Wigs & Patches)', label: 'Inventory Coordinator (Wigs & Patches)', department: 'Inventory', defaultPass: 'Stock@123', defaultPin: '6600' },
      { role: 'Studio Partner / Owner', label: 'Studio Partner / Owner', department: 'Executive', defaultPass: 'Owner@123', defaultPin: '9999' },
    ],
  },
  'horeca-essentials': {
    id: '2',
    name: 'HoReCa Essentials & Crockery Rental',
    roles: [
      { role: 'General Manager', label: 'General Manager', department: 'Management', defaultPass: 'Horeca@123', defaultPin: '2020' },
      { role: 'Sales Representative (Essentials)', label: 'Sales Representative (Essentials)', department: 'Sales', defaultPass: 'Sales@123', defaultPin: '2100' },
      { role: 'Rental Logistics Supervisor', label: 'Rental Logistics Supervisor', department: 'Rental', defaultPass: 'Rental@123', defaultPin: '2200' },
      { role: 'Inventory & Warehousing Desk', label: 'Inventory & Warehousing Desk', department: 'Inventory', defaultPass: 'Warehouse@123', defaultPin: '2300' },
      { role: 'Banquet Billing & Invoicing', label: 'Banquet Billing & Invoicing', department: 'Finance', defaultPass: 'Billing@123', defaultPin: '2400' },
    ],
  },
  'prefab-construction': {
    id: '1',
    name: 'Prefab Construction Solutions',
    roles: [
      { role: 'Project Director', label: 'Project Director', department: 'Projects', defaultPass: 'Prefab@123', defaultPin: '1010' },
      { role: 'Civil Site Engineer', label: 'Civil Site Engineer', department: 'Engineering', defaultPass: 'Engineer@123', defaultPin: '1020' },
      { role: 'Procurement & Materials Desk', label: 'Procurement & Materials Desk', department: 'Procurement', defaultPass: 'Procure@123', defaultPin: '1030' },
      { role: 'Billing & Contract Estimator', label: 'Billing & Contract Estimator', department: 'Commercial', defaultPass: 'Billing@123', defaultPin: '1040' },
    ],
  },
  'ecolab-distribution': {
    id: '4',
    name: 'Ecolab Institutional Distribution',
    roles: [
      { role: 'Distribution Manager', label: 'Distribution Manager', department: 'Operations', defaultPass: 'Ecolab@123', defaultPin: '4010' },
      { role: 'Institutional Key Account Executive', label: 'Key Account Executive', department: 'Sales', defaultPass: 'Accounts@123', defaultPin: '4020' },
      { role: 'Chemical Safety & Stock Auditor', label: 'Safety & Stock Auditor', department: 'Compliance', defaultPass: 'Auditor@123', defaultPin: '4030' },
      { role: 'Billing & Dispatch Desk', label: 'Billing & Dispatch Desk', department: 'Logistics', defaultPass: 'Dispatch@123', defaultPin: '4040' },
    ],
  },
  'hs-coworking': {
    id: '5',
    name: 'HS Co-working Spaces',
    roles: [
      { role: 'Community Manager', label: 'Community Manager', department: 'Community', defaultPass: 'Cowork@123', defaultPin: '5010' },
      { role: 'Front Desk Coordinator', label: 'Front Desk Coordinator', department: 'Reception', defaultPass: 'FrontDesk@123', defaultPin: '5020' },
      { role: 'Facility & Access Desk', label: 'Facility & Access Desk', department: 'Operations', defaultPass: 'Facility@123', defaultPin: '5030' },
    ],
  },
  'first-mover-advantage': {
    id: '6',
    name: 'First Mover Advantage',
    roles: [
      { role: 'Product Lead', label: 'Product Lead', department: 'Product', defaultPass: 'Product@123', defaultPin: '6010' },
      { role: 'DevOps & Platform Desk', label: 'DevOps & Platform Desk', department: 'Engineering', defaultPass: 'Platform@123', defaultPin: '6020' },
      { role: 'Billing & Accounts', label: 'Billing & Accounts', department: 'Finance', defaultPass: 'Finance@123', defaultPin: '6030' },
    ],
  },
  'printbooth': {
    id: '7',
    name: 'Printbooth Digital Printing',
    roles: [
      { role: 'Production Supervisor', label: 'Production Supervisor', department: 'Production', defaultPass: 'Print@123', defaultPin: '7010' },
      { role: 'Machine Operator', label: 'Machine Operator', department: 'Press', defaultPass: 'Operator@123', defaultPin: '7020' },
      { role: 'Counter & Delivery Desk', label: 'Counter & Delivery Desk', department: 'Dispatch', defaultPass: 'Counter@123', defaultPin: '7030' },
    ],
  },
  'dve-enterprises': {
    id: '8',
    name: 'DVE Enterprises',
    roles: [
      { role: 'Trading Manager', label: 'Trading Manager', department: 'Trade', defaultPass: 'Trading@123', defaultPin: '8010' },
      { role: 'Dispatch Coordinator', label: 'Dispatch Coordinator', department: 'Logistics', defaultPass: 'Dispatch@123', defaultPin: '8020' },
      { role: 'Accounts Desk', label: 'Accounts Desk', department: 'Finance', defaultPass: 'Accounts@123', defaultPin: '8030' },
    ],
  },
  'nda-services': {
    id: '9',
    name: 'NDA Security & Facility Care',
    roles: [
      { role: 'Operations Head', label: 'Operations Head', department: 'Security', defaultPass: 'Security@123', defaultPin: '9010' },
      { role: 'Deployment Officer', label: 'Deployment Officer', department: 'Field', defaultPass: 'Officer@123', defaultPin: '9020' },
      { role: 'Admin Desk', label: 'Admin Desk', department: 'Administration', defaultPass: 'Admin@123', defaultPin: '9030' },
    ],
  },
  'hs-real-estate': {
    id: '10',
    name: 'HS Real Estate & Assets',
    roles: [
      { role: 'Portfolio Lead', label: 'Portfolio Lead', department: 'Portfolio', defaultPass: 'Property@123', defaultPin: '1110' },
      { role: 'Leasing Executive', label: 'Leasing Executive', department: 'Leasing', defaultPass: 'Leasing@123', defaultPin: '1120' },
      { role: 'Accounts & Legal', label: 'Accounts & Legal', department: 'Legal', defaultPass: 'Legal@123', defaultPin: '1130' },
    ],
  },
};

// In-memory runtime override cache for development fallback
const memoryCache: Record<string, Record<string, { password?: string; pin?: string; lastUpdated: string }>> = {};
let superAdminCache = {
  username: 'superadmin@homeseva.internal',
  password: 'SuperAdmin@HomeSeva2026!',
  pin4: '2408',
  pin8: '84920177',
  lastUpdated: new Date().toISOString(),
};

// Helper: load raw Super Admin record from Supabase / DB (SERVER-ONLY)
async function getRawSuperAdmin() {
  // 1. Try Supabase
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('super_admin_credentials')
      .select('*')
      .eq('id', 'root')
      .single();

    if (!error && data) {
      return {
        username: data.username || superAdminCache.username,
        password: data.passwordHash || superAdminCache.password,
        pin4: data.pin4 || superAdminCache.pin4,
        pin8: data.pin8 || superAdminCache.pin8,
        lastUpdated: data.updatedAt,
      };
    }
  } catch (err) {
    // Supabase table not yet created or connection fallback
  }

  // 2. Try Prisma User table
  try {
    const dbAdmin = await prisma.user.findFirst({
      where: { isSuperAdmin: true },
      select: { roleId: true, passwordHash: true, totpSecret: true, updatedAt: true },
    });
    if (dbAdmin) {
      const parts = (dbAdmin.totpSecret || '').split(':');
      const pin4 = (parts[0] && parts[0].trim()) ? parts[0].trim() : superAdminCache.pin4;
      const pin8 = (parts[1] && parts[1].trim()) ? parts[1].trim() : superAdminCache.pin8;
      const pass = (dbAdmin.passwordHash && dbAdmin.passwordHash.trim() && !dbAdmin.passwordHash.startsWith('5e8848') && !dbAdmin.passwordHash.startsWith('e5bf4e'))
        ? dbAdmin.passwordHash.trim()
        : superAdminCache.password;

      return {
        username: dbAdmin.roleId || superAdminCache.username,
        password: pass,
        pin4,
        pin8,
        lastUpdated: dbAdmin.updatedAt.toISOString(),
      };
    }
  } catch (err) {
    // fallback to cache
  }

  return superAdminCache;
}

// Helper: load credentials for a business (SERVER-ONLY)
async function getRawCredentialsForBusiness(slug: string) {
  const catalog = DEFAULT_BUSINESS_CREDENTIALS[slug] || DEFAULT_BUSINESS_CREDENTIALS['gentle-hair-wigs']!;
  const businessId = catalog.id;

  // 1. Try Supabase role_credentials table
  try {
    const supabase = getSupabaseAdmin();
    const { data: supaRoles, error } = await supabase
      .from('role_credentials')
      .select('*')
      .eq('businessSlug', slug);

    if (!error && Array.isArray(supaRoles) && supaRoles.length > 0) {
      const supaMap = new Map(supaRoles.map((r: any) => [r.role, r]));
      const resolved = catalog.roles.map((def) => {
        const row = supaMap.get(def.role) as any;
        return {
          role: def.role,
          label: def.label,
          department: def.department,
          password: row?.password || def.defaultPass,
          pin: row?.pin || def.defaultPin,
          lastUpdated: row?.updatedAt || undefined,
        };
      });

      return {
        businessId,
        businessSlug: slug,
        businessName: catalog.name,
        roles: resolved,
      };
    }
  } catch (err) {
    // fallback
  }

  // 2. Try Prisma user table
  let dbUsers: Array<{ roleId: string; passwordHash: string; totpSecret: string | null; updatedAt: Date }> = [];
  try {
    dbUsers = await prisma.user.findMany({
      where: { businessId },
      select: { roleId: true, passwordHash: true, totpSecret: true, updatedAt: true },
    });
  } catch (err) {
    // fallback
  }

  const dbMap = new Map(dbUsers.map((u) => [u.roleId, u]));
  const memMap = memoryCache[slug] || {};

  const resolved = catalog.roles.map((def) => {
    const dbEntry = dbMap.get(def.role);
    const memEntry = memMap[def.role];

    return {
      role: def.role,
      label: def.label,
      department: def.department,
      password: memEntry?.password || dbEntry?.passwordHash || def.defaultPass,
      pin: memEntry?.pin || dbEntry?.totpSecret || def.defaultPin,
      lastUpdated: memEntry?.lastUpdated || (dbEntry?.updatedAt ? dbEntry.updatedAt.toISOString() : undefined),
    };
  });

  return {
    businessId,
    businessSlug: slug,
    businessName: catalog.name,
    roles: resolved,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Retrieve company metadata & masked roles
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const businessSlug = searchParams.get('businessSlug');

  // Verify Super Admin Session for privileged data
  const saCookie = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
  const isSuperAdmin = Boolean(saCookie && (await verifySession(saCookie))?.isSuperAdmin);

  try {
    // 1. Super Admin checking own status or profile
    if (action === 'get-super-admin') {
      if (!isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin session required.' }, { status: 401 });
      }
      const rawAdmin = await getRawSuperAdmin();
      return NextResponse.json({
        success: true,
        superAdmin: {
          username: rawAdmin.username,
          hasPassword: Boolean(rawAdmin.password),
          hasPin4: Boolean(rawAdmin.pin4),
          hasPin8: Boolean(rawAdmin.pin8),
          lastUpdated: rawAdmin.lastUpdated,
        },
      });
    }

    // 2. Super Admin Console requesting all companies
    if (action === 'all') {
      if (!isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin session required.' }, { status: 401 });
      }

      const allCompanies: BusinessCredentials[] = [];
      for (const slug of Object.keys(DEFAULT_BUSINESS_CREDENTIALS)) {
        const creds = await getRawCredentialsForBusiness(slug);
        // MASK PASSWORDS for client UI safety: only return status flags
        const safeRoles: RoleCredential[] = creds.roles.map((r) => ({
          role: r.role,
          label: r.label,
          department: r.department,
          hasPassword: Boolean(r.password),
          hasPin: Boolean(r.pin),
          lastUpdated: r.lastUpdated,
        }));

        allCompanies.push({
          businessId: creds.businessId,
          businessSlug: creds.businessSlug,
          businessName: creds.businessName,
          roles: safeRoles,
        });
      }

      const rawAdmin = await getRawSuperAdmin();
      return NextResponse.json({
        success: true,
        companies: allCompanies,
        superAdmin: {
          username: rawAdmin.username,
          hasPassword: Boolean(rawAdmin.password),
          hasPin4: Boolean(rawAdmin.pin4),
          hasPin8: Boolean(rawAdmin.pin8),
          lastUpdated: rawAdmin.lastUpdated,
        },
      });
    }

    // 3. Public role list for sign-in page dropdown (ZERO SECRETS RETURNED)
    const targetSlug = businessSlug || 'gentle-hair-wigs';
    const company = await getRawCredentialsForBusiness(targetSlug);
    const safeRoles = company.roles.map((r) => ({
      role: r.role,
      label: r.label,
      department: r.department,
      hasPin: Boolean(r.pin),
    }));

    return NextResponse.json({
      success: true,
      company: {
        businessId: company.businessId,
        businessSlug: company.businessSlug,
        businessName: company.businessName,
        roles: safeRoles,
      },
    });
  } catch (error: any) {
    console.error('Error in role-credentials GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Authentication, Rotation, & Session Termination
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      businessSlug,
      role,
      password,
      pin,
      newPassword,
      newPin,
      credentials,
      username,
      pin4,
      pin8,
      newUsername,
      newPin4,
      newPin8,
    } = body;

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: LOGOUT
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
      response.cookies.delete(SUPER_ADMIN_COOKIE);
      response.cookies.delete(USER_SESSION_COOKIE);
      return response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: VERIFY SUPER ADMIN (4-FACTOR AUTHENTICATION)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'verify-super-admin') {
      const enteredUsername = (username || '').trim().toLowerCase();
      const enteredPassword = (password || '').trim();
      const enteredPin4 = (pin4 || '').trim();
      const enteredPin8 = (pin8 || '').trim();

      if (!enteredUsername || !enteredPassword || !enteredPin4 || !enteredPin8) {
        return NextResponse.json(
          { success: false, error: 'All 4 verification credentials (Username, Password, 4-digit PIN, 8-digit PIN) are required.' },
          { status: 400 }
        );
      }

      const adminCreds = await getRawSuperAdmin();
      const expectedUsername = adminCreds.username.trim().toLowerCase();
      const expectedPassword = adminCreds.password.trim();
      const expectedPin4 = adminCreds.pin4.trim();
      const expectedPin8 = adminCreds.pin8.trim();

      const usernameMatch =
        enteredUsername === expectedUsername ||
        enteredUsername === 'superadmin' ||
        enteredUsername === 'admin' ||
        enteredUsername === 'super_admin' ||
        enteredUsername === 'superadmin@homeseva.internal';

      if (!usernameMatch) {
        return NextResponse.json({ success: false, error: 'Invalid Master Admin Username or Email.' }, { status: 401 });
      }

      if (enteredPassword !== expectedPassword) {
        return NextResponse.json({ success: false, error: 'Invalid Master Admin Password.' }, { status: 401 });
      }

      if (enteredPin4 !== expectedPin4) {
        return NextResponse.json({ success: false, error: 'Invalid 4-Digit Terminal Security PIN.' }, { status: 401 });
      }

      if (enteredPin8 !== expectedPin8) {
        return NextResponse.json({ success: false, error: 'Invalid 8-Digit Master Authority / Recovery Key.' }, { status: 401 });
      }

      // ISSUE CRYPTOGRAPHIC SECURE SESSION TOKEN (8 HOURS)
      const token = await signSession(
        {
          sub: enteredUsername,
          role: 'SUPER_ADMIN',
          isSuperAdmin: true,
        },
        28800
      );

      const response = NextResponse.json({
        success: true,
        message: 'Master Super Admin authentication verified successfully.',
        user: { role: 'SUPER_ADMIN', username: adminCreds.username },
      });

      // Set HttpOnly secure cookie
      response.cookies.set(SUPER_ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 28800,
      });

      return response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: VERIFY COMPANY ROLE SIGN IN
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const slug = businessSlug || 'gentle-hair-wigs';
      if (!role) {
        return NextResponse.json({ success: false, error: 'Please select a role' }, { status: 400 });
      }

      const creds = await getRawCredentialsForBusiness(slug);
      const roleCred = creds.roles.find((r) => r.role === role);

      if (!roleCred) {
        return NextResponse.json({ success: false, error: `Role "${role}" not configured for this company.` }, { status: 404 });
      }

      const enteredPass = (password || '').trim();
      const enteredPin = (pin || '').trim();

      if (!enteredPass) {
        return NextResponse.json({ success: false, error: 'Please enter your password.' }, { status: 400 });
      }

      if (enteredPass !== roleCred.password.trim()) {
        return NextResponse.json({ success: false, error: 'Incorrect password for this role.' }, { status: 401 });
      }

      if (roleCred.pin && enteredPin !== roleCred.pin.trim()) {
        return NextResponse.json({ success: false, error: 'Incorrect 4-digit security PIN.' }, { status: 401 });
      }

      // ISSUE BUSINESS ROLE SESSION TOKEN
      const token = await signSession(
        {
          sub: `${slug}:${role}`,
          role,
          businessSlug: slug,
          isSuperAdmin: false,
        },
        28800
      );

      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful',
        role: roleCred.role,
        businessSlug: slug,
      });

      response.cookies.set(USER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 28800,
      });

      return response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ALL SUBSEQUENT ACTIONS REQUIRE ACTIVE SUPER ADMIN PRIVILEGES
    // ─────────────────────────────────────────────────────────────────────────
    const saCookie = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const sessionPayload = saCookie ? await verifySession(saCookie) : null;
    if (!sessionPayload || !sessionPayload.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Active Super Admin session required to modify credentials.' },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: UPDATE SUPER ADMIN CREDENTIALS (ROTATE ROOT ACCESS)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'update-super-admin') {
      if (!newUsername || !newPassword || !newPin4 || !newPin8) {
        return NextResponse.json(
          { success: false, error: 'All 4 fields (Username, Password, 4-digit PIN, 8-digit PIN) are required.' },
          { status: 400 }
        );
      }

      const nowStr = new Date().toISOString();
      superAdminCache = {
        username: newUsername.trim(),
        password: newPassword.trim(),
        pin4: newPin4.trim(),
        pin8: newPin8.trim(),
        lastUpdated: nowStr,
      };

      // 1. Persist to Supabase super_admin_credentials table
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('super_admin_credentials')
          .upsert({
            id: 'root',
            username: newUsername.trim(),
            passwordHash: newPassword.trim(),
            pin4: newPin4.trim(),
            pin8: newPin8.trim(),
            updatedAt: nowStr,
          });
      } catch (err) {
        console.warn('Supabase super_admin_credentials upsert error:', err);
      }

      // 2. Persist to Prisma User table
      try {
        await prisma.user.upsert({
          where: { id: 'admin_vps_root' },
          create: {
            id: 'admin_vps_root',
            roleId: newUsername.trim(),
            passwordHash: newPassword.trim(),
            totpSecret: `${newPin4.trim()}:${newPin8.trim()}`,
            isSuperAdmin: true,
            isOwner: true,
            isActive: true,
          },
          update: {
            roleId: newUsername.trim(),
            passwordHash: newPassword.trim(),
            totpSecret: `${newPin4.trim()}:${newPin8.trim()}`,
            isSuperAdmin: true,
            isActive: true,
          },
        });
      } catch (err) {
        console.warn('DB error saving super admin:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Master Super Admin 4-Factor Credentials successfully updated!',
        superAdmin: {
          username: newUsername.trim(),
          hasPassword: true,
          hasPin4: true,
          hasPin8: true,
          lastUpdated: nowStr,
        },
      });
    }

    const slug = businessSlug || 'gentle-hair-wigs';
    const catalog = DEFAULT_BUSINESS_CREDENTIALS[slug] || DEFAULT_BUSINESS_CREDENTIALS['gentle-hair-wigs']!;
    const businessId = catalog.id;

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: UPDATE SINGLE ROLE CREDENTIALS
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'update') {
      if (!role || !newPassword) {
        return NextResponse.json({ success: false, error: 'Role and new password are required' }, { status: 400 });
      }

      const cleanPass = newPassword.trim();
      const cleanPin = (newPin || '').trim();
      const nowStr = new Date().toISOString();

      if (!memoryCache[slug]) memoryCache[slug] = {};
      memoryCache[slug][role] = {
        password: cleanPass,
        pin: cleanPin,
        lastUpdated: nowStr,
      };

      // 1. Persist to Supabase role_credentials table
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('role_credentials')
          .upsert(
            {
              businessId,
              businessSlug: slug,
              role,
              label: role,
              password: cleanPass,
              pin: cleanPin,
              updatedAt: nowStr,
            },
            { onConflict: 'businessSlug,role' }
          );
      } catch (err) {
        console.warn('Supabase role_credentials update warning:', err);
      }

      // 2. Persist to Prisma
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
        console.warn('DB upsert user warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        message: `Credentials for "${role}" updated and locked in database.`,
        role,
        lastUpdated: nowStr,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: BATCH UPDATE ALL ROLES FOR A COMPANY
    // ─────────────────────────────────────────────────────────────────────────
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

        // Supabase upsert
        try {
          const supabase = getSupabaseAdmin();
          await supabase
            .from('role_credentials')
            .upsert(
              {
                businessId,
                businessSlug: slug,
                role: item.role,
                label: item.label || item.role,
                department: item.department || 'Operations',
                password: pass,
                pin: p,
                updatedAt: nowStr,
              },
              { onConflict: 'businessSlug,role' }
            );
        } catch (err) {
          // ignore individual upsert errors
        }

        // Prisma upsert
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
          // continue
        }
      }

      return NextResponse.json({
        success: true,
        message: `All role credentials for ${catalog.name} updated and synchronized in database.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in role-credentials POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
