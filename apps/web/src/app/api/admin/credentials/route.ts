import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@homeseva/db';
import { getCurrentSuperAdminSession } from '@/lib/authSession';
import { hashCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // 1. Fetch Super Admin credentials info
    const superAdminRow = await prisma.superAdminCredentials.findFirst({
      where: { id: 'primary' },
    });

    if (!superAdminRow) {
      return NextResponse.json({
        success: false,
        error: 'Super admin credentials table not found. Please execute seed script first.',
      }, { status: 503 });
    }

    const superAdminConfig = {
      username: superAdminRow.username,
      hasPassword: !!superAdminRow.passwordHash,
      hasPin4: !!superAdminRow.pin4Hash,
      hasPin8: !!superAdminRow.pin8Hash,
      lastUpdated: superAdminRow.updatedAt.toISOString(),
    };

    if (action === 'get-super-admin') {
      return NextResponse.json({ success: true, superAdmin: superAdminConfig });
    }

    // 2. Fetch all businesses with their roles (MASKED: NO PASSWORDS OR PINS EVER RETURNED)
    const businesses = await prisma.business.findMany({
      orderBy: { name: 'asc' },
      include: {
        businessRoles: {
          orderBy: { roleId: 'asc' },
        },
      },
    });

    const seenSlugs = new Set<string>();
    const companies: any[] = [];
    for (const b of businesses) {
      if (b.slug === 'printbooth' && seenSlugs.has('adjs')) continue;
      if (b.slug === 'adjs' && seenSlugs.has('printbooth')) continue;
      if (seenSlugs.has(b.slug)) continue;

      seenSlugs.add(b.slug);

      let canonicalSlug = b.slug;
      let displayName = b.name;
      let subcompanies: any[] = [];

      if (b.slug === 'adjs' || b.slug === 'printbooth') {
        canonicalSlug = 'adjs';
        displayName = 'ADJS';
        subcompanies = [
          { slug: 'printbooth', name: 'PRINTBOOTH™', subtitle: 'Smart Self-Service Printing Kiosks', badge: 'Self-Service Kiosk' },
        ];
      } else if (b.slug === 'gentle-hair-wigs') {
        subcompanies = [
          { slug: 'viman-nagar', name: 'Studio of Viman Nagar', subtitle: 'Phoenix Marketcity corridor' },
          { slug: 'ravet', name: 'Studio of Ravet', subtitle: 'PCMC Lounge' },
          { slug: 'kolhapur', name: 'Studio of Kolhapur', subtitle: 'South Maharashtra' },
        ];
      } else if (b.slug === 'horeca-essentials') {
        subcompanies = [
          { slug: 'essentials-sales', name: 'Essentials Sales', subtitle: 'Commercial Kitchenware Supply' },
          { slug: 'crockery-rental', name: 'Crockery Rental', subtitle: 'Banquet & Event Hire' },
        ];
      }

      companies.push({
        businessId: b.id,
        businessSlug: canonicalSlug,
        businessName: displayName,
        subcompanies,
        roles: (b.businessRoles || []).map((r) => ({
          id: r.id,
          role: r.roleId,
          label: r.label || r.roleId,
          department: r.department || 'General',
          hasPassword: !!(r.password && r.password.trim()),
          hasPin: !!(r.pin && r.pin.trim()),
          lastUpdated: r.updatedAt.toISOString(),
        })),
      });
    }

    return NextResponse.json({
      success: true,
      companies,
      superAdmin: superAdminConfig,
    });
  } catch (err: any) {
    console.error('Error fetching admin credentials:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION 1: UPDATE SUPER ADMIN CREDENTIALS (BCRYPT HASHED)
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'update-super-admin') {
      const { newUsername, newPassword, newPin4, newPin8 } = body;

      if (!newUsername?.trim() || !newPassword?.trim() || !newPin4?.trim() || !newPin8?.trim()) {
        return NextResponse.json(
          { success: false, error: 'All 4 fields (Username, Password, 4-digit PIN, 8-digit PIN) are mandatory.' },
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

      try {
        await prisma.auditLog.create({
          data: {
            actorType: 'SUPER_ADMIN',
            actorIdentifier: session.username || 'SUPER_ADMIN',
            action: 'super_admin.credentials_updated',
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: req.headers.get('user-agent') || 'Browser',
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Super Admin master 4-factor credentials securely updated and hashed.',
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION 2: UPDATE SINGLE ROLE PASSWORD & PIN
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'update') {
      const { businessSlug, role, newPassword, newPin } = body;

      if (!businessSlug || !role || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'businessSlug, role, and newPassword are required.' },
          { status: 400 }
        );
      }

      const canonicalSlug = businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug);

      const b = await prisma.business.findFirst({
        where: { slug: canonicalSlug },
        select: { id: true },
      });

      if (!b) {
        return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
      }

      const passwordHash = await hashCredential(newPassword);
      const pinHash = newPin && newPin.trim() ? await hashCredential(newPin) : '';

      const updatedRole = await prisma.businessRole.updateMany({
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

      if (updatedRole.count === 0) {
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

      try {
        await prisma.auditLog.create({
          data: {
            actorType: 'SUPER_ADMIN',
            actorIdentifier: session.username || 'SUPER_ADMIN',
            businessSlug,
            action: 'role.credentials_updated',
            metadata: { role },
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Credentials for "${role}" updated successfully.`,
        lastUpdated: new Date().toISOString(),
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION 3: BATCH UPDATE ALL ROLES FOR A COMPANY
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'batch-update') {
      const { businessSlug, credentials } = body;

      if (!businessSlug || !Array.isArray(credentials)) {
        return NextResponse.json({ success: false, error: 'businessSlug and credentials array required.' }, { status: 400 });
      }

      const canonicalSlug = businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug);

      const b = await prisma.business.findFirst({
        where: { slug: canonicalSlug },
        select: { id: true },
      });

      if (!b) {
        return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
      }

      for (const item of credentials) {
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
              password: passwordHash,
              pin: pinHash,
              failedAttempts: 0,
              lockedUntil: null,
            },
          });
        }
      }

      try {
        await prisma.auditLog.create({
          data: {
            actorType: 'SUPER_ADMIN',
            actorIdentifier: session.username || 'SUPER_ADMIN',
            businessSlug,
            action: 'role.credentials_batch_updated',
            metadata: { count: credentials.length },
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `All role credentials for ${businessSlug} updated successfully.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error updating admin credentials:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
