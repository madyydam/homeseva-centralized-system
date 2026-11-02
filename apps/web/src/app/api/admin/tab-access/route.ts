import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
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

    const admin = getAdminClient();
    const { data: business } = await admin
      .from('businesses')
      .select('id')
      .eq('slug', businessSlug)
      .single();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Fetch all tabs for this business
    const { data: tabs } = await admin
      .from('tabs')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order');

    // Fetch all roles for this business
    const { data: roles } = await admin
      .from('business_roles')
      .select('id, role_id, label, department')
      .eq('business_id', business.id);

    // Fetch existing role_tab_access
    const { data: access } = await admin
      .from('role_tab_access')
      .select('*')
      .eq('business_id', business.id);

    return NextResponse.json({
      success: true,
      tabs: tabs || [],
      roles: roles || [],
      access: access || [],
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

    const admin = getAdminClient();
    const { data: business } = await admin
      .from('businesses')
      .select('id')
      .eq('slug', businessSlug)
      .single();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Delete existing access for this role
    await admin
      .from('role_tab_access')
      .delete()
      .eq('business_id', business.id)
      .eq('role_id', roleId);

    // Insert updated access
    if (tabAccessList.length > 0) {
      const inserts = tabAccessList.map((item: any) => ({
        business_id: business.id,
        role_id: roleId,
        tab_id: item.tabId,
        can_view: item.canView ?? true,
        can_edit: item.canEdit ?? true,
      }));

      await admin.from('role_tab_access').insert(inserts);
    }

    // Audit log
    try {
      await admin.from('audit_logs').insert({
        actor_type: 'SUPER_ADMIN',
        actor_identifier: session.username,
        business_slug: businessSlug,
        action: 'role.tab_access_updated',
        metadata: { roleId, count: tabAccessList.length },
      });
    } catch {}

    return NextResponse.json({ success: true, message: 'Tab access saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
