import { NextResponse, type NextRequest } from 'next/server';
import { verifySession, SUPER_ADMIN_COOKIE, USER_SESSION_COOKIE } from './lib/authSession';

/**
 * Normalizes multi-tenant business slug aliases to canonical keys.
 * Matches canonical definitions in packages/db/src/businessResolver.ts
 */
function normalizeBusinessSlug(slug: string | null | undefined): string {
  if (!slug) return '';
  const s = slug.toLowerCase().trim();
  if (s === 'printbooth' || s === 'adjs') return 'adjs';
  if (s === 'crockery-rental' || s === 'horeca-essentials' || s === 'essentials-sales') return 'horeca-essentials';
  if (s === '3' || s === 'gentle-hair-wigs') return 'gentle-hair-wigs';
  return s;
}

// Public API endpoints that must be accessible without prior authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth/member-login',
  '/api/auth/role/verify-field',
  '/api/auth/super-admin/login',
  '/api/auth/super-admin/verify-field',
  '/api/auth/super-admin/reset-credentials',
  '/api/auth/businesses',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/verify',
];

/**
 * Returns a NextResponse.next() with strict Cache-Control headers
 * to prevent browser history back-button data leakage on confidential ERP portals.
 */
function createSecureProtectedResponse(): NextResponse {
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─────────────────────────────────────────────────────────────
  // 1. SUPER ADMIN ROUTE GUARD (/super-admin/*)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/super-admin')) {
    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const saSession = saToken ? await verifySession(saToken) : null;
    const isSuperAdminValid = !!(saSession && saSession.isSuperAdmin);

    // If user is accessing the signin page...
    if (pathname === '/super-admin/signin') {
      // If already authenticated as Super Admin, redirect straight to companies dashboard
      if (isSuperAdminValid) {
        return NextResponse.redirect(new URL('/super-admin/companies', req.url));
      }
      return NextResponse.next();
    }

    // For all other /super-admin/* routes: strictly require valid Super Admin session
    if (!isSuperAdminValid) {
      const loginUrl = new URL('/super-admin/signin', req.url);
      loginUrl.searchParams.set('from', pathname);
      const res = NextResponse.redirect(loginUrl);
      if (saToken) {
        res.cookies.delete(SUPER_ADMIN_COOKIE);
      }
      return res;
    }

    return createSecureProtectedResponse();
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SIGNIN REDIRECT FOR ALREADY AUTHENTICATED STAFF (/signin/:businessSlug)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/signin/')) {
    const slugMatch = pathname.match(/^\/signin\/([^\/]+)/);
    const requestedSlug = slugMatch ? slugMatch[1] : '';
    if (requestedSlug) {
      const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
      const session = userToken ? await verifySession(userToken) : null;
      if (session && session.businessSlug) {
        const requestedCanonical = normalizeBusinessSlug(requestedSlug);
        const sessionCanonical = normalizeBusinessSlug(session.businessSlug);
        if (requestedCanonical === sessionCanonical) {
          return NextResponse.redirect(new URL(`/app/${session.businessSlug}/dashboard`, req.url));
        }
      }
    }
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────
  // 3. MULTI-TENANT WORKSPACE ROUTE GUARD (/app/:businessSlug/*)
  // ─────────────────────────────────────────────────────────────
  if (pathname === '/app' || pathname === '/app/') {
    const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    const session = userToken ? await verifySession(userToken) : null;
    if (session && session.businessSlug) {
      return NextResponse.redirect(new URL(`/app/${session.businessSlug}/dashboard`, req.url));
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/app/')) {
    const slugMatch = pathname.match(/^\/app\/([^\/]+)/);
    const requestedSlug = slugMatch ? slugMatch[1] : '';

    const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;

    let session = userToken ? await verifySession(userToken) : null;

    // Super Admin has universal oversight into any company workspace
    if (!session && saToken) {
      const saSession = await verifySession(saToken);
      if (saSession && saSession.isSuperAdmin) {
        session = saSession;
      }
    }

    // Unauthenticated access attempt
    if (!session) {
      const signinUrl = new URL(requestedSlug ? `/signin/${requestedSlug}` : '/', req.url);
      const res = NextResponse.redirect(signinUrl);
      if (userToken) {
        res.cookies.delete(USER_SESSION_COOKIE);
      }
      return res;
    }

    // If session is Super Admin, allow universal inspection
    if (session.isSuperAdmin) {
      return createSecureProtectedResponse();
    }

    // Cross-Tenant Boundary Enforcement
    const requestedCanonical = normalizeBusinessSlug(requestedSlug);
    const sessionCanonical = normalizeBusinessSlug(session.businessSlug);

    if (requestedCanonical !== sessionCanonical) {
      // Staff member is attempting to access another company's portal!
      // Intercept and redirect back to their own authorized dashboard
      const authorizedSlug = session.businessSlug;
      if (authorizedSlug) {
        const redirectUrl = new URL(`/app/${authorizedSlug}/dashboard`, req.url);
        redirectUrl.searchParams.set('error', 'unauthorized_workspace');
        return NextResponse.redirect(redirectUrl);
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    return createSecureProtectedResponse();
  }

  // ─────────────────────────────────────────────────────────────
  // 4. API ROUTE GUARD (/api/*)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // A. Allow public auth endpoints
    if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }

    // B. Super Admin protected API endpoints (/api/admin/*, /api/members, /api/email/test)
    const isSuperAdminApi =
      pathname.startsWith('/api/admin/') ||
      pathname === '/api/members' ||
      pathname.startsWith('/api/email/');

    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const saSession = saToken ? await verifySession(saToken) : null;

    if (isSuperAdminApi) {
      if (!saSession || !saSession.isSuperAdmin) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Super Admin credentials required.' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // C. Tenant Business API Endpoints
    const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    const userSession = userToken ? await verifySession(userToken) : null;

    // Super Admin has universal API clearance
    if (saSession && saSession.isSuperAdmin) {
      return NextResponse.next();
    }

    // Staff session required for tenant APIs
    if (!userSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid session cookie required.' },
        { status: 401 }
      );
    }

    const sessionCanonical = normalizeBusinessSlug(userSession.businessSlug);

    if (pathname.startsWith('/api/gentle-hair-wigs/')) {
      if (sessionCanonical !== 'gentle-hair-wigs') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Cross-tenant access denied.' },
          { status: 403 }
        );
      }
    } else if (pathname.startsWith('/api/printbooth/')) {
      if (sessionCanonical !== 'adjs') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Cross-tenant access denied.' },
          { status: 403 }
        );
      }
    } else if (pathname.startsWith('/api/crockery-rental/')) {
      if (sessionCanonical !== 'horeca-essentials') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Cross-tenant access denied.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/signin/:path*',
    '/app',
    '/app/:path*',
    '/api/:path*',
  ],
};
