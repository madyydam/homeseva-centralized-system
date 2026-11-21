import { NextRequest, NextResponse } from 'next/server';
import { prisma, resolveBusiness } from '@homeseva/db';
import { getCurrentSuperAdminSession, getCurrentStaffSession } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

/**
 * Normalizes multi-tenant business slug aliases to canonical keys.
 */
function normalizeSlug(slug: string | null | undefined): string {
  if (!slug) return '';
  const s = slug.toLowerCase().trim();
  if (s === 'printbooth' || s === 'adjs') return 'adjs';
  if (s === 'crockery-rental' || s === 'horeca-essentials' || s === 'essentials-sales') return 'horeca-essentials';
  if (s === '3' || s === 'gentle-hair-wigs') return 'gentle-hair-wigs';
  return s;
}

/**
 * Validates caller identity: Super Admin gets universal access;
 * Staff session must strictly match the target tenant.
 */
async function verifyAccess(requestedSlug: string): Promise<{
  authorized: boolean;
  isSuperAdmin: boolean;
  status?: number;
  error?: string;
}> {
  const saSession = await getCurrentSuperAdminSession();
  if (saSession?.isSuperAdmin) {
    return { authorized: true, isSuperAdmin: true };
  }

  const staffSession = await getCurrentStaffSession();
  if (!staffSession) {
    return {
      authorized: false,
      isSuperAdmin: false,
      status: 401,
      error: 'Unauthorized: Session authentication required.',
    };
  }

  const sessionCanonical = normalizeSlug(staffSession.businessSlug);
  const targetCanonical = normalizeSlug(requestedSlug);

  if (sessionCanonical !== targetCanonical) {
    return {
      authorized: false,
      isSuperAdmin: false,
      status: 403,
      error: 'Forbidden: Cross-tenant access denied.',
    };
  }

  return { authorized: true, isSuperAdmin: false };
}

/**
 * GET /api/business/[slug]/sync
 * Retrieves the JSON workspace snapshot for a given business and section.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const requestedSlug = params.slug;
    const auth = await verifyAccess(requestedSlug);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const biz = await resolveBusiness(requestedSlug);
    if (!biz) {
      return NextResponse.json(
        { success: false, error: `Business not found for '${requestedSlug}'` },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const section = url.searchParams.get('section') || 'main';

    const record = await prisma.businessWorkspaceData.findUnique({
      where: {
        businessId_section: {
          businessId: biz.id,
          section,
        },
      },
    });

    return NextResponse.json({
      success: true,
      businessId: biz.id,
      slug: biz.slug,
      section,
      data: record?.data ?? null,
      updatedAt: record?.updatedAt ?? null,
    });
  } catch (err: any) {
    console.error('[business/[slug]/sync GET error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/[slug]/sync
 * Atomically persists or updates the JSON workspace snapshot in PostgreSQL.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const requestedSlug = params.slug;
    const auth = await verifyAccess(requestedSlug);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const biz = await resolveBusiness(requestedSlug);
    if (!biz) {
      return NextResponse.json(
        { success: false, error: `Business not found for '${requestedSlug}'` },
        { status: 404 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || body.data === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required "data" field in payload' },
        { status: 400 }
      );
    }

    const section =
      typeof body.section === 'string' && body.section.trim()
        ? body.section.trim()
        : 'main';

    const saved = await prisma.businessWorkspaceData.upsert({
      where: {
        businessId_section: {
          businessId: biz.id,
          section,
        },
      },
      create: {
        businessId: biz.id,
        section,
        data: body.data,
      },
      update: {
        data: body.data,
      },
    });

    return NextResponse.json({
      success: true,
      businessId: biz.id,
      slug: biz.slug,
      section: saved.section,
      updatedAt: saved.updatedAt,
    });
  } catch (err: any) {
    console.error('[business/[slug]/sync POST error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
