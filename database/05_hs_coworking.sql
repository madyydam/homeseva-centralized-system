-- =============================================================================
-- HOMESEVA DATABASE: 05 - HS CO-WORKING SPACES
-- =============================================================================
-- Business Slug: hs-coworking
-- Industry: Flexible Desks, Private Cabins, Collaborative Team Environments
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'hs-coworking';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Community Manager', 'Community Manager', 'Member relations, onboarding, hot desks and cabins', 'Community', '12345678', '1234'),
  (b_id, 'Front Desk Coordinator', 'Front Desk Coordinator', 'Visitor reception, mail handling, and day passes', 'Reception', '12345678', '1234'),
  (b_id, 'Facility & Access Desk', 'Facility & Access Desk', 'Access cards, internet uptime, power backup & facilities', 'Operations', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'desk_inventory', 'Desks & Cabins Layout', 'Real-time floor plan, hot desk allocations, and private cabins', 1),
  (b_id, 'tenant_members', 'Member Directory', 'Active co-workers, startup teams, KYC, and security access cards', 2),
  (b_id, 'meeting_rooms', 'Conference Bookings', 'Hourly conference room slots, AV setup, and hospitality credits', 3),
  (b_id, 'billing', 'Monthly Invoicing & Rent', 'Membership subscriptions, utility billings, and security deposits', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

  -- 3. SEED DEMO MEMBERS
  INSERT INTO public.role_members (business_id, role_id, name, email, password, pin) VALUES
  (b_id, 'Community Manager', 'Coworking Manager', 'abc@xyz.com', '12345678', '1234'),
  (b_id, 'Front Desk Coordinator', 'Coworking Front Desk', 'abc@xyz.com', '12345678', '1234'),
  (b_id, 'Facility & Access Desk', 'Coworking Facilities', 'abc@xyz.com', '12345678', '1234')
  ON CONFLICT (business_id, role_id, email) DO NOTHING;

END $$;

-- 4. COWORKING OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.coworking_desks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  desk_number TEXT UNIQUE NOT NULL,
  desk_type TEXT NOT NULL DEFAULT 'Hot Desk',
  floor TEXT DEFAULT '1st Floor',
  rate_per_month NUMERIC(10, 2) NOT NULL DEFAULT 6500,
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  assigned_member_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coworking_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  plan_type TEXT NOT NULL DEFAULT 'Monthly Dedicated',
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coworking_desks_biz ON public.coworking_desks(business_id);
CREATE INDEX IF NOT EXISTS idx_coworking_members_biz ON public.coworking_memberships(business_id);
