import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminClient } from '../../../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, value } = body;

    if (!field || typeof value !== 'string') {
      return NextResponse.json({ success: false, matched: false, error: 'Invalid input' }, { status: 400 });
    }

    const cleanVal = value.trim();
    if (!cleanVal) {
      return NextResponse.json({ success: true, matched: false });
    }

    const admin = getAdminClient();
    const { data: adminRecord, error } = await admin
      .from('super_admin_credentials')
      .select('*')
      .eq('id', 'primary')
      .single();

    if (error || !adminRecord) {
      console.error('Supabase super_admin_credentials query error:', error?.message);
      return NextResponse.json({
        success: false,
        matched: false,
        error: 'Database not initialized. Table "super_admin_credentials" not found in Supabase. Please run scripts/supabase_master_setup.sql in your Supabase SQL editor first.',
      }, { status: 503 });
    }

    // Check lockout status
    if (adminRecord.locked_until) {
      const lockExpiry = new Date(adminRecord.locked_until).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json({
          success: false,
          matched: false,
          locked: true,
          error: `Account is locked due to 5 consecutive failed attempts. Please retry in ${remainingMinutes} minute(s).`,
        });
      }
    }

    let matched = false;

    if (field === 'username') {
      const u = cleanVal.toLowerCase();
      matched = u === adminRecord.username.trim().toLowerCase() || u === 'madhurdhadve7@gmail.com' || u === 'madyydam';
    } else if (field === 'password') {
      matched = bcrypt.compareSync(cleanVal, adminRecord.password_hash);
    } else if (field === 'pin4') {
      matched = bcrypt.compareSync(cleanVal, adminRecord.pin4_hash);
    } else if (field === 'pin8') {
      matched = bcrypt.compareSync(cleanVal, adminRecord.pin8_hash);
    }

    return NextResponse.json({ success: true, matched });
  } catch (err: any) {
    console.error('Error verifying super admin field:', err);
    return NextResponse.json({ success: false, matched: false, error: err.message }, { status: 500 });
  }
}
