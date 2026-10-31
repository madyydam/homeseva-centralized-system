import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SUPER_ADMIN_COOKIE, USER_SESSION_COOKIE } from './lib/authSession';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api (API routes handle their own auth headers/cookies)
     * 2. /_next (Next.js internals)
     * 3. /_static, /favicon.ico, static images, robots.txt, etc.
     */
    '/super-admin/:path*',
    '/app/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SUPER ADMIN ROUTE SHIELD
  // ─────────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/super-admin')) {
    // Whitelist public signin route
    if (pathname === '/super-admin/signin') {
      // If already logged in as super admin, redirect to console
      const existingToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      if (existingToken) {
        const session = await verifySession(existingToken);
        if (session && session.isSuperAdmin) {
          return NextResponse.redirect(new URL('/super-admin/credentials', req.url));
        }
      }
      return NextResponse.next();
    }

    // Guard all other /super-admin/* routes
    const token = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const session = await verifySession(token);

    if (!session || !session.isSuperAdmin) {
      const redirectUrl = new URL('/super-admin/signin', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. COMPANY BUSINESS WORKSPACES SHIELD (/app/:businessSlug/*)
  // ─────────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/app/')) {
    const segments = pathname.split('/').filter(Boolean);
    const businessSlug = segments[1] || '';

    // Check if Super Admin is accessing (root privilege across all workspaces)
    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const saSession = await verifySession(saToken);
    if (saSession && saSession.isSuperAdmin) {
      return NextResponse.next();
    }

    // Check staff role session
    const staffToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    const staffSession = await verifySession(staffToken);

    if (!staffSession) {
      const targetUrl = new URL(businessSlug ? `/signin/${businessSlug}` : '/', req.url);
      return NextResponse.redirect(targetUrl);
    }

    // If staff session belongs to a different company workspace, redirect to their own
    if (businessSlug && staffSession.businessSlug && staffSession.businessSlug !== businessSlug) {
      const properUrl = new URL(`/signin/${businessSlug}`, req.url);
      return NextResponse.redirect(properUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}
