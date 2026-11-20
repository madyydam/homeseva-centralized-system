import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { getCurrentSuperAdminSession } from '@/lib/authSession';
import { hashCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessSlug = searchParams.get('businessSlug');

    const canonicalSlug = businessSlug
      ? (businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug))
      : undefined;

    const roles = await prisma.businessRole.findMany({
      ...(canonicalSlug ? { where: { business: { slug: canonicalSlug } } } : {}),
      include: {
        business: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { roleId: 'asc' },
    });

    const sanitizedRoles = roles.map((r) => ({
      id: r.id,
      role_id: r.roleId,
      label: r.label,
      description: r.description,
      department: r.department,
      is_active: r.isActive,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
      businesses: r.business,
      hasPassword: !!(r.password && r.password.trim()),
      hasPin: !!(r.pin && r.pin.trim()),
      password: '••••••••',
      pin: '••••',
    }));

    return NextResponse.json({ success: true, roles: sanitizedRoles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, businessSlug, roleId, label, description, department, password, pin } = body;

    if (action === 'create-role') {
      if (!businessSlug || !roleId?.trim() || !password?.trim()) {
        return NextResponse.json({ success: false, error: 'businessSlug, roleId, and password are required.' }, { status: 400 });
      }

      const canonicalSlug = businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug);

      const b = await prisma.business.findFirst({
        where: { slug: canonicalSlug },
        select: { id: true },
      });

      if (!b) {
        return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
      }

      const passwordHash = await hashCredential(password);
      const pinHash = await hashCredential(pin || '1111');

      const newRole = await prisma.businessRole.create({
        data: {
          businessId: b.id,
          roleId: roleId.trim(),
          label: (label || roleId).trim(),
          description: description?.trim() || '',
          department: department?.trim() || 'General',
          password: passwordHash,
          pin: pinHash,
          isActive: true,
        },
      });

      try {
        await prisma.auditLog.create({
          data: {
            actorType: 'SUPER_ADMIN',
            actorIdentifier: session.username || 'SUPER_ADMIN',
            businessSlug,
            action: 'role.created',
            entityType: 'role',
            entityId: newRole.id,
            metadata: { roleId, department },
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        role: {
          id: newRole.id,
          role_id: newRole.roleId,
          label: newRole.label,
          description: newRole.description,
          department: newRole.department,
          is_active: newRole.isActive,
          password: '••••••••',
          pin: '••••',
        },
      });
    }

    if (action === 'delete-role') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Role ID is required.' }, { status: 400 });
      }

      await prisma.businessRole.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, message: 'Role deleted successfully.' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
