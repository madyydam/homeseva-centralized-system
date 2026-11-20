import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@homeseva/db';
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

    const adminRecord = await prisma.superAdminCredentials.findFirst({
      where: { id: 'primary' },
    });

    if (!adminRecord) {
      console.error('super_admin_credentials record not found in PostgreSQL');
      return NextResponse.json(
        { success: false, error: 'Super Admin credentials not initialized in database. Please run seed script first.' },
        { status: 503 }
      );
    }

    const expectedUsername = adminRecord.username;
    const expectedPassHash = adminRecord.passwordHash;
    const expectedPin4Hash = adminRecord.pin4Hash;
    const expectedPin8Hash = adminRecord.pin8Hash;

    // Check lockout
    if (adminRecord.lockedUntil) {
      const lockExpiry = new Date(adminRecord.lockedUntil).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json(
          { success: false, error: `Account locked due to 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` },
          { status: 403 }
        );
      }
    }

    const isUserMatch = u.toLowerCase() === expectedUsername.toLowerCase();
    const isPassMatch = bcrypt.compareSync(p, expectedPassHash);
    const isPin4Match = bcrypt.compareSync(p4, expectedPin4Hash);
    const isPin8Match = bcrypt.compareSync(p8, expectedPin8Hash);

    if (!isUserMatch || !isPassMatch || !isPin4Match || !isPin8Match) {
      const newAttempts = (adminRecord.failedAttempts || 0) + 1;
      const updatePayload: Record<string, any> = { failedAttempts: newAttempts };
      if (newAttempts >= 5) {
        updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await prisma.superAdminCredentials.update({
        where: { id: 'primary' },
        data: updatePayload,
      });

      return NextResponse.json(
        { success: false, error: 'Authentication failed. One or more factors did not match.' },
        { status: 401 }
      );
    }

    // Success! Reset failed attempts
    await prisma.superAdminCredentials.update({
      where: { id: 'primary' },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    // Sign session token and set HTTP-only cookie
    const token = await signSession({
      sub: expectedUsername,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
    }, 86400);

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 86400,
    };

    cookies().set(SUPER_ADMIN_COOKIE, token, cookieOptions);

    const res = NextResponse.json({
      success: true,
      message: 'Master authentication successful. Session active.',
    });
    res.cookies.set(SUPER_ADMIN_COOKIE, token, cookieOptions);
    return res;
  } catch (err: any) {
    console.error('Super Admin login error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
