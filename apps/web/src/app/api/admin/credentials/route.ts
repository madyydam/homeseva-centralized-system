import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { getCurrentSuperAdminSession } from '../../../../lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const admin = getAdminClient();

    // 1. Fetch Super Admin credentials info
    const { data: superAdminRow, error: saError } = await admin
      .from('super_admin_credentials')
      .select('username, updated_at')
      .eq('id', 'primary')
      .single();

    if (saError || !superAdminRow) {
      return NextResponse.json({
        success: false,
        error: 'Super admin credentials table not found in Supabase. Please execute scripts/supabase_master_setup.sql first.',
      }, { status: 503 });
    }

    const superAdminConfig = {
      username: superAdminRow.username,
      hasPassword: !!superAdminRow.password_hash,
      hasPin4: !!superAdminRow.pin4_hash,
      hasPin8: !!superAdminRow.pin8_hash,
      lastUpdated: superAdminRow.updated_at,
    };

    if (action === 'get-super-admin') {
      return NextResponse.json({ success: true, superAdmin: superAdminConfig });
    }

    // 2. Fetch all businesses with their roles (MASKED: NO PASSWORDS OR PINS EVER RETURNED)
    const { data: businesses, error } = await admin
      .from('businesses')
      .select(`
        id, name, slug, subtitle, is_active,
        business_roles (
          id, role_id, label, description, department, password, pin, updated_at
        )
      `)
      .order('name');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const companies = (businesses || []).map((b: any) => ({
      businessId: b.id,
      businessSlug: b.slug,
      businessName: b.name,
      roles: (b.business_roles || []).map((r: any) => ({
        id: r.id,
        role: r.role_id,
        label: r.label || r.role_id,
        department: r.department || 'General',
        // CRITICAL SECURITY ENFORCEMENT: Never send plaintext passwords or pins to client!
        hasPassword: !!(r.password && r.password.trim()),
        hasPin: !!(r.pin && r.pin.trim()),
        lastUpdated: r.updated_at,
      })),
    }));

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
    const admin = getAdminClient();

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

      const passHash = bcrypt.hashSync(newPassword.trim(), 10);
      const pin4Hash = bcrypt.hashSync(newPin4.trim(), 10);
      const pin8Hash = bcrypt.hashSync(newPin8.trim(), 10);

      const { error: upsertErr } = await admin
        .from('super_admin_credentials')
        .upsert({
          id: 'primary',
          username: newUsername.trim(),
          password_hash: passHash,
          pin4_hash: pin4Hash,
          pin8_hash: pin8Hash,
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        });

      if (upsertErr) {
        return NextResponse.json({ success: false, error: upsertErr.message }, { status: 500 });
      }

      // Audit log
      try {
        await admin.from('audit_logs').insert({
          actor_type: 'SUPER_ADMIN',
          actor_identifier: session.username,
          action: 'super_admin.credentials_updated',
          ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
          user_agent: req.headers.get('user-agent') || 'Browser',
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

      // Find business
      const { data: b } = await admin
        .from('businesses')
        .select('id')
        .eq('slug', businessSlug)
        .single();

      if (!b) {
        return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
      }

      const now = new Date().toISOString();
      const { data: updatedRole, error: roleErr } = await admin
        .from('business_roles')
        .update({
          password: newPassword.trim(),
          pin: (newPin || '').trim(),
          updated_at: now,
          failed_attempts: 0,
          locked_until: null,
        })
        .eq('business_id', b.id)
        .eq('role_id', role)
        .select()
        .single();

      if (roleErr) {
        return NextResponse.json({ success: false, error: roleErr.message }, { status: 500 });
      }

      try {
        await admin.from('audit_logs').insert({
          actor_type: 'SUPER_ADMIN',
          actor_identifier: session.username,
          business_slug: businessSlug,
          action: 'role.credentials_updated',
          entity_type: 'role',
          entity_id: updatedRole?.id,
          metadata: { role },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Credentials for "${role}" updated successfully.`,
        lastUpdated: now,
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

      const { data: b } = await admin
        .from('businesses')
        .select('id')
        .eq('slug', businessSlug)
        .single();

      if (!b) {
        return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
      }

      const now = new Date().toISOString();
      for (const item of credentials) {
        if (!item.role || !item.password) continue;
        await admin
          .from('business_roles')
          .update({
            password: item.password.trim(),
            pin: (item.pin || '').trim(),
            updated_at: now,
            failed_attempts: 0,
            locked_until: null,
          })
          .eq('business_id', b.id)
          .eq('role_id', item.role);
      }

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
