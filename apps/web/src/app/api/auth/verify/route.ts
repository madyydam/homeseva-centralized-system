import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '../../../../lib/supabase/admin';
import { signSession, USER_SESSION_COOKIE } from '../../../../lib/authSession';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, role, password, pin } = body;

    const slug = (businessSlug || '').trim();
    const roleId = (role || '').trim();
    const enteredPass = (password || '').trim();
    const enteredPin = (pin || '').trim();

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Business slug is required.' }, { status: 400 });
    }
    if (!roleId) {
      return NextResponse.json({ success: false, error: 'Please select or enter your role.' }, { status: 400 });
    }
    if (!enteredPass) {
      return NextResponse.json({ success: false, error: 'Please enter your password.' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Query business and role from Supabase
    const { data: business } = await admin
      .from('businesses')
      .select('id, slug, name, is_active')
      .eq('slug', slug)
      .single();

    if (!business) {
      return NextResponse.json({
        success: false,
        error: `Business "${slug}" not found in Supabase. Please ensure scripts/supabase_master_setup.sql has been run.`,
      }, { status: 503 });
    }

    if (!business.is_active) {
      return NextResponse.json({ success: false, error: 'This business workspace is currently inactive.' }, { status: 403 });
    }

    const { data: dbRole, error: roleError } = await admin
      .from('business_roles')
      .select('*')
      .eq('business_id', business.id)
      .eq('role_id', roleId)
      .single();

    if (roleError || !dbRole) {
      return NextResponse.json({
        success: false,
        error: `Role "${roleId}" not found for business "${slug}" in Supabase. Please configure this role in Supabase first.`,
      }, { status: 404 });
    }

    const targetRole = dbRole;

    // If found in Supabase DB:
    if (targetRole) {
      // 1. Check lockout
      if (targetRole.locked_until) {
        const lockExpiry = new Date(targetRole.locked_until).getTime();
        const now = Date.now();
        if (lockExpiry > now) {
          const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
          return NextResponse.json(
            { success: false, error: `Account locked after 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` },
            { status: 403 }
          );
        }
      }

      // 2. Validate password & pin (Strict 1:1 security verification against Supabase database)
      const isPassCorrect = enteredPass === targetRole.password.trim();
      const isPinCorrect = !targetRole.pin || enteredPin === targetRole.pin.trim();

      if (!isPassCorrect || !isPinCorrect) {
        const newAttempts = (targetRole.failed_attempts || 0) + 1;
        const updatePayload: Record<string, any> = { failed_attempts: newAttempts };

        if (newAttempts >= 5) {
          updatePayload.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }

        await admin.from('business_roles').update(updatePayload).eq('id', targetRole.id);

        const remaining = 5 - newAttempts;
        const errMsg = !isPassCorrect
          ? `Incorrect password for role "${roleId}".`
          : `Incorrect 4-digit security PIN for role "${roleId}".`;

        const warningMsg = remaining > 0 && remaining <= 3
          ? ` (${remaining} attempt(s) remaining before 15-minute lock)`
          : '';

        return NextResponse.json({ success: false, error: `${errMsg}${warningMsg}` }, { status: 401 });
      }

      // Success! Reset attempts
      await admin
        .from('business_roles')
        .update({ failed_attempts: 0, locked_until: null })
        .eq('id', targetRole.id);

      // Set cookie via authSession
      const token = await signSession({
        sub: roleId,
        role: roleId,
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

      // Audit log
      try {
        await admin.from('audit_logs').insert({
          actor_type: 'STAFF',
          actor_identifier: roleId,
          business_slug: slug,
          action: 'staff.login',
          entity_type: 'role',
          entity_id: targetRole.id,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
          user_agent: req.headers.get('user-agent') || 'Browser',
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        businessSlug: slug,
        role: roleId,
      });
    }

    return NextResponse.json({
      success: false,
      error: `Role "${roleId}" not configured or credentials incorrect in Supabase.`,
    }, { status: 401 });
  } catch (err: any) {
    console.error('Staff verify error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
