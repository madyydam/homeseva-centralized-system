-- =============================================================================
-- HOMESEVA DATABASE: 10 - HS REAL ESTATE & ASSETS
-- =============================================================================
-- Business Slug: hs-real-estate
-- Industry: Commercial Leasing, High-Yield Asset Portfolios, Legal Conveyance
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'hs-real-estate';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Portfolio Lead', 'Portfolio Lead', 'Asset valuation, tenancy overview, yield optimization', 'Portfolio', '12345678', '1234'),
  (b_id, 'Leasing Executive', 'Leasing Executive', 'Site visits, tenant negotiations, lease drafts & renewals', 'Leasing', '12345678', '1234'),
  (b_id, 'Accounts & Legal', 'Accounts & Legal', 'Rental receivables, maintenance escrow, registered agreements', 'Legal', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'asset_portfolio', 'Commercial Asset Portfolio', 'Office towers, retail shops, industrial plots, and market valuations', 1),
  (b_id, 'lease_agreements', 'Lease Agreements & Tenancy', 'Registered rental deeds, lock-in periods, and annual escalations', 2),
  (b_id, 'tenant_billing', 'Monthly Rent & CAM Billing', 'Automated rental invoices, CAM maintenance, and TDS reconciliation', 3),
  (b_id, 'inspections', 'Property Audits & Upkeep', 'Move-in inventories, structural inspections, and repair logs', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. REAL ESTATE OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.real_estate_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  property_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'Commercial Office',
  carpet_area_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  valuation_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  occupancy_status TEXT NOT NULL DEFAULT 'Vacant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.real_estate_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.real_estate_properties(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  tenant_contact TEXT NOT NULL,
  monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  security_deposit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  escalation_percent NUMERIC(5, 2) DEFAULT 5.0,
  agreement_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_re_properties_biz ON public.real_estate_properties(business_id);
CREATE INDEX IF NOT EXISTS idx_re_leases_prop ON public.real_estate_leases(property_id);
