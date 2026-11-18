import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { USER_SESSION_COOKIE, SUPER_ADMIN_COOKIE } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    const clearCookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    };

    cookies().set(USER_SESSION_COOKIE, '', clearCookieOptions);
    cookies().set(SUPER_ADMIN_COOKIE, '', clearCookieOptions);
    cookies().set('homeseva_last_slug', '', { ...clearCookieOptions, httpOnly: false });

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set(USER_SESSION_COOKIE, '', clearCookieOptions);
    response.cookies.set(SUPER_ADMIN_COOKIE, '', clearCookieOptions);
    response.cookies.set('homeseva_last_slug', '', { ...clearCookieOptions, httpOnly: false });

    return response;
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
