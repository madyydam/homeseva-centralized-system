import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase/admin';
import { signSession, USER_SESSION_COOKIE } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, roleId, email, password, pin } = body;

    const slug = (businessSlug || '').trim();
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

    const admin = getAdminClient();

    // 1. Resolve business
    const { data: business } = await admin
      .from('businesses')
      .select('id, slug, name, is_active')
      .eq('slug', slug)
      .single();

    if (!business || !business.is_active) {
      return NextResponse.json({
        success: false,
        error: `Business workspace "${slug}" is not active or does not exist.`,
      }, { status: 404 });
    }

    // 2. Query member by email in this business
    const { data: memberByEmail, error: memberErr } = await admin
      .from('role_members')
      .select('*')
      .eq('business_id', business.id)
      .eq('email', em)
      .eq('is_active', true)
      .maybeSingle();

    let targetMember = memberByEmail;

    // Graceful fallback for demo member if table exists or during transition
    if (!targetMember && em === 'abc@xyz.com' && pw === '12345678' && (p === '1234' || !p)) {
      targetMember = {
        id: `demo-${business.id}-${rId.toLowerCase().replace(/\s+/g, '-')}`,
        business_id: business.id,
        role_id: rId,
        name: 'Demo User',
        email: 'abc@xyz.com',
        password: '12345678',
        pin: '1234',
        is_active: true,
      };
    }

    if (!targetMember) {
      return NextResponse.json({
        success: false,
        error: `No member account found with email "${em}" in this business. Please contact your administrator.`,
      }, { status: 401 });
    }

    // 3. Smart role check: Verify if member is trying to login to a different role
    if (targetMember.role_id.trim().toLowerCase() !== rId.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: `You are not ${rId}. You are ${targetMember.role_id}. Please select ${targetMember.role_id} and try again.`,
        wrongRole: true,
        actualRole: targetMember.role_id,
      }, { status: 403 });
    }

    // 4. Validate password
    if (targetMember.password.trim() !== pw) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed. Password does not match.',
      }, { status: 401 });
    }

    // 5. Validate PIN (if required)
    if (targetMember.pin && p && targetMember.pin.trim() !== p) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed. Security PIN does not match.',
      }, { status: 401 });
    }

    // 6. Sign permanent session (99 years lifetime)
    const LIFETIME_SECONDS = 3124224000; // 99 years
    const token = await signSession({
      sub: targetMember.id,
      role: targetMember.role_id,
      businessSlug: slug,
      isSuperAdmin: false,
      username: targetMember.name,
      memberId: targetMember.id,
      memberName: targetMember.name,
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
      await admin.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_identifier: targetMember.email,
        business_slug: slug,
        action: 'member.login',
        entity_type: 'role_member',
        entity_id: targetMember.id,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
        user_agent: req.headers.get('user-agent') || 'Browser',
      });
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      businessSlug: slug,
      role: targetMember.role_id,
      memberId: targetMember.id,
      memberName: targetMember.name,
    });

    response.cookies.set(USER_SESSION_COOKIE, token, cookieOptions);
    return response;
  } catch (err: any) {
    console.error('Member login error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
