import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { verifyCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, roleId, field, value } = body;

    if (!businessSlug || !roleId || !field || typeof value !== 'string') {
      return NextResponse.json({ success: false, matched: false, error: 'Invalid input' }, { status: 400 });
    }

    const cleanVal = value.trim();
    if (!cleanVal) {
      return NextResponse.json({ success: true, matched: false });
    }

    const rawSlug = businessSlug.trim();
    const canonicalSlug = rawSlug === 'crockery-rental' ? 'horeca-essentials' : (rawSlug === 'printbooth' ? 'adjs' : rawSlug);

    const business = await prisma.business.findFirst({
      where: { slug: canonicalSlug, isActive: true },
      select: { id: true, slug: true, isActive: true },
    });

    if (!business || !business.isActive) {
      return NextResponse.json({ success: false, matched: false, error: 'Business workspace not found' }, { status: 404 });
    }

    const dbRole = await prisma.businessRole.findFirst({
      where: {
        businessId: business.id,
        roleId: roleId.trim(),
      },
    });

    if (!dbRole) {
      return NextResponse.json({ success: false, matched: false, error: 'Role not found' }, { status: 404 });
    }

    // Check lockout status
    if (dbRole.lockedUntil) {
      const lockExpiry = new Date(dbRole.lockedUntil).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json({
          success: false,
          matched: false,
          locked: true,
          error: `Role is locked due to consecutive failed attempts. Retry in ${remainingMinutes}m.`,
        });
      }
    }

    let matched = false;
    if (field === 'password') {
      const res = await verifyCredential(cleanVal, dbRole.password);
      matched = res.isValid;
    } else if (field === 'pin') {
      if (!dbRole.pin) {
        matched = true;
      } else {
        const res = await verifyCredential(cleanVal, dbRole.pin);
        matched = res.isValid;
      }
    }

    return NextResponse.json({ success: true, matched });
  } catch (err: any) {
    console.error('Error verifying role field:', err);
    return NextResponse.json({ success: false, matched: false, error: err.message }, { status: 500 });
  }
}
