import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSlug = searchParams.get('slug');

    if (rawSlug) {
      const canonicalSlug = rawSlug === 'crockery-rental' ? 'horeca-essentials' : (rawSlug === 'printbooth' ? 'adjs' : rawSlug);

      // Query specific business and its active roles & tabs
      const business = await prisma.business.findFirst({
        where: {
          slug: canonicalSlug,
          isActive: true,
        },
        include: {
          businessRoles: {
            where: { isActive: true },
            select: {
              id: true,
              roleId: true,
              label: true,
              description: true,
              department: true,
              subcompanySlug: true,
              isActive: true,
            },
          },
          tabs: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              tabKey: true,
              label: true,
              description: true,
              sortOrder: true,
              isActive: true,
            },
          },
        },
      });

      if (!business) {
        return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
      }

      // Map roles to client expected shape
      let activeRoles = (business.businessRoles || []).map((r: any) => ({
        id: r.id,
        role_id: r.roleId,
        label: r.label,
        description: r.description,
        department: r.department,
        subcompany_slug: r.subcompanySlug || 'SHARED',
        is_active: r.isActive,
      }));

      // Strict sub-company vertical role isolation for Crockery Rental vs Essentials Sales
      if (rawSlug === 'crockery-rental') {
        activeRoles = activeRoles.filter((r) => r.subcompany_slug === 'crockery-rental');
      } else if (rawSlug === 'essentials-sales') {
        activeRoles = activeRoles.filter((r) => r.subcompany_slug === 'essentials-sales');
      }

      const activeTabs = (business.tabs || []).map((t) => ({
        id: t.id,
        tab_key: t.tabKey,
        label: t.label,
        description: t.description,
        sort_order: t.sortOrder,
        is_active: t.isActive,
      }));

      return NextResponse.json({
        success: true,
        business: {
          id: business.id,
          name: rawSlug === 'crockery-rental' ? 'Crockery Rentals' : business.name,
          slug: rawSlug,
          subtitle: rawSlug === 'crockery-rental' ? 'Banquet Tableware & Buffet Hire Operations' : business.subtitle,
          description: business.description,
          themeColor: business.themeColor,
          logoUrl: business.logoUrl,
          config: business.config,
          roles: activeRoles,
          tabs: activeTabs,
        },
      });
    }

    // List all active businesses for catalog/homepage with deduplication
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        subtitle: true,
        description: true,
        themeColor: true,
        logoUrl: true,
        isActive: true,
      },
    });

    const seenSlugs = new Set<string>();
    const uniqueBusinesses: any[] = [];
    for (const b of businesses) {
      if (b.slug === 'printbooth' && seenSlugs.has('adjs')) continue;
      if (b.slug === 'adjs' && seenSlugs.has('printbooth')) continue;
      if (seenSlugs.has(b.slug)) continue;

      seenSlugs.add(b.slug);

      let canonicalSlug = b.slug;
      let displayName = b.name;
      let subtitle = b.subtitle;
      let subcompanies: any[] = [];

      if (b.slug === 'adjs' || b.slug === 'printbooth') {
        canonicalSlug = 'adjs';
        displayName = 'ADJS';
        subtitle = 'PRINTBOOTH™ Smart Kiosks';
        subcompanies = [
          { slug: 'printbooth', name: 'PRINTBOOTH™', subtitle: 'Smart Self-Service Printing Kiosks' },
        ];
      }

      uniqueBusinesses.push({
        id: b.id,
        name: displayName,
        slug: canonicalSlug,
        subtitle,
        description: b.description,
        theme_color: b.themeColor,
        logo_url: b.logoUrl,
        is_active: b.isActive,
        subcompanies,
      });
    }

    return NextResponse.json({ success: true, businesses: uniqueBusinesses });
  } catch (err: any) {
    console.error('Error fetching businesses catalog:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
