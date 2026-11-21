import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@homeseva/db';
import { signSession, USER_SESSION_COOKIE, ONE_MONTH_SESSION_SECONDS } from '@/lib/authSession';
import { verifyCredential, hashCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, roleId, email, password, pin } = body;

    const rawSlug = (businessSlug || '').trim();
    const slug = rawSlug === 'crockery-rental'
      ? 'horeca-essentials'
      : (rawSlug === 'printbooth'
        ? 'adjs'
        : (rawSlug === 'gentle' ? 'gentle-hair-wigs' : rawSlug));
    const rId = (roleId || '').trim();
    const em = (email || '').trim().toLowerCase();
    const pw = (password || '').trim();
    const p = (pin || '').trim();

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Business workspace identifier is required.' }, { status: 400 });
    }
    if (!rId) {
      return NextResponse.json({ success: false, error: 'Please select your role.' }, { status: 400 });
    }
    if (!em) {
      return NextResponse.json({ success: false, error: 'Please enter your registered email address.' }, { status: 400 });
    }
    if (!pw) {
      return NextResponse.json({ success: false, error: 'Please enter your password.' }, { status: 400 });
    }

    // 1. Resolve business
    const business = await prisma.business.findFirst({
      where: { slug, isActive: true },
      select: { id: true, slug: true, name: true, isActive: true },
    });

    if (!business || !business.isActive) {
      return NextResponse.json({
        success: false,
        error: `Business workspace "${slug}" is not active or does not exist.`,
      }, { status: 404 });
    }

    // 2. Query member strictly by businessId, roleId, and email
    const targetMember = await prisma.roleMember.findFirst({
      where: {
        businessId: business.id,
        roleId: rId,
        email: em,
        isActive: true,
      },
    });

    if (!targetMember) {
      // Check if this email is assigned to any other role in this business workspace
      const otherRolesInBusiness = await prisma.roleMember.findMany({
        where: {
          businessId: business.id,
          email: em,
          isActive: true,
        },
        select: { roleId: true },
      });

      if (otherRolesInBusiness.length > 0) {
        const assignedRoleNames = otherRolesInBusiness.map((r) => `"${r.roleId}"`).join(', ');
        return NextResponse.json({
          success: false,
          error: `Access Denied: You are not authorized for role "${rId}". Your assigned role(s) in this business: ${assignedRoleNames}.`,
          wrongRole: true,
          assignedRoles: otherRolesInBusiness.map((r) => r.roleId),
        }, { status: 403 });
      }

      return NextResponse.json({
        success: false,
        error: `No member account found with email "${em}" in this business workspace. Please contact your Super Administrator to allocate access.`,
      }, { status: 401 });
    }

    // Check lockout status (5 failed attempts = 15 minute lock)
    if (targetMember.lockedUntil) {
      const lockExpiry = new Date(targetMember.lockedUntil).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json({
          success: false,
          error: `Account locked after 5 failed attempts. Please retry in ${remainingMinutes} minute(s).`,
        }, { status: 403 });
      }
    }

    // 4. Validate password (Bcrypt cryptographic verification with zero-downtime auto-upgrade)
    const passCheck = await verifyCredential(pw, targetMember.password);

    // 5. Validate PIN (Mandatory if configured on the account; cannot be bypassed with empty string)
    const isPinRequired = !!(targetMember.pin && targetMember.pin.trim());
    let pinCheck = { isValid: true, needsRehash: false };
    if (isPinRequired) {
      if (!p) {
        const newAttempts = (targetMember.failedAttempts || 0) + 1;
        const updatePayload: Record<string, any> = { failedAttempts: newAttempts };
        if (newAttempts >= 5) {
          updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await prisma.roleMember.update({
          where: { id: targetMember.id },
          data: updatePayload,
        });

        const remaining = 5 - newAttempts;
        const warningMsg = remaining > 0 && remaining <= 3
          ? ` (${remaining} attempt(s) remaining before 15-minute lock)`
          : '';

        return NextResponse.json({
          success: false,
          error: `Security PIN is required for your account.${warningMsg}`,
        }, { status: 401 });
      }
      pinCheck = await verifyCredential(p, targetMember.pin);
    }

    const isPassCorrect = passCheck.isValid;
    const isPinCorrect = !isPinRequired || pinCheck.isValid;

    if (!isPassCorrect || !isPinCorrect) {
      const newAttempts = (targetMember.failedAttempts || 0) + 1;
      const updatePayload: Record<string, any> = { failedAttempts: newAttempts };
      if (newAttempts >= 5) {
        updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await prisma.roleMember.update({
        where: { id: targetMember.id },
        data: updatePayload,
      });

      const remaining = 5 - newAttempts;
      const errMsg = !isPassCorrect
        ? 'Authentication failed. Password does not match.'
        : 'Authentication failed. Security PIN does not match.';

      const warningMsg = remaining > 0 && remaining <= 3
        ? ` (${remaining} attempt(s) remaining before 15-minute lock)`
        : '';

      return NextResponse.json({
        success: false,
        error: `${errMsg}${warningMsg}`,
      }, { status: 401 });
    }

    // Success! Reset failed attempts and auto-upgrade legacy plaintext to secure Bcrypt hashes
    const resetPayload: Record<string, any> = { failedAttempts: 0, lockedUntil: null };
    if (passCheck.needsRehash) {
      resetPayload.password = await hashCredential(pw);
    }
    if (isPinRequired && p && pinCheck.needsRehash) {
      resetPayload.pin = await hashCredential(p);
    }
    await prisma.roleMember.update({
      where: { id: targetMember.id },
      data: resetPayload,
    });

    // 6. Sign session (30 days / 1 month lifetime - prevents staff login frustration)
    const LIFETIME_SECONDS = ONE_MONTH_SESSION_SECONDS;
    const token = await signSession({
      sub: targetMember.id,
      role: targetMember.roleId,
      businessSlug: slug,
      isSuperAdmin: false,
      username: targetMember.name,
      memberId: targetMember.id,
      memberName: targetMember.name,
      email: targetMember.email,
    }, LIFETIME_SECONDS);

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: LIFETIME_SECONDS,
    };

    cookies().set(USER_SESSION_COOKIE, token, cookieOptions);

    // Audit log (best effort)
    try {
      await prisma.auditLog.create({
        data: {
          actorType: 'STAFF',
          actorIdentifier: targetMember.email,
          businessSlug: slug,
          action: 'member.login',
          entityType: 'role_member',
          entityId: targetMember.id,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      });
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      businessSlug: slug,
      role: targetMember.roleId,
      memberId: targetMember.id,
      memberName: targetMember.name,
      email: targetMember.email,
    });

    response.cookies.set(USER_SESSION_COOKIE, token, cookieOptions);
    response.cookies.set('homeseva_last_slug', slug, {
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: LIFETIME_SECONDS,
    });
    return response;
  } catch (err: any) {
    console.error('Member login error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
