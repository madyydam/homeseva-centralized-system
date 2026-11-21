import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      username,
      currentPassword,
      currentPin4,
      currentPin8,
      newPassword,
      newPin4,
      newPin8,
    } = body;

    const u = (username || '').trim();
    const currPass = (currentPassword || '').trim();
    const currP4 = (currentPin4 || '').trim();
    const currP8 = (currentPin8 || '').trim();
    const newPass = (newPassword || '').trim();
    const newP4 = (newPin4 || '').trim();
    const newP8 = (newPin8 || '').trim();

    if (!u || !currPass || !currP4 || !currP8) {
      return NextResponse.json(
        {
          success: false,
          error: 'All current master credentials (Username, Current Password, 4-digit PIN, and 8-digit Master Key) are required to verify authorization.',
        },
        { status: 400 }
      );
    }

    if (!newPass || !newP4 || !newP8) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide all new credentials (New Password, New 4-digit PIN, and New 8-digit Master Key).',
        },
        { status: 400 }
      );
    }

    if (newPass.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(newP4)) {
      return NextResponse.json(
        { success: false, error: 'New security PIN must be exactly 4 digits (numeric only).' },
        { status: 400 }
      );
    }

    if (!/^\d{8}$/.test(newP8)) {
      return NextResponse.json(
        { success: false, error: 'New master recovery key must be exactly 8 digits (numeric only).' },
        { status: 400 }
      );
    }

    // Fetch primary Super Admin record from PostgreSQL
    const adminRecord = await prisma.superAdminCredentials.findFirst({
      where: { id: 'primary' },
    });

    if (!adminRecord) {
      return NextResponse.json(
        { success: false, error: 'Super Admin credentials record not initialized in database.' },
        { status: 503 }
      );
    }

    // Check account lockout
    if (adminRecord.lockedUntil) {
      const lockExpiry = new Date(adminRecord.lockedUntil).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json(
          {
            success: false,
            error: `Super Admin account is locked due to consecutive failed attempts. Please retry in ${remainingMinutes} minute(s).`,
          },
          { status: 403 }
        );
      }
    }

    // Verify all 3 current master credentials against database bcrypt hashes
    const isUserMatch = u.toLowerCase() === adminRecord.username.toLowerCase();
    const isPassMatch = await bcrypt.compare(currPass, adminRecord.passwordHash).catch(() => false);
    const isPin4Match = await bcrypt.compare(currP4, adminRecord.pin4Hash).catch(() => false);
    const isPin8Match = await bcrypt.compare(currP8, adminRecord.pin8Hash).catch(() => false);

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

      const remaining = 5 - newAttempts;
      const warningMsg = remaining > 0 && remaining <= 3
        ? ` (${remaining} attempt(s) remaining before 15-minute lockout)`
        : '';

      return NextResponse.json(
        {
          success: false,
          error: `Current credentials verification failed. One or more current security factors did not match.${warningMsg}`,
        },
        { status: 401 }
      );
    }

    // All current credentials verified! Hash new credentials
    const [newPasswordHash, newPin4Hash, newPin8Hash] = await Promise.all([
      bcrypt.hash(newPass, 10),
      bcrypt.hash(newP4, 10),
      bcrypt.hash(newP8, 10),
    ]);

    // Update in database
    await prisma.superAdminCredentials.update({
      where: { id: 'primary' },
      data: {
        passwordHash: newPasswordHash,
        pin4Hash: newPin4Hash,
        pin8Hash: newPin8Hash,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorType: 'SUPER_ADMIN',
          actorIdentifier: adminRecord.username,
          action: 'superadmin.reset_credentials',
          entityType: 'super_admin_credentials',
          entityId: adminRecord.id,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Master credentials updated successfully. Please sign in with your new credentials.',
    });
  } catch (err: any) {
    console.error('Super Admin reset credentials error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
