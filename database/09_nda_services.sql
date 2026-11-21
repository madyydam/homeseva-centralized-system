-- =============================================================================
-- HOMESEVA DATABASE: 09 - NDA SECURITY & FACILITY CARE
-- =============================================================================
-- Business Slug: nda-services
-- Industry: Corporate Security, Guarding Services, Facility Upkeep, Surveillance
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'nda-services';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Operations Head', 'Operations Head', 'Client site deployments, shift rosters, and guard training', 'Security', '12345678', '1234'),
  (b_id, 'Deployment Officer', 'Deployment Officer', 'Field patrols, biometric attendance checks, uniform audits', 'Field', '12345678', '1234'),
  (b_id, 'Admin Desk', 'Admin Desk', 'Client agreements, billing, guard muster roll, and compliance', 'Administration', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'site_deployments', 'Client Sites & Posts', 'Corporate parks, industrial factories, and residential posts', 1),
  (b_id, 'guard_muster_roll', 'Guard Muster & Attendance', 'Biometric shifts, night patrols, reliever guards, and overtime', 2),
  (b_id, 'patrol_reports', 'Incident & Patrol Logs', 'NFC checkpoint patrol records, perimeter breaches, and logs', 3),
  (b_id, 'client_contracts', 'Service Agreements & SLA', 'Manned guarding billing, PF/ESIC compliance, and client invoices', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. NDA OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.nda_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  site_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  guards_required INT NOT NULL DEFAULT 1,
  shift_type TEXT NOT NULL DEFAULT '24x7',
  contact_person TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nda_guards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  badge_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  assigned_site_id UUID REFERENCES public.nda_sites(id) ON DELETE SET NULL,
  uniform_status TEXT DEFAULT 'Issued',
  police_verification_status TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nda_sites_biz ON public.nda_sites(business_id);
CREATE INDEX IF NOT EXISTS idx_nda_guards_biz ON public.nda_guards(business_id);
