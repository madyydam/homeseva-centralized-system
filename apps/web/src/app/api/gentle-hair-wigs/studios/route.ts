import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = '3';

export async function GET() {
  try {
    const studios = await prisma.gentleHairWigsStudio.findMany({
      where: { businessId: BUSINESS_ID },
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
    const body = await req.json();
    const { slug, name, shortName, address } = body;

    if (!slug || !name || !shortName) {
      return NextResponse.json(
        { success: false, error: 'slug, name, and shortName are required' },
        { status: 400 }
      );
    }

    const studio = await prisma.gentleHairWigsStudio.upsert({
      where: {
        businessId_slug: {
          businessId: BUSINESS_ID,
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
        businessId: BUSINESS_ID,
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
