import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = '3';

export async function POST(req: NextRequest) {
  try {
    // Ensure Gentle Hair Wigs business exists in PostgreSQL
    await prisma.business.upsert({
      where: { id: BUSINESS_ID },
      update: {
        name: 'Gentle Hair Wigs',
        slug: 'gentle-hair-wigs',
        description: 'Custom Hair Systems, Medical Prosthetics & Aesthetic Salons',
      },
      create: {
        id: BUSINESS_ID,
        name: 'Gentle Hair Wigs',
        slug: 'gentle-hair-wigs',
        description: 'Custom Hair Systems, Medical Prosthetics & Aesthetic Salons',
        logoUrl: '/logos/gentle-hair-wigs-logo.jpg',
        enabledModules: ['crm', 'orders', 'measurements', 'appointments', 'inventory', 'billing'],
      },
    });

    // Ensure default studios exist in PostgreSQL
    const defaultStudios = [
      {
        slug: 'viman-nagar',
        name: 'Studio of Viman Nagar (Pune East)',
        shortName: 'Viman Nagar',
        address: 'Phoenix Marketcity Corridor, Viman Nagar, Pune 411014',
      },
      {
        slug: 'ravet',
        name: 'Studio of Ravet (PCMC Lounge)',
        shortName: 'Ravet',
        address: 'Kiwale-Ravet BRTS Corridor, Ravet, PCMC 412101',
      },
      {
        slug: 'kolhapur',
        name: 'Studio of Kolhapur (South Maharashtra)',
        shortName: 'Kolhapur',
        address: 'Near Station Road, Tarabai Park, Kolhapur 416003',
      },
    ];

    for (const studio of defaultStudios) {
      await prisma.gentleHairWigsStudio.upsert({
        where: {
          businessId_slug: {
            businessId: BUSINESS_ID,
            slug: studio.slug,
          },
        },
        update: {
          name: studio.name,
          shortName: studio.shortName,
          address: studio.address,
        },
        create: {
          businessId: BUSINESS_ID,
          slug: studio.slug,
          name: studio.name,
          shortName: studio.shortName,
          address: studio.address,
          isCustom: false,
        },
      });
    }

    const leadCount = await prisma.gentleHairWigsLead.count({
      where: { businessId: BUSINESS_ID },
    });

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database initialized for Gentle Hair Wigs with clean state.',
      leadCount,
    });
  } catch (error: any) {
    console.error('Error initializing gentle hair wigs db:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
