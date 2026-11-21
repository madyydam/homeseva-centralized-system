import { NextRequest, NextResponse } from 'next/server';
import { prisma, resolveBusinessId } from '@homeseva/db';
import { getCurrentStaffSession, getCurrentSuperAdminSession } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

async function isAuthorized(): Promise<boolean> {
  const saSession = await getCurrentSuperAdminSession();
  if (saSession?.isSuperAdmin) return true;

  const staffSession = await getCurrentStaffSession();
  if (staffSession && (staffSession.businessSlug === 'gentle-hair-wigs' || staffSession.businessSlug === '3')) {
    return true;
  }

  return false;
}

export async function GET() {
  try {
    const canonicalBizId = await resolveBusinessId('gentle-hair-wigs');
    const studios = await prisma.gentleHairWigsStudio.findMany({
      where: { businessId: { in: [canonicalBizId, '3', 'gentle-hair-wigs'] } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      studios: studios.map((s) => ({
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        address: s.address ?? undefined,
        isCustom: s.isCustom,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching gentle studios from postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message, studios: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { slug, name, shortName, address } = body;

    if (!slug || !name || !shortName) {
      return NextResponse.json(
        { success: false, error: 'slug, name, and shortName are required' },
        { status: 400 }
      );
    }

    const canonicalBizId = await resolveBusinessId('gentle-hair-wigs');

    const studio = await prisma.gentleHairWigsStudio.upsert({
      where: {
        businessId_slug: {
          businessId: canonicalBizId,
          slug,
        },
      },
      update: {
        name,
        shortName,
        address: address ?? null,
        isCustom: true,
      },
      create: {
        businessId: canonicalBizId,
        slug,
        name,
        shortName,
        address: address ?? null,
        isCustom: true,
      },
    });

    return NextResponse.json({
      success: true,
      studio: {
        slug: studio.slug,
        name: studio.name,
        shortName: studio.shortName,
        address: studio.address ?? undefined,
        isCustom: studio.isCustom,
      },
    });
  } catch (error: any) {
    console.error('Error creating gentle studio in postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
