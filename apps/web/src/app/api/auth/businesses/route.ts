import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '../../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    const admin = getAdminClient();

    if (slug) {
      // Query specific business and its roles
      const { data: business } = await admin
        .from('businesses')
        .select(`
          id, name, slug, subtitle, description, theme_color, logo_url, is_active, config,
          business_roles (
            id, role_id, label, description, department, is_active
          ),
          tabs (
            id, tab_key, label, description, sort_order, is_active
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!business) {
        return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
      }

      // Filter active roles and tabs
      const activeRoles = (business.business_roles || []).filter((r: any) => r.is_active);
      const activeTabs = (business.tabs || []).filter((t: any) => t.is_active);

      return NextResponse.json({
        success: true,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          subtitle: business.subtitle,
          description: business.description,
          themeColor: business.theme_color,
          logoUrl: business.logo_url,
          config: business.config,
          roles: activeRoles,
          tabs: activeTabs,
        },
      });
    }

    // List all active businesses for catalog/homepage
    const { data: businesses, error } = await admin
      .from('businesses')
      .select('id, name, slug, subtitle, description, theme_color, logo_url, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, businesses: businesses || [] });
  } catch (err: any) {
    console.error('Error fetching businesses catalog:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
