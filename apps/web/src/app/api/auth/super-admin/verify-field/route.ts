import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@homeseva/db';

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

    const adminRecord = await prisma.superAdminCredentials.findFirst({
      where: { id: 'primary' },
    });

    if (!adminRecord) {
      return NextResponse.json({
        success: false,
        matched: false,
        error: 'Database not initialized. Super Admin credentials not found.',
      }, { status: 503 });
    }

    // Check lockout status
    if (adminRecord.lockedUntil) {
      const lockExpiry = new Date(adminRecord.lockedUntil).getTime();
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
      matched = cleanVal.toLowerCase() === adminRecord.username.trim().toLowerCase();
    } else if (field === 'password') {
      matched = await bcrypt.compare(cleanVal, adminRecord.passwordHash).catch(() => false);
    } else if (field === 'pin4') {
      matched = await bcrypt.compare(cleanVal, adminRecord.pin4Hash).catch(() => false);
    } else if (field === 'pin8') {
      matched = await bcrypt.compare(cleanVal, adminRecord.pin8Hash).catch(() => false);
    }

    if (!matched && (field === 'password' || field === 'pin4' || field === 'pin8')) {
      const newAttempts = (adminRecord.failedAttempts || 0) + 1;
      const updatePayload: Record<string, any> = { failedAttempts: newAttempts };
      if (newAttempts >= 5) {
        updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await prisma.superAdminCredentials.update({
        where: { id: 'primary' },
        data: updatePayload,
      });

      if (newAttempts >= 5) {
        return NextResponse.json({
          success: false,
          matched: false,
          locked: true,
          error: 'Account has been locked for 15 minutes due to 5 consecutive failed attempts.',
        }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, matched });
  } catch (err: any) {
    console.error('Error verifying super admin field:', err);
    return NextResponse.json({ success: false, matched: false, error: err.message }, { status: 500 });
  }
}
