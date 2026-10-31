import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getAdminClient } from '../../../../../lib/supabase/admin';
import { signSession, SUPER_ADMIN_COOKIE } from '../../../../../lib/authSession';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, pin4, pin8 } = body;

    const u = (username || '').trim();
    const p = (password || '').trim();
    const p4 = (pin4 || '').trim();
    const p8 = (pin8 || '').trim();

    if (!u || !p || !p4 || !p8) {
      return NextResponse.json(
        { success: false, error: 'All 4 verification credentials (Username, Password, 4-digit PIN, 8-digit PIN) are required.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const { data: adminRecord, error } = await admin
      .from('super_admin_credentials')
      .select('*')
      .eq('id', 'primary')
      .single();

    if (error || !adminRecord) {
      console.error('Supabase super_admin_credentials query error:', error?.message);
      return NextResponse.json(
        { success: false, error: 'Database not initialized. Table "super_admin_credentials" not found in Supabase. Please run scripts/supabase_master_setup.sql in your Supabase SQL editor first.' },
        { status: 503 }
      );
    }

    const expectedUsername = adminRecord.username;
    const expectedPassHash = adminRecord.password_hash;
    const expectedPin4Hash = adminRecord.pin4_hash;
    const expectedPin8Hash = adminRecord.pin8_hash;

    // Check lockout
    if (adminRecord?.locked_until) {
      const lockExpiry = new Date(adminRecord.locked_until).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json(
          { success: false, error: `Account locked due to 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` },
          { status: 403 }
        );
      }
    }

    const isUserMatch = u.toLowerCase() === expectedUsername.toLowerCase() || u.toLowerCase() === 'madhurdhadve7@gmail.com' || u.toLowerCase() === 'madyydam';
    const isPassMatch = bcrypt.compareSync(p, expectedPassHash);
    const isPin4Match = bcrypt.compareSync(p4, expectedPin4Hash);
    const isPin8Match = bcrypt.compareSync(p8, expectedPin8Hash);

    if (!isUserMatch || !isPassMatch || !isPin4Match || !isPin8Match) {
      if (adminRecord) {
        const newAttempts = (adminRecord.failed_attempts || 0) + 1;
        const updatePayload: Record<string, any> = { failed_attempts: newAttempts };
        if (newAttempts >= 5) {
          updatePayload.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        await admin.from('super_admin_credentials').update(updatePayload).eq('id', 'primary');
      }

      return NextResponse.json(
        { success: false, error: 'Authentication failed. One or more factors did not match.' },
        { status: 401 }
      );
    }

    // Success! Reset failed attempts
    if (adminRecord) {
      await admin
        .from('super_admin_credentials')
        .update({ failed_attempts: 0, locked_until: null })
        .eq('id', 'primary');
    }

    // Sign session token and set HTTP-only cookie
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

    // Audit log
    try {
      await admin.from('audit_logs').insert({
        actor_type: 'SUPER_ADMIN',
        actor_identifier: expectedUsername,
        action: 'super_admin.login',
        entity_type: 'auth',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
        user_agent: req.headers.get('user-agent') || 'Browser',
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch {
      // Ignore if table not created yet
    }

    return NextResponse.json({
      success: true,
      message: 'Master Super Admin authentication verified successfully.',
      redirect: '/super-admin/credentials',
    });
  } catch (err: any) {
    console.error('Super admin login error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
