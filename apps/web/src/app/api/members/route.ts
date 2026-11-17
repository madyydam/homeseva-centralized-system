import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getCurrentSuperAdminSession } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    // Allow super admin or authenticated staff/owner viewing role members
    const { searchParams } = new URL(req.url);
    let businessId = searchParams.get('businessId');
    const businessSlug = searchParams.get('businessSlug');
    const roleId = searchParams.get('roleId');

    const admin = getAdminClient();

    if (!businessId && businessSlug) {
      const { data: biz } = await admin
        .from('businesses')
        .select('id')
        .eq('slug', businessSlug)
        .maybeSingle();
      if (biz?.id) {
        businessId = biz.id;
      }
    }

    let query = admin.from('role_members').select('*').order('created_at', { ascending: true });
    if (businessId) query = query.eq('business_id', businessId);
    if (roleId) query = query.eq('role_id', roleId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // For authenticated Super Admin, return the real passwords and PINs so the console eye-toggle can view/reveal them
    const isSuperAdmin = !!session;
    const members = (data || []).map((m: any) => ({
      ...m,
      password: isSuperAdmin ? m.password : '••••••••',
      pin: isSuperAdmin ? m.pin : '••••',
    }));

    return NextResponse.json({ success: true, members });
  } catch (err: any) {
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
    const { business_id, role_id, name, email, password, pin } = body;

    if (!business_id || !role_id || !name || !email || !password || !pin) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required: business_id, role_id, name, email, password, pin',
      }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('role_members')
      .insert({
        business_id,
        role_id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        pin: pin.trim(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      member: { ...data, password: '••••••••', pin: '••••' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, password, pin, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member id is required' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updatePayload.name = name.trim();
    if (email !== undefined) updatePayload.email = email.trim().toLowerCase();
    if (password !== undefined && password !== '' && password !== '••••••••') {
      updatePayload.password = password.trim();
    }
    if (pin !== undefined && pin !== '' && pin !== '••••') {
      updatePayload.pin = pin.trim();
    }
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('role_members')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      member: { ...data, password: '••••••••', pin: '••••' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member id is required' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin.from('role_members').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
