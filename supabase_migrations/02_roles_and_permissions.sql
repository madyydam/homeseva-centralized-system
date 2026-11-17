-- 3. BUSINESS ROLES (Dynamic per-business role catalog & credentials)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  department TEXT DEFAULT 'General',
  password TEXT NOT NULL,
  pin TEXT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, role_id)
);

ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0;
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- -----------------------------------------------------------------------------
-- 4. TABS & MODULE REGISTRY (Workspace Navigation & Capabilities)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tabs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  tab_key TEXT,
  label TEXT,
  description TEXT,
  path TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely ensure columns exist even if table was created previously by Prisma
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS tab_key TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Synchronize existing camelCase columns from Prisma to snake_case & handle constraints
DO $$
BEGIN
  -- Handle legacy Prisma NOT NULL constraints on tabs
  -- Handle legacy Prisma NOT NULL constraints on tabs
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'businessId') THEN
    ALTER TABLE public.tabs ALTER COLUMN "businessId" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'updatedAt') THEN
    ALTER TABLE public.tabs ALTER COLUMN "updatedAt" SET DEFAULT NOW();
    ALTER TABLE public.tabs ALTER COLUMN "updatedAt" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'createdAt') THEN
    ALTER TABLE public.tabs ALTER COLUMN "createdAt" SET DEFAULT NOW();
    ALTER TABLE public.tabs ALTER COLUMN "createdAt" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'type') THEN
    ALTER TABLE public.tabs ALTER COLUMN "type" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'sortOrder') THEN
    ALTER TABLE public.tabs ALTER COLUMN "sortOrder" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'isActive') THEN
    ALTER TABLE public.tabs ALTER COLUMN "isActive" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'id') THEN
    ALTER TABLE public.tabs ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'businessId') THEN
    ALTER TABLE public.tabs ALTER COLUMN "businessId" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'updatedAt') THEN
    ALTER TABLE public.tabs ALTER COLUMN "updatedAt" SET DEFAULT NOW();
    ALTER TABLE public.tabs ALTER COLUMN "updatedAt" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'createdAt') THEN
    ALTER TABLE public.tabs ALTER COLUMN "createdAt" SET DEFAULT NOW();
    ALTER TABLE public.tabs ALTER COLUMN "createdAt" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'type') THEN
    ALTER TABLE public.tabs ALTER COLUMN "type" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'sortOrder') THEN
    ALTER TABLE public.tabs ALTER COLUMN "sortOrder" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'isActive') THEN
    ALTER TABLE public.tabs ALTER COLUMN "isActive" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'id') THEN
    ALTER TABLE public.tabs ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'businessId') THEN
    UPDATE public.tabs SET business_id = "businessId" WHERE business_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'sortOrder') THEN
    UPDATE public.tabs SET sort_order = "sortOrder" WHERE sort_order IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tabs' AND column_name = 'isActive') THEN
    UPDATE public.tabs SET is_active = "isActive" WHERE is_active IS NULL;
  END IF;

  -- Ensure UNIQUE constraint on (business_id, tab_key) if not yet created
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tabs_business_id_tab_key_key'
  ) THEN
    BEGIN
      ALTER TABLE public.tabs ADD CONSTRAINT tabs_business_id_tab_key_key UNIQUE (business_id, tab_key);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. ROLE TAB ACCESS CONTROL (Granular Tab Visibility per Role)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_tab_access (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES public.business_roles(id) ON DELETE CASCADE,
  tab_id TEXT NOT NULL REFERENCES public.tabs(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, tab_id)
);

-- -----------------------------------------------------------------------------
-- 6. IMMUTABLE AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_type TEXT NOT NULL DEFAULT 'SYSTEM',
  actor_identifier TEXT,
  business_slug TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. PERFORMANCE & LOOKUP INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_business_roles_lookup ON public.business_roles(business_id, role_id);
CREATE INDEX IF NOT EXISTS idx_tabs_business ON public.tabs(business_id);
CREATE INDEX IF NOT EXISTS idx_role_tab_access ON public.role_tab_access(role_id, tab_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- -----------------------------------------------------------------------------

-- 11. SEED: BUSINESS ROLES & TABS FOR ALL 10 BUSINESSES
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  b_gentle TEXT;
  b_horeca TEXT;
  b_prefab TEXT;
  b_ecolab TEXT;
  b_cowork TEXT;
  b_fma TEXT;
  b_adjs TEXT;
  b_print TEXT;
  b_dvr TEXT;
  b_nda TEXT;
  b_real TEXT;
BEGIN
  SELECT id::text INTO b_gentle FROM public.businesses WHERE slug = 'gentle-hair-wigs';
  SELECT id::text INTO b_horeca FROM public.businesses WHERE slug = 'horeca-essentials';
  SELECT id::text INTO b_prefab FROM public.businesses WHERE slug = 'prefab-construction';
  SELECT id::text INTO b_ecolab FROM public.businesses WHERE slug = 'ecolab-distribution';
  SELECT id::text INTO b_cowork FROM public.businesses WHERE slug = 'hs-coworking';
  SELECT id::text INTO b_fma FROM public.businesses WHERE slug = 'first-mover-advantage';
  SELECT id::text INTO b_adjs FROM public.businesses WHERE slug = 'adjs';
  SELECT id::text INTO b_print FROM public.businesses WHERE slug = 'printbooth';
  SELECT id::text INTO b_dvr FROM public.businesses WHERE slug = 'dvr-enterprise';
  SELECT id::text INTO b_nda FROM public.businesses WHERE slug = 'nda-services';
  SELECT id::text INTO b_real FROM public.businesses WHERE slug = 'hs-real-estate';

  -- 1. Gentle Hair Wigs (Business 3)
  IF b_gentle IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_gentle, 'Studio Manager', 'Studio Manager', 'Studio operations, staff roster & desk oversight', 'Operations', '12345678', '1234'),
    (b_gentle, 'Cold Caller', 'Cold Caller / Telecaller', 'Dedicated telecalling, follow-ups & monthly lead sheets CRM', 'Telecalling', '12345678', '1234'),
    (b_gentle, 'Senior Wig Specialist & Stylist', 'Senior Wig Specialist & Stylist', 'Custom hair fittings, styling & cutting suites', 'Styling', '12345678', '1234'),
    (b_gentle, 'Scalp & Measurement Consultant', 'Scalp & Measurement Consultant', 'Head contouring, base templates & scalp scans', 'Consultation', '12345678', '1234'),
    (b_gentle, 'Billing & Front Desk', 'Billing & Front Desk', 'Counter POS, appointments & invoicing register', 'Front Desk', '12345678', '1234'),
    (b_gentle, 'Inventory Coordinator (Wigs & Patches)', 'Inventory Coordinator (Wigs & Patches)', 'Lace systems, patch stock, tapes & adhesives', 'Inventory', '12345678', '1234'),
    (b_gentle, 'Studio Partner / Owner', 'Studio Partner / Owner', 'Executive P&L oversight, studio audits & reports', 'Executive', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label,
      description = EXCLUDED.description,
      department = EXCLUDED.department,
      password = EXCLUDED.password,
      pin = EXCLUDED.pin,
      updated_at = NOW();

    INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
    (b_gentle, 'crm', 'CRM Leads Sheet', 'Lead management, conversion stages, notes and call tracking', 1),
    (b_gentle, 'telecalling', 'Cold Caller Desk', 'Dedicated telecaller leads, calling logs and follow-ups', 2),
    (b_gentle, 'finance', 'Finance & PnL', 'Monthly profit/loss statement, collections and expenses', 3),
    (b_gentle, 'sop', 'SOP & Knowledge Base', 'Standard Operating Procedures for fittings, consultation and care', 4),
    (b_gentle, 'google_sheets', 'Live Google Sheets', 'Direct spreadsheet synchronization and backup view', 5)
    ON CONFLICT (business_id, tab_key) DO NOTHING;
  END IF;

  -- 2. HoReCa Essentials (Business 2)
  IF b_horeca IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_horeca, 'General Manager', 'General Manager', 'Overall management of sales supply and crockery rental', 'Management', '12345678', '1234'),
    (b_horeca, 'Sales Representative (Essentials)', 'Sales Representative (Essentials)', 'Commercial cutlery, chinaware, glassware & amenities sales', 'Sales', '12345678', '1234'),
    (b_horeca, 'Rental Logistics Supervisor', 'Rental Logistics Supervisor', 'Banquet and event hire logistics, delivery & return checks', 'Rental', '12345678', '1234'),
    (b_horeca, 'Inventory & Warehousing Desk', 'Inventory & Warehousing Desk', 'Stock tracking, breakage register, and warehouse audits', 'Inventory', '12345678', '1234'),
    (b_horeca, 'Banquet Billing & Invoicing', 'Banquet Billing & Invoicing', 'Invoicing, advances, security deposits, and settlement register', 'Finance', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();

    INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
    (b_horeca, 'crockery_rental', 'Crockery Rental App', 'Bookings, calendar availability, dispatch, and returns', 1),
    (b_horeca, 'essentials_sales', 'Essentials Supply', 'B2B kitchenware supply catalog and orders', 2),
    (b_horeca, 'finance', 'Invoices & Ledger', 'Banquet invoices, advance receipts, and ledger', 3),
    (b_horeca, 'inventory', 'Inventory Master', 'Crockery item stock, broken items and cleaning queue', 4)
    ON CONFLICT (business_id, tab_key) DO NOTHING;
  END IF;

  -- 3. Prefab Construction (Business 1)
  IF b_prefab IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_prefab, 'Project Director', 'Project Director', 'Overall oversight of civil and prefab sites', 'Projects', '12345678', '1234'),
    (b_prefab, 'Civil Site Engineer', 'Civil Site Engineer', 'Daily site progress, labor supervision and quality control', 'Engineering', '12345678', '1234'),
    (b_prefab, 'Procurement & Materials Desk', 'Procurement & Materials Desk', 'Steel, sandwich panels, modular materials and vendor orders', 'Procurement', '12345678', '1234'),
    (b_prefab, 'Billing & Contract Estimator', 'Billing & Contract Estimator', 'Client milestones, RA bills, and contractor estimates', 'Commercial', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 4. Ecolab Distribution (Business 4)
  IF b_ecolab IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_ecolab, 'Distribution Manager', 'Distribution Manager', 'Institutional distribution and order dispatch oversight', 'Operations', '12345678', '1234'),
    (b_ecolab, 'Institutional Key Account Executive', 'Key Account Executive', 'Hotel, hospital and catering corporate accounts', 'Sales', '12345678', '1234'),
    (b_ecolab, 'Chemical Safety & Stock Auditor', 'Safety & Stock Auditor', 'Hazardous storage compliance, expiration tracking & QA', 'Compliance', '12345678', '1234'),
    (b_ecolab, 'Billing & Dispatch Desk', 'Billing & Dispatch Desk', 'Tax invoices, e-way bills, and dispatch manifests', 'Logistics', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 5. HS Co-working (Business 5)
  IF b_cowork IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_cowork, 'Community Manager', 'Community Manager', 'Member relations, onboarding, hot desks and cabins', 'Community', '12345678', '1234'),
    (b_cowork, 'Front Desk Coordinator', 'Front Desk Coordinator', 'Visitor reception, mail handling, and day passes', 'Reception', '12345678', '1234'),
    (b_cowork, 'Facility & Access Desk', 'Facility & Access Desk', 'Access cards, internet uptime, power backup & facilities', 'Operations', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 6. First Mover Advantage (Business 6)
  IF b_fma IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_fma, 'Product Lead', 'Product Lead', 'Roadmap, feature backlog, and release planning', 'Product', '12345678', '1234'),
    (b_fma, 'DevOps & Platform Desk', 'DevOps & Platform Desk', 'Cloud infrastructure, CI/CD, uptime, and database metrics', 'Engineering', '12345678', '1234'),
    (b_fma, 'Billing & Accounts', 'Billing & Accounts', 'Subscription billing, invoices, and payment gateways', 'Finance', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 7. ADJS / Printbooth (Business 7)
  IF b_adjs IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_adjs, 'Owner', 'Owner', 'Business P&L, kiosk unit economics & expansion', 'Executive', '12345678', '1234'),
    (b_adjs, 'Manager', 'Manager', 'Machine orders, merchant onboarding & dispatch', 'Operations', '12345678', '1234'),
    (b_adjs, 'Coldcaller', 'Coldcaller', 'B2B merchant prospecting & kiosk placement CRM', 'Sales / CRM', '12345678', '1234'),
    (b_adjs, 'Developer', 'Developer', 'Kiosk touchscreen OS, Cloud Print APIs & payment gateways', 'Engineering', '12345678', '1234'),
    (b_adjs, 'Staff', 'Staff', 'Freight dispatch logistics & merchant helpdesk', 'Support', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  IF b_print IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_print, 'Owner', 'Owner', 'Business P&L, kiosk unit economics & expansion', 'Executive', '12345678', '1234'),
    (b_print, 'Manager', 'Manager', 'Machine orders, merchant onboarding & dispatch', 'Operations', '12345678', '1234'),
    (b_print, 'Coldcaller', 'Coldcaller', 'B2B merchant prospecting & kiosk placement CRM', 'Sales / CRM', '12345678', '1234'),
    (b_print, 'Developer', 'Developer', 'Kiosk touchscreen OS, Cloud Print APIs & payment gateways', 'Engineering', '12345678', '1234'),
    (b_print, 'Staff', 'Staff', 'Freight dispatch logistics & merchant helpdesk', 'Support', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 8. DVR Enterprise (Business 8)
  IF b_dvr IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_dvr, 'Trading Manager', 'Trading Manager', 'Supplier procurement, pricing margins, wholesale orders', 'Trade', '12345678', '1234'),
    (b_dvr, 'Dispatch Coordinator', 'Dispatch Coordinator', 'Warehouse loading, transporter booking, LR receipts', 'Logistics', '12345678', '1234'),
    (b_dvr, 'Accounts Desk', 'Accounts Desk', 'Vendor ledgers, receivables collections, and reconciliation', 'Finance', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 9. NDA Services (Business 9)
  IF b_nda IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_nda, 'Operations Head', 'Operations Head', 'Client site deployments, shift rosters, and guard training', 'Security', '12345678', '1234'),
    (b_nda, 'Deployment Officer', 'Deployment Officer', 'Field patrols, biometric attendance checks, uniform audits', 'Field', '12345678', '1234'),
    (b_nda, 'Admin Desk', 'Admin Desk', 'Client agreements, billing, guard muster roll, and compliance', 'Administration', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 10. HS Real Estate (Business 10)
  IF b_real IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_real, 'Portfolio Lead', 'Portfolio Lead', 'Asset valuation, tenancy overview, yield optimization', 'Portfolio', '12345678', '1234'),
    (b_real, 'Leasing Executive', 'Leasing Executive', 'Site visits, tenant negotiations, lease drafts & renewals', 'Leasing', '12345678', '1234'),
    (b_real, 'Accounts & Legal', 'Accounts & Legal', 'Rental receivables, maintenance escrow, registered agreements', 'Legal', '12345678', '1234')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

END $$;

-- -----------------------------------------------------------------------------