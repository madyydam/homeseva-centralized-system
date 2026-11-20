import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@homeseva/db';
import { signSession, USER_SESSION_COOKIE } from '@/lib/authSession';
import { verifyCredential, hashCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, roleId, email, password, pin } = body;

    const rawSlug = (businessSlug || '').trim();
    const slug = rawSlug === 'crockery-rental' ? 'horeca-essentials' : (rawSlug === 'printbooth' ? 'adjs' : rawSlug);
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

    // 2. Query member by email in this business
    const targetMember = await prisma.roleMember.findFirst({
      where: {
        businessId: business.id,
        email: em,
        isActive: true,
      },
    });

    if (!targetMember) {
      return NextResponse.json({
        success: false,
        error: `No member account found with email "${em}" in this business. Please contact your Super Administrator to allot access.`,
      }, { status: 401 });
    }

    // 3. Smart role check: Verify if member is trying to login to a different role
    const normalizeRole = (r: string) => {
      const norm = r.trim().toLowerCase().replace(/[\s\-_]+/g, '');
      if (norm === 'coldcaller' || norm === 'telecaller' || norm === 'caller') {
        return 'caller';
      }
      if (norm === 'owner' || norm === 'studiopartner' || norm === 'studiopartnerowner' || norm === 'partner') {
        return 'owner';
      }
      if (norm === 'manager' || norm === 'studiomanager' || norm === 'storeoperationsmanager' || norm === 'operationsmanager') {
        return 'manager';
      }
      return norm;
    };

    if (normalizeRole(targetMember.roleId) !== normalizeRole(rId)) {
      return NextResponse.json({
        success: false,
        error: `You are not ${rId}. You are assigned to the role "${targetMember.roleId}". Please select "${targetMember.roleId}" and try again.`,
        wrongRole: true,
        actualRole: targetMember.roleId,
      }, { status: 403 });
    }

    // 4. Validate password (Bcrypt cryptographic verification with zero-downtime auto-upgrade)
    const passCheck = await verifyCredential(pw, targetMember.password);
    if (!passCheck.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed. Password does not match.',
      }, { status: 401 });
    }

    // 5. Validate PIN (if required)
    const pinCheck = targetMember.pin && p ? await verifyCredential(p, targetMember.pin) : { isValid: true, needsRehash: false };
    if (targetMember.pin && p && !pinCheck.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed. Security PIN does not match.',
      }, { status: 401 });
    }

    // Auto-upgrade legacy plaintext to secure Bcrypt hashes in PostgreSQL
    if (passCheck.needsRehash || (p && pinCheck.needsRehash)) {
      try {
        const updatePayload: Record<string, string> = {};
        if (passCheck.needsRehash) {
          updatePayload.password = await hashCredential(pw);
        }
        if (p && pinCheck.needsRehash) {
          updatePayload.pin = await hashCredential(p);
        }
        await prisma.roleMember.update({
          where: { id: targetMember.id },
          data: updatePayload,
        });
      } catch (err) {
        console.warn('Background credential rehash notice:', err);
      }
    }

    // 6. Sign session (8 hours / standard lifetime)
    const LIFETIME_SECONDS = 28800; // 8 hours
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
