import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@homeseva/db';
import { signSession, USER_SESSION_COOKIE, PERMANENT_SESSION_LIFETIME } from '../../../../lib/authSession';
import { verifyCredential, hashCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, role, password, pin } = body;

    const rawSlug = (businessSlug || '').trim();
    const slug = rawSlug === 'crockery-rental' ? 'horeca-essentials' : (rawSlug === 'printbooth' ? 'adjs' : rawSlug);
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

    // Query business from PostgreSQL
    const business = await prisma.business.findFirst({
      where: { slug },
      select: { id: true, slug: true, name: true, isActive: true },
    });

    if (!business) {
      return NextResponse.json({
        success: false,
        error: `Business "${slug}" not found in database. Please ensure migrations and seed scripts have run.`,
      }, { status: 503 });
    }

    if (!business.isActive) {
      return NextResponse.json({ success: false, error: 'This business workspace is currently inactive.' }, { status: 403 });
    }

    const targetRole = await prisma.businessRole.findFirst({
      where: {
        businessId: business.id,
        roleId,
      },
    });

    if (!targetRole) {
      return NextResponse.json({
        success: false,
        error: `Role "${roleId}" not found for business "${slug}". Please configure this role first.`,
      }, { status: 404 });
    }

    // 1. Check lockout
    if (targetRole.lockedUntil) {
      const lockExpiry = new Date(targetRole.lockedUntil).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return NextResponse.json(
          { success: false, error: `Account locked after 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` },
          { status: 403 }
        );
      }
    }

    // 2. Validate password & pin (Bcrypt cryptographic verification with zero-downtime auto-upgrade)
    const passCheck = await verifyCredential(enteredPass, targetRole.password);
    const isPinRequired = !!(targetRole.pin && targetRole.pin.trim());
    const pinCheck = isPinRequired && enteredPin
      ? await verifyCredential(enteredPin, targetRole.pin)
      : { isValid: !isPinRequired || !targetRole.pin, needsRehash: false };

    const isPassCorrect = passCheck.isValid;
    const isPinCorrect = !isPinRequired || pinCheck.isValid;

    if (!isPassCorrect || !isPinCorrect) {
      const newAttempts = (targetRole.failedAttempts || 0) + 1;
      const updatePayload: Record<string, any> = { failedAttempts: newAttempts };

      if (newAttempts >= 5) {
        updatePayload.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await prisma.businessRole.update({
        where: { id: targetRole.id },
        data: updatePayload,
      });

      const remaining = 5 - newAttempts;
      const errMsg = !isPassCorrect
        ? `Incorrect password for role "${roleId}".`
        : `Incorrect 4-digit security PIN for role "${roleId}".`;

      const warningMsg = remaining > 0 && remaining <= 3
        ? ` (${remaining} attempt(s) remaining before 15-minute lock)`
        : '';

      return NextResponse.json({ success: false, error: `${errMsg}${warningMsg}` }, { status: 401 });
    }

    // Success! Reset attempts and auto-upgrade legacy plaintext credentials to Bcrypt hashes
    const resetPayload: Record<string, any> = { failedAttempts: 0, lockedUntil: null };
    if (passCheck.needsRehash) {
      resetPayload.password = await hashCredential(enteredPass);
    }
    if (enteredPin && pinCheck.needsRehash) {
      resetPayload.pin = await hashCredential(enteredPin);
    }

    await prisma.businessRole.update({
      where: { id: targetRole.id },
      data: resetPayload,
    });

    // Set permanent cookie via authSession (until explicit logout)
    const token = await signSession({
      sub: roleId,
      role: roleId,
      businessSlug: slug,
      isSuperAdmin: false,
    }, PERMANENT_SESSION_LIFETIME);

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: PERMANENT_SESSION_LIFETIME,
    };

    cookies().set(USER_SESSION_COOKIE, token, cookieOptions);

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorType: 'STAFF',
          actorIdentifier: roleId,
          businessSlug: slug,
          action: 'staff.login',
          entityType: 'role',
          entityId: targetRole.id,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      });
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      businessSlug: slug,
      role: roleId,
    });

    response.cookies.set(USER_SESSION_COOKIE, token, cookieOptions);
    response.cookies.set('homeseva_last_slug', slug, {
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: PERMANENT_SESSION_LIFETIME,
    });
    return response;
  } catch (err: any) {
    console.error('Staff verify error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
