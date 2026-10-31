import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SUPER_ADMIN_COOKIE, USER_SESSION_COOKIE } from './lib/authSession';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Guard Super Admin protected routes
  if (pathname.startsWith('/super-admin')) {
    // Exempt signin page
    if (pathname === '/super-admin/signin') {
      // If already logged in as super admin, redirect to credentials console
      const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      if (saToken) {
        const payload = await verifySession(saToken);
        if (payload?.isSuperAdmin) {
          return NextResponse.redirect(new URL('/super-admin/credentials', req.url));
        }
      }
      return NextResponse.next();
    }

    // All other /super-admin routes require valid Super Admin session
    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    if (!saToken) {
      const signinUrl = new URL('/super-admin/signin', req.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }

    const payload = await verifySession(saToken);
    if (!payload || !payload.isSuperAdmin) {
      const response = NextResponse.redirect(new URL('/super-admin/signin', req.url));
      response.cookies.delete(SUPER_ADMIN_COOKIE);
      return response;
    }
  }

  // 2. Guard Business Workspace routes (/app/:businessSlug/*)
  const appMatch = pathname.match(/^\/app\/([^/]+)/);
  if (appMatch) {
    const businessSlug = appMatch[1]!;

    // Allow super admin to access any workspace
    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    if (saToken) {
      const saPayload = await verifySession(saToken);
      if (saPayload?.isSuperAdmin) {
        return NextResponse.next();
      }
    }

    // Otherwise require valid business session matching this business
    const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    if (!userToken) {
      return NextResponse.redirect(new URL(`/signin/${businessSlug}`, req.url));
    }

    const userPayload = await verifySession(userToken);
    if (!userPayload || userPayload.businessSlug !== businessSlug) {
      return NextResponse.redirect(new URL(`/signin/${businessSlug}`, req.url));
    }
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/app/:path*',
  ],
};
