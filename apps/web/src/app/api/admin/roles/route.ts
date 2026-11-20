import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';
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

    const admin = getAdminClient();
    let query = admin
      .from('business_roles')
      .select(`
        id, role_id, label, description, department, is_active, password, pin, created_at, updated_at,
        businesses!inner(id, name, slug)
      `);

    if (businessSlug) {
      const canonicalSlug = businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug);
      query = query.eq('businesses.slug', canonicalSlug);
    }

    const { data: roles, error } = await query.order('role_id');
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const sanitizedRoles = (roles || []).map((r: any) => ({
      ...r,
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
    const admin = getAdminClient();

    if (action === 'create-role') {
      if (!businessSlug || !roleId?.trim() || !password?.trim()) {
        return NextResponse.json({ success: false, error: 'businessSlug, roleId, and password are required.' }, { status: 400 });
      }

      const canonicalSlug = businessSlug === 'crockery-rental' ? 'horeca-essentials' : (businessSlug === 'printbooth' ? 'adjs' : businessSlug);

      const { data: b } = await admin
        .from('businesses')
        .select('id')
        .eq('slug', canonicalSlug)
        .single();

      if (!b) {
        return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
      }

      const passwordHash = await hashCredential(password);
      const pinHash = await hashCredential(pin || '1111');

      const { data: newRole, error } = await admin
        .from('business_roles')
        .insert({
          business_id: b.id,
          role_id: roleId.trim(),
          label: (label || roleId).trim(),
          description: description?.trim() || '',
          department: department?.trim() || 'General',
          password: passwordHash,
          pin: pinHash,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      try {
        await admin.from('audit_logs').insert({
          actor_type: 'SUPER_ADMIN',
          actor_identifier: session.username,
          business_slug: businessSlug,
          action: 'role.created',
          entity_type: 'role',
          entity_id: newRole.id,
          metadata: { roleId, department },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        role: { ...newRole, password: '••••••••', pin: '••••' },
      });
    }

    if (action === 'delete-role') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Role ID is required.' }, { status: 400 });
      }

      const { error } = await admin.from('business_roles').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Role deleted successfully.' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
