import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { getCurrentSuperAdminSession } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessSlug = searchParams.get('businessSlug');

    if (!businessSlug) {
      return NextResponse.json({ success: false, error: 'businessSlug required' }, { status: 400 });
    }

    const canonicalSlug = businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug);

    const business = await prisma.business.findFirst({
      where: { slug: canonicalSlug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Fetch all tabs for this business
    const tabs = await prisma.tab.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch all roles for this business
    const roles = await prisma.businessRole.findMany({
      where: { businessId: business.id },
      select: { id: true, roleId: true, label: true, department: true },
    });

    // Fetch existing role_tab_access
    const access = await prisma.roleTabAccess.findMany({
      where: { businessId: business.id },
    });

    const serializedTabs = tabs.map((t) => ({
      id: t.id,
      business_id: t.businessId,
      tab_key: t.tabKey,
      label: t.label,
      description: t.description,
      path: t.path,
      sort_order: t.sortOrder,
      is_active: t.isActive,
      created_at: t.createdAt.toISOString(),
    }));

    const serializedRoles = roles.map((r) => ({
      id: r.id,
      role_id: r.roleId,
      label: r.label,
      department: r.department,
    }));

    const serializedAccess = access.map((a) => ({
      id: a.id,
      business_id: a.businessId,
      role_id: a.roleId,
      tab_id: a.tabId,
      can_view: a.canView,
      can_edit: a.canEdit,
      created_at: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      tabs: serializedTabs,
      roles: serializedRoles,
      access: serializedAccess,
    });
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
    const { businessSlug, roleId, tabAccessList } = body;

    if (!businessSlug || !roleId || !Array.isArray(tabAccessList)) {
      return NextResponse.json({ success: false, error: 'businessSlug, roleId, and tabAccessList required' }, { status: 400 });
    }

    const canonicalSlug = businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug);

    const business = await prisma.business.findFirst({
      where: { slug: canonicalSlug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Delete existing access for this role
    await prisma.roleTabAccess.deleteMany({
      where: {
        businessId: business.id,
        roleId,
      },
    });

    // Insert updated access
    if (tabAccessList.length > 0) {
      const inserts = tabAccessList.map((item: any) => ({
        businessId: business.id,
        roleId,
        tabId: item.tabId,
        canView: item.canView ?? true,
        canEdit: item.canEdit ?? true,
      }));

      await prisma.roleTabAccess.createMany({
        data: inserts,
      });
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorType: 'SUPER_ADMIN',
          actorIdentifier: session.username || 'SUPER_ADMIN',
          businessSlug,
          action: 'role.tab_access_updated',
          metadata: { roleId, count: tabAccessList.length },
        },
      });
    } catch {}

    return NextResponse.json({ success: true, message: 'Tab access saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
