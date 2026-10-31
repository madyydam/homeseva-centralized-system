import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SUPER_ADMIN_COOKIE, USER_SESSION_COOKIE } from './lib/authSession';

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/app/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Super Admin route protection
  if (pathname.startsWith('/super-admin')) {
    if (pathname === '/super-admin/signin') {
      const existingToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      if (existingToken) {
        const session = await verifySession(existingToken);
        if (session && session.isSuperAdmin) {
          return NextResponse.redirect(new URL('/super-admin/credentials', req.url));
        }
      }
      return NextResponse.next();
    }

    const token = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const session = await verifySession(token);

    if (!session || !session.isSuperAdmin) {
      const redirectUrl = new URL('/super-admin/signin', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // 2. Company Business Workspaces route protection (/app/:businessSlug/*)
  if (pathname.startsWith('/app/')) {
    const segments = pathname.split('/').filter(Boolean);
    const businessSlug = segments[1] || '';

    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const saSession = await verifySession(saToken);
    if (saSession && saSession.isSuperAdmin) {
      return NextResponse.next();
    }

    const staffToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    const staffSession = await verifySession(staffToken);

    if (!staffSession) {
      const targetUrl = new URL(businessSlug ? `/signin/${businessSlug}` : '/', req.url);
      return NextResponse.redirect(targetUrl);
    }

    if (businessSlug && staffSession.businessSlug && staffSession.businessSlug !== businessSlug) {
      const properUrl = new URL(`/signin/${businessSlug}`, req.url);
      return NextResponse.redirect(properUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}
