import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@homeseva/db';
import {
  signSession,
  verifySession,
  SUPER_ADMIN_COOKIE,
  USER_SESSION_COOKIE,
} from '../../../../lib/authSession';
import { hashCredential, verifyCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export interface RoleCredential {
  role: string;
  label: string;
  password?: string;
  pin?: string;
  department: string;
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
  lastUpdated?: string | undefined;
}

// GET: Securely load business roles and super admin metadata from PostgreSQL
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    // Check super admin session
    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const session = await verifySession(saToken);

    // Fetch Super Admin config metadata (masked, no raw passwords)
    const adminRecord = await prisma.superAdminCredentials.findFirst({
      where: { id: 'primary' },
      select: { username: true, updatedAt: true },
    });

    if (!adminRecord) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized. Please run seed script first.',
      }, { status: 503 });
    }

    const superAdminMeta: SuperAdminConfig = {
      username: adminRecord.username,
      lastUpdated: adminRecord.updatedAt.toISOString(),
    };

    if (action === 'get-super-admin') {
      return NextResponse.json({ success: true, superAdmin: superAdminMeta });
    }

    if (action === 'all') {
      // Guarded: only accessible by verified Super Admin session
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const businesses = await prisma.business.findMany({
        orderBy: { name: 'asc' },
        include: {
          businessRoles: {
            orderBy: { roleId: 'asc' },
            select: {
              id: true,
              roleId: true,
              label: true,
              description: true,
              department: true,
              password: true,
              pin: true,
              updatedAt: true,
            },
          },
        },
      });

      const companies = businesses.map((b) => ({
        businessId: b.id,
        businessSlug: b.slug,
        businessName: b.name,
        roles: (b.businessRoles || []).map((r) => ({
          role: r.roleId,
          label: r.label || r.roleId,
          department: r.department || 'General',
          hasPassword: !!(r.password && r.password.trim()),
          hasPin: !!(r.pin && r.pin.trim()),
          lastUpdated: r.updatedAt.toISOString(),
        })),
      }));

      return NextResponse.json({ success: true, companies, superAdmin: superAdminMeta });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching role credentials:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST: Secure verification and updates directly via PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: LOGOUT
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'logout') {
      cookies().delete(SUPER_ADMIN_COOKIE);
      cookies().delete(USER_SESSION_COOKIE);
      return NextResponse.json({ success: true });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: VERIFY SUPER ADMIN (4-FACTOR BCRYPT MATCH)
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'verify-super-admin') {
      const { username, password, pin4, pin8 } = body;
      const u = (username || '').trim();
      const p = (password || '').trim();
      const p4 = (pin4 || '').trim();
      const p8 = (pin8 || '').trim();

      if (!u || !p || !p4 || !p8) {
        return NextResponse.json(
          { success: false, error: 'All 4 verification credentials (Username, Password, 4-digit PIN, 8-digit PIN) are mandatory.' },
          { status: 400 }
        );
      }

      const adminRecord = await prisma.superAdminCredentials.findFirst({
        where: { id: 'primary' },
      });

      if (!adminRecord) {
        return NextResponse.json(
          { success: false, error: 'Database not initialized. Super Admin credentials not found.' },
          { status: 503 }
        );
      }

      const expectedUsername = adminRecord.username;
      const expectedPassHash = adminRecord.passwordHash;
      const expectedPin4Hash = adminRecord.pin4Hash;
      const expectedPin8Hash = adminRecord.pin8Hash;

      // Check lockout
      if (adminRecord.lockedUntil) {
        const lockExpiry = new Date(adminRecord.lockedUntil).getTime();
        if (lockExpiry > Date.now()) {
          const remainingMinutes = Math.ceil((lockExpiry - Date.now()) / (60 * 1000));
          return NextResponse.json(
            { success: false, error: `Account locked due to 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` },
            { status: 403 }
          );
        }
      }

      const isUserMatch = u.toLowerCase() === expectedUsername.toLowerCase();
      const isPassMatch = await bcrypt.compare(p, expectedPassHash).catch(() => false);
      const isPin4Match = await bcrypt.compare(p4, expectedPin4Hash).catch(() => false);
      const isPin8Match = await bcrypt.compare(p8, expectedPin8Hash).catch(() => false);

      if (!isUserMatch || !isPassMatch || !isPin4Match || !isPin8Match) {
        const newAttempts = (adminRecord.failedAttempts || 0) + 1;
        const updatePayload: Record<string, any> = { failedAttempts: newAttempts };
        if (newAttempts >= 5) {
          updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await prisma.superAdminCredentials.update({
          where: { id: 'primary' },
          data: updatePayload,
        });
        return NextResponse.json({ success: false, error: 'Invalid master credentials. Access denied.' }, { status: 401 });
      }

      // Success
      await prisma.superAdminCredentials.update({
        where: { id: 'primary' },
        data: { failedAttempts: 0, lockedUntil: null },
      });

      const token = await signSession({
        sub: expectedUsername,
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
      }, 86400);

      cookies().set(SUPER_ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });

      return NextResponse.json({
        success: true,
        message: 'Master Super Admin authentication verified successfully.',
        user: { role: 'SUPER_ADMIN', username: expectedUsername },
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: UPDATE SUPER ADMIN CREDENTIALS
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'update-super-admin') {
      const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      const session = await verifySession(saToken);
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { newUsername, newPassword, newPin4, newPin8 } = body;
      if (!newUsername || !newPassword || !newPin4 || !newPin8) {
        return NextResponse.json(
          { success: false, error: 'New Username, Password, 4-digit PIN, and 8-digit PIN are required.' },
          { status: 400 }
        );
      }

      const passHash = await hashCredential(newPassword.trim());
      const pin4Hash = await hashCredential(newPin4.trim());
      const pin8Hash = await hashCredential(newPin8.trim());

      await prisma.superAdminCredentials.upsert({
        where: { id: 'primary' },
        update: {
          username: newUsername.trim(),
          passwordHash: passHash,
          pin4Hash,
          pin8Hash,
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        },
        create: {
          id: 'primary',
          username: newUsername.trim(),
          passwordHash: passHash,
          pin4Hash,
          pin8Hash,
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Super Admin Master Credentials successfully hashed and updated in PostgreSQL!',
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: VERIFY STAFF CREDENTIALS
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const { businessSlug, role, password, pin } = body;
      const rawSlug = (businessSlug || '').trim();
      const slug = rawSlug === 'crockery-rental' ? 'horeca-essentials' : (rawSlug === 'printbooth' ? 'adjs' : rawSlug);
      const roleName = (role || '').trim();
      const pass = (password || '').trim();
      const p = (pin || '').trim();

      if (!slug || !roleName || !pass) {
        return NextResponse.json({ success: false, error: 'Please select a role and enter your password.' }, { status: 400 });
      }

      const b = await prisma.business.findFirst({
        where: { slug, isActive: true },
        select: { id: true, isActive: true },
      });

      if (!b || !b.isActive) {
        return NextResponse.json({ success: false, error: 'Business workspace not found or inactive.' }, { status: 404 });
      }

      const dbRole = await prisma.businessRole.findFirst({
        where: {
          businessId: b.id,
          roleId: roleName,
        },
      });

      if (!dbRole) {
        return NextResponse.json({ success: false, error: `Role "${roleName}" not configured.` }, { status: 404 });
      }

      // Check lockout
      if (dbRole.lockedUntil && new Date(dbRole.lockedUntil).getTime() > Date.now()) {
        const remainingMinutes = Math.ceil((new Date(dbRole.lockedUntil).getTime() - Date.now()) / (60 * 1000));
        return NextResponse.json({ success: false, error: `Account locked after 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` }, { status: 403 });
      }

      const passCheck = await verifyCredential(pass, dbRole.password);
      const isPinRequired = !!(dbRole.pin && dbRole.pin.trim());
      const pinCheck = isPinRequired && p ? await verifyCredential(p, dbRole.pin) : { isValid: !isPinRequired || !dbRole.pin, needsRehash: false };

      const isPassCorrect = passCheck.isValid;
      const isPinCorrect = !isPinRequired || pinCheck.isValid;

      if (!isPassCorrect || !isPinCorrect) {
        const attempts = (dbRole.failedAttempts || 0) + 1;
        const updatePayload: Record<string, any> = { failedAttempts: attempts };
        if (attempts >= 5) {
          updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await prisma.businessRole.update({
          where: { id: dbRole.id },
          data: updatePayload,
        });

        const remaining = 5 - attempts;
        const warning = remaining > 0 && remaining <= 3 ? ` (${remaining} attempt(s) remaining)` : '';
        return NextResponse.json({ success: false, error: `Incorrect password or PIN for role "${roleName}".${warning}` }, { status: 401 });
      }

      // Reset attempts
      await prisma.businessRole.update({
        where: { id: dbRole.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });

      const token = await signSession({
        sub: roleName,
        role: roleName,
        businessSlug: slug,
        isSuperAdmin: false,
      }, 43200);

      cookies().set(USER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 43200,
      });

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        role: roleName,
        businessSlug: slug,
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: UPDATE ROLE CREDENTIALS (SUPER ADMIN)
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'update') {
      const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      const session = await verifySession(saToken);
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { businessSlug, role, newPassword, newPin } = body;
      if (!role || !newPassword) {
        return NextResponse.json({ success: false, error: 'Role and new password are required' }, { status: 400 });
      }

      const b = await prisma.business.findFirst({
        where: { slug: businessSlug },
        select: { id: true },
      });
      if (!b) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

      const passwordHash = await hashCredential(newPassword);
      const pinHash = newPin && newPin.trim() ? await hashCredential(newPin) : '';

      const updated = await prisma.businessRole.updateMany({
        where: {
          businessId: b.id,
          roleId: role,
        },
        data: {
          password: passwordHash,
          pin: pinHash,
          updatedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
        },
      });

      if (updated.count === 0) {
        // If role doesn't exist yet, create it
        await prisma.businessRole.create({
          data: {
            businessId: b.id,
            roleId: role,
            label: role,
            password: passwordHash,
            pin: pinHash,
            failedAttempts: 0,
            lockedUntil: null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Credentials for "${role}" updated in PostgreSQL.`,
        lastUpdated: new Date().toISOString(),
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: BATCH UPDATE (SUPER ADMIN)
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'batch-update') {
      const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      const session = await verifySession(saToken);
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { businessSlug, credentials } = body;
      const b = await prisma.business.findFirst({
        where: { slug: businessSlug },
        select: { id: true },
      });
      if (!b) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

      for (const item of (credentials || [])) {
        if (!item.role || !item.password) continue;
        const passwordHash = await hashCredential(item.password);
        const pinHash = item.pin && item.pin.trim() ? await hashCredential(item.pin) : '';

        const updated = await prisma.businessRole.updateMany({
          where: {
            businessId: b.id,
            roleId: item.role,
          },
          data: {
            password: passwordHash,
            pin: pinHash,
            updatedAt: new Date(),
            failedAttempts: 0,
            lockedUntil: null,
          },
        });

        if (updated.count === 0) {
          await prisma.businessRole.create({
            data: {
              businessId: b.id,
              roleId: item.role,
              label: item.label || item.role,
              department: item.department || 'General',
              password: passwordHash,
              pin: pinHash,
              failedAttempts: 0,
              lockedUntil: null,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `All credentials for ${businessSlug} updated successfully in PostgreSQL.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in role-credentials POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
