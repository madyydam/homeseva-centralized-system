import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { verifyCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

/**
 * Real-time Credential Field Verification for 3D Lock Animation.
 * Strictly verifies against individual staff member credentials:
 * Business + Subcompany/Branch + Role + Registered Email + (Password or PIN).
 *
 * Password lock opens ONLY when Company + Subcompany + Role + Email + Password match.
 * PIN lock opens ONLY when Company + Subcompany + Role + Email + PIN match.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, roleId, email, field, value } = body;

    if (!businessSlug || !roleId || !field || typeof value !== 'string') {
      return NextResponse.json({ success: false, matched: false, error: 'Invalid input parameters.' }, { status: 400 });
    }

    const cleanVal = value.trim();
    if (!cleanVal) {
      return NextResponse.json({ success: true, matched: false });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({
        success: false,
        matched: false,
        error: 'Please enter your registered staff email address first.',
      }, { status: 400 });
    }

    const rawSlug = businessSlug.trim();
    const canonicalSlug = rawSlug === 'crockery-rental' ? 'horeca-essentials' : (rawSlug === 'printbooth' ? 'adjs' : rawSlug);

    const business = await prisma.business.findFirst({
      where: { slug: canonicalSlug, isActive: true },
      select: { id: true, slug: true, isActive: true },
    });

    if (!business || !business.isActive) {
      return NextResponse.json({ success: false, matched: false, error: 'Business workspace not found or inactive.' }, { status: 404 });
    }

    const cleanRole = roleId.trim();

    // ── Individual Member Lookup: Business + Role + Email ──
    const targetMember = await prisma.roleMember.findFirst({
      where: {
        businessId: business.id,
        roleId: cleanRole,
        email: cleanEmail,
        isActive: true,
      },
    });

    if (!targetMember) {
      // Check if this member is assigned to any other role in this business
      const otherRoles = await prisma.roleMember.findMany({
        where: {
          businessId: business.id,
          email: cleanEmail,
          isActive: true,
        },
        select: { roleId: true },
      });

      if (otherRoles.length > 0) {
        const roleList = otherRoles.map((r) => `"${r.roleId}"`).join(', ');
        return NextResponse.json({
          success: false,
          matched: false,
          wrongRole: true,
          error: `Access Denied: You are not authorized for role "${cleanRole}". Your assigned role(s): ${roleList}.`,
        }, { status: 403 });
      }

      return NextResponse.json({
        success: false,
        matched: false,
        error: `No member account found with email "${cleanEmail}" in this workspace.`,
      }, { status: 401 });
    }

    // ── Lockout Defense on this Individual Member ──
    if (targetMember.lockedUntil) {
      const lockExpiry = new Date(targetMember.lockedUntil).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json({
          success: false,
          matched: false,
          locked: true,
          error: `Your account is locked due to 5 consecutive failed attempts. Retry in ${remainingMinutes}m.`,
        }, { status: 403 });
      }
    }

    // ── Cryptographic Verification ──
    let matched = false;
    if (field === 'password') {
      const res = await verifyCredential(cleanVal, targetMember.password);
      matched = res.isValid;
    } else if (field === 'pin') {
      if (!targetMember.pin || !targetMember.pin.trim()) {
        matched = true;
      } else {
        const res = await verifyCredential(cleanVal, targetMember.pin);
        matched = res.isValid;
      }
    }

    if (!matched && (field === 'password' || field === 'pin')) {
      const newAttempts = (targetMember.failedAttempts || 0) + 1;
      const updatePayload: Record<string, any> = { failedAttempts: newAttempts };
      if (newAttempts >= 5) {
        updatePayload.lockedUntil = new Date(Date.now() + 1 * 60 * 1000);
      }
      await prisma.roleMember.update({
        where: { id: targetMember.id },
        data: updatePayload,
      });

      const remaining = 5 - newAttempts;
      const warning = remaining > 0 && remaining <= 3 ? ` (${remaining} attempt(s) remaining before 1m lock)` : '';
      return NextResponse.json({
        success: false,
        matched: false,
        locked: newAttempts >= 5,
        error: newAttempts >= 5
          ? 'Account locked for 15 minutes due to 5 consecutive failed attempts.'
          : (field === 'password' ? `Incorrect password${warning}.` : `Incorrect 4-digit PIN${warning}.`),
      }, { status: 401 });
    }

    // On match: Reset failed attempts for this member
    if (targetMember.failedAttempts > 0 || targetMember.lockedUntil) {
      await prisma.roleMember.update({
        where: { id: targetMember.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    return NextResponse.json({
      success: true,
      matched: true,
      memberName: targetMember.name,
    });
  } catch (err: any) {
    console.error('Error verifying role field:', err);
    return NextResponse.json({
      success: false,
      matched: false,
      error: 'An unexpected verification error occurred. Please try again.',
    }, { status: 500 });
  }
}
