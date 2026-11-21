import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@homeseva/db';
import { signSession, SUPER_ADMIN_COOKIE, ONE_MONTH_SESSION_SECONDS } from '../../../../../lib/authSession';

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
        const remainingSeconds = Math.max(1, Math.ceil((lockExpiry - now) / 1000));
        const timeMsg = remainingSeconds >= 60
          ? `${Math.ceil(remainingSeconds / 60)} minute(s)`
          : `${remainingSeconds} second(s)`;
        return NextResponse.json(
          { success: false, error: `Account locked due to 5 failed attempts. Please retry in ${timeMsg}.` },
          { status: 403 }
        );
      }
    }

    const isUserMatch = u.toLowerCase() === expectedUsername.toLowerCase();
    const isPassMatch = await bcrypt.compare(p, expectedPassHash).catch(() => false);
    const isPin4Match = await bcrypt.compare(p4, expectedPin4Hash).catch(() => false);
    const isPin8Match = await bcrypt.compare(p8, expectedPin8Hash).catch(() => false);

    if (!isUserMatch || !isPassMatch || !isPin4Match || !isPin8Match) {
      const newAttempts = (adminRecord.failedAttempts || 0) + 1;
      const updatePayload: Record<string, any> = { failedAttempts: newAttempts };
      if (newAttempts >= 5) {
        updatePayload.lockedUntil = new Date(Date.now() + 1 * 60 * 1000);
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

    // Sign session token and set HTTP-only cookie (30-day lifetime)
    const token = await signSession({
      sub: expectedUsername,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
    }, ONE_MONTH_SESSION_SECONDS);

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: ONE_MONTH_SESSION_SECONDS,
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
