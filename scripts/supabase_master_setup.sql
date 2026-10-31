-- =============================================================================
-- HOMESEVA PORTAL - MASTER SUPABASE PRODUCTION SETUP & DATA PRESERVATION
-- =============================================================================
-- THE ONLY CONSOLIDATED MASTER SQL FILE IN THE ENTIRE REPOSITORY
-- Features:
-- 1. Idempotent & Non-Destructive: Uses IF NOT EXISTS, OR REPLACE, and ON CONFLICT.
-- 2. ZERO DATA LOSS: Never drops existing tables, schemas, or production rows.
-- 3. Automatic Schema Adaptation: Safely aligns both camelCase and snake_case columns.
-- 4. Super Admin Initial Setup: username "madyydam" with verified bcrypt hashes.
-- 5. 10 Business Profiles & Isolated Workspaces.
-- 6. Complete Role Master with department segregation, passwords, & PINs.
-- 7. Dynamic Tabs & Granular Role-Tab Access Control.
-- 8. Audit Logging Architecture with indexing.
-- 9. Enterprise Row Level Security (RLS) Policies.
-- 10. HoReCa Crockery Rental Engine (Items, Bookings, Stock Ledger, Invoices, Payments).
-- =============================================================================

-- Ensure cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. SUPER ADMIN MASTER CREDENTIALS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.super_admin_credentials (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  pin4_hash TEXT NOT NULL,
  pin8_hash TEXT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. BUSINESS REGISTRY (10 Isolated Multi-Tenant Businesses)
-- Compatible with existing Prisma TEXT id or UUID
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  logo_url TEXT,
  theme_color TEXT DEFAULT 'blue',
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely ensure columns exist even if table was created previously by Prisma
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'blue';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  -- Handle legacy Prisma NOT NULL constraints without DB-level defaults
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'updatedAt') THEN
    ALTER TABLE public.businesses ALTER COLUMN "updatedAt" SET DEFAULT NOW();
    ALTER TABLE public.businesses ALTER COLUMN "updatedAt" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'createdAt') THEN
    ALTER TABLE public.businesses ALTER COLUMN "createdAt" SET DEFAULT NOW();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'id') THEN
    ALTER TABLE public.businesses ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  END IF;

  -- Synchronize data
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'isActive') THEN
    UPDATE public.businesses SET is_active = "isActive" WHERE is_active IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'logoUrl') THEN
    UPDATE public.businesses SET logo_url = "logoUrl" WHERE logo_url IS NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
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
-- 8. ROW LEVEL SECURITY (RLS) ENFORCEMENT & POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.super_admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_tab_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'businesses' AND policyname = 'public_read_active_businesses'
  ) THEN
    CREATE POLICY "public_read_active_businesses" ON public.businesses FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tabs' AND policyname = 'public_read_active_tabs'
  ) THEN
    CREATE POLICY "public_read_active_tabs" ON public.tabs FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_roles' AND policyname = 'deny_anon_business_roles'
  ) THEN
    CREATE POLICY "deny_anon_business_roles" ON public.business_roles FOR ALL USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'super_admin_credentials' AND policyname = 'deny_anon_super_admin'
  ) THEN
    CREATE POLICY "deny_anon_super_admin" ON public.super_admin_credentials FOR ALL USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'deny_anon_audit_logs'
  ) THEN
    CREATE POLICY "deny_anon_audit_logs" ON public.audit_logs FOR ALL USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'role_tab_access' AND policyname = 'deny_anon_role_tab_access'
  ) THEN
    CREATE POLICY "deny_anon_role_tab_access" ON public.role_tab_access FOR ALL USING (false);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 9. SEED: SUPER ADMIN (Confirmed credentials: madyydam, bcrypt hashed)
-- -----------------------------------------------------------------------------
INSERT INTO public.super_admin_credentials (id, username, password_hash, pin4_hash, pin8_hash, failed_attempts, locked_until)
VALUES (
  'primary',
  'madyydam',
  '$2b$10$ytkjeErV8X9Kre6IUx.xF.xh1WIoamVgkZV4W39dnILTjhD4Yp9wu',
  '$2b$10$KnS90viDCq3SzOWQXsCVheQvd18EsIKz52onXaJhiFHVnvGEnry8a',
  '$2b$10$vMg/bnOW2jmhddWDHW63/eZBh3tbXIfj/SM9OioBQPRbCVKJh5rzC',
  0,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  pin4_hash = EXCLUDED.pin4_hash,
  pin8_hash = EXCLUDED.pin8_hash,
  failed_attempts = 0,
  locked_until = NULL,
  updated_at = NOW();

-- -----------------------------------------------------------------------------
-- 10. SEED: THE 10 PRODUCTION BUSINESSES
-- -----------------------------------------------------------------------------
INSERT INTO public.businesses (id, slug, name, subtitle, description, theme_color, is_active) VALUES
(gen_random_uuid()::text, 'prefab-construction', 'Prefab Construction Solutions', 'Civil & Modular Sites', 'Civil engineering, modular building solutions and site project management', 'blue', true),
(gen_random_uuid()::text, 'horeca-essentials', 'HoReCa Essentials & Crockery Rental', 'Essentials Sales & Crockery Rental', 'B2B commercial kitchen supply and premium event/banquet crockery rentals', 'emerald', true),
(gen_random_uuid()::text, 'gentle-hair-wigs', 'Gentle Hair Wigs Studio', 'Viman Nagar, Ravet & Kolhapur', 'Custom hair systems, medical aesthetics, wig styling, and specialist consultations', 'amber', true),
(gen_random_uuid()::text, 'ecolab-distribution', 'Ecolab Institutional Distribution', 'Hygiene & Chemical Solutions', 'Commercial hygiene solutions, industrial sanitization, and chemical safety audits', 'blue', true),
(gen_random_uuid()::text, 'hs-coworking', 'HS Co-working Spaces', 'Flexible Desks & Workspaces', 'Executive co-working desks, private cabins, and collaborative team environments', 'indigo', true),
(gen_random_uuid()::text, 'first-mover-advantage', 'First Mover Advantage', 'App SaaS Platform', 'Next-generation tech platform, SaaS application ecosystems, and platform development', 'cyan', true),
(gen_random_uuid()::text, 'printbooth', 'Printbooth Digital Printing', 'Digital & Commercial Printing', 'Large format commercial printing, branded packaging, promotional merchandise', 'purple', true),
(gen_random_uuid()::text, 'dvr-enterprise', 'DVR Enterprise', 'Commercial Trading & Supplies', 'Industrial goods trading, wholesale material distribution, and supply chain solutions', 'orange', true),
(gen_random_uuid()::text, 'nda-services', 'NDA Security & Facility Care', 'Security & Facility Care', 'Facility upkeep, manned guarding, surveillance deployments, and corporate security', 'sky', true),
(gen_random_uuid()::text, 'hs-real-estate', 'HS Real Estate & Assets', 'Property Leasing & Assets', 'Commercial leasing, high-yield asset portfolios, and legal conveyance management', 'rose', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  theme_color = EXCLUDED.theme_color,
  is_active = true,
  updated_at = NOW();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'updatedAt') THEN
    UPDATE public.businesses SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
  END IF;
END $$;

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
  SELECT id::text INTO b_print FROM public.businesses WHERE slug = 'printbooth';
  SELECT id::text INTO b_dvr FROM public.businesses WHERE slug = 'dvr-enterprise';
  SELECT id::text INTO b_nda FROM public.businesses WHERE slug = 'nda-services';
  SELECT id::text INTO b_real FROM public.businesses WHERE slug = 'hs-real-estate';

  -- 1. Gentle Hair Wigs (Business 3)
  IF b_gentle IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_gentle, 'Studio Manager', 'Studio Manager', 'Studio operations, staff roster & desk oversight', 'Operations', 'GentleHair@123', '2408'),
    (b_gentle, 'Cold Caller', 'Cold Caller / Telecaller', 'Dedicated telecalling, follow-ups & monthly lead sheets CRM', 'Telecalling', 'Telecaller@123', '1100'),
    (b_gentle, 'Senior Wig Specialist & Stylist', 'Senior Wig Specialist & Stylist', 'Custom hair fittings, styling & cutting suites', 'Styling', 'Stylist@123', '3300'),
    (b_gentle, 'Scalp & Measurement Consultant', 'Scalp & Measurement Consultant', 'Head contouring, base templates & scalp scans', 'Consultation', 'Consultant@123', '4400'),
    (b_gentle, 'Billing & Front Desk', 'Billing & Front Desk', 'Counter POS, appointments & invoicing register', 'Front Desk', 'Billing@123', '5500'),
    (b_gentle, 'Inventory Coordinator (Wigs & Patches)', 'Inventory Coordinator (Wigs & Patches)', 'Lace systems, patch stock, tapes & adhesives', 'Inventory', 'Stock@123', '6600'),
    (b_gentle, 'Studio Partner / Owner', 'Studio Partner / Owner', 'Executive P&L oversight, studio audits & reports', 'Executive', 'Owner@123', '9999')
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
    (b_horeca, 'General Manager', 'General Manager', 'Overall management of sales supply and crockery rental', 'Management', 'Horeca@123', '2020'),
    (b_horeca, 'Sales Representative (Essentials)', 'Sales Representative (Essentials)', 'Commercial cutlery, chinaware, glassware & amenities sales', 'Sales', 'Sales@123', '2100'),
    (b_horeca, 'Rental Logistics Supervisor', 'Rental Logistics Supervisor', 'Banquet and event hire logistics, delivery & return checks', 'Rental', 'Rental@123', '2200'),
    (b_horeca, 'Inventory & Warehousing Desk', 'Inventory & Warehousing Desk', 'Stock tracking, breakage register, and warehouse audits', 'Inventory', 'Warehouse@123', '2300'),
    (b_horeca, 'Banquet Billing & Invoicing', 'Banquet Billing & Invoicing', 'Invoicing, advances, security deposits, and settlement register', 'Finance', 'Billing@123', '2400')
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
    (b_prefab, 'Project Director', 'Project Director', 'Overall oversight of civil and prefab sites', 'Projects', 'Prefab@123', '1010'),
    (b_prefab, 'Civil Site Engineer', 'Civil Site Engineer', 'Daily site progress, labor supervision and quality control', 'Engineering', 'Engineer@123', '1020'),
    (b_prefab, 'Procurement & Materials Desk', 'Procurement & Materials Desk', 'Steel, sandwich panels, modular materials and vendor orders', 'Procurement', 'Procure@123', '1030'),
    (b_prefab, 'Billing & Contract Estimator', 'Billing & Contract Estimator', 'Client milestones, RA bills, and contractor estimates', 'Commercial', 'Billing@123', '1040')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 4. Ecolab Distribution (Business 4)
  IF b_ecolab IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_ecolab, 'Distribution Manager', 'Distribution Manager', 'Institutional distribution and order dispatch oversight', 'Operations', 'Ecolab@123', '4010'),
    (b_ecolab, 'Institutional Key Account Executive', 'Key Account Executive', 'Hotel, hospital and catering corporate accounts', 'Sales', 'Accounts@123', '4020'),
    (b_ecolab, 'Chemical Safety & Stock Auditor', 'Safety & Stock Auditor', 'Hazardous storage compliance, expiration tracking & QA', 'Compliance', 'Auditor@123', '4030'),
    (b_ecolab, 'Billing & Dispatch Desk', 'Billing & Dispatch Desk', 'Tax invoices, e-way bills, and dispatch manifests', 'Logistics', 'Dispatch@123', '4040')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 5. HS Co-working (Business 5)
  IF b_cowork IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_cowork, 'Community Manager', 'Community Manager', 'Member relations, onboarding, hot desks and cabins', 'Community', 'Cowork@123', '5010'),
    (b_cowork, 'Front Desk Coordinator', 'Front Desk Coordinator', 'Visitor reception, mail handling, and day passes', 'Reception', 'FrontDesk@123', '5020'),
    (b_cowork, 'Facility & Access Desk', 'Facility & Access Desk', 'Access cards, internet uptime, power backup & facilities', 'Operations', 'Facility@123', '5030')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 6. First Mover Advantage (Business 6)
  IF b_fma IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_fma, 'Product Lead', 'Product Lead', 'Roadmap, feature backlog, and release planning', 'Product', 'Product@123', '6010'),
    (b_fma, 'DevOps & Platform Desk', 'DevOps & Platform Desk', 'Cloud infrastructure, CI/CD, uptime, and database metrics', 'Engineering', 'Platform@123', '6020'),
    (b_fma, 'Billing & Accounts', 'Billing & Accounts', 'Subscription billing, invoices, and payment gateways', 'Finance', 'Finance@123', '6030')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 7. Printbooth (Business 7)
  IF b_print IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_print, 'Production Supervisor', 'Production Supervisor', 'Job queue scheduling, print runs and quality checks', 'Production', 'Print@123', '7010'),
    (b_print, 'Machine Operator', 'Machine Operator', 'Digital presses, flex printing, laminators, cutting plotters', 'Press', 'Operator@123', '7020'),
    (b_print, 'Counter & Delivery Desk', 'Counter & Delivery Desk', 'Customer counter, packaging, billing, and parcel dispatch', 'Dispatch', 'Counter@123', '7030')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 8. DVR Enterprise (Business 8)
  IF b_dvr IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_dvr, 'Trading Manager', 'Trading Manager', 'Supplier procurement, pricing margins, wholesale orders', 'Trade', 'Trading@123', '8010'),
    (b_dvr, 'Dispatch Coordinator', 'Dispatch Coordinator', 'Warehouse loading, transporter booking, LR receipts', 'Logistics', 'Dispatch@123', '8020'),
    (b_dvr, 'Accounts Desk', 'Accounts Desk', 'Vendor ledgers, receivables collections, and reconciliation', 'Finance', 'Accounts@123', '8030')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 9. NDA Services (Business 9)
  IF b_nda IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_nda, 'Operations Head', 'Operations Head', 'Client site deployments, shift rosters, and guard training', 'Security', 'Security@123', '9010'),
    (b_nda, 'Deployment Officer', 'Deployment Officer', 'Field patrols, biometric attendance checks, uniform audits', 'Field', 'Officer@123', '9020'),
    (b_nda, 'Admin Desk', 'Admin Desk', 'Client agreements, billing, guard muster roll, and compliance', 'Administration', 'Admin@123', '9030')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

  -- 10. HS Real Estate (Business 10)
  IF b_real IS NOT NULL THEN
    INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
    (b_real, 'Portfolio Lead', 'Portfolio Lead', 'Asset valuation, tenancy overview, yield optimization', 'Portfolio', 'Property@123', '1110'),
    (b_real, 'Leasing Executive', 'Leasing Executive', 'Site visits, tenant negotiations, lease drafts & renewals', 'Leasing', 'Leasing@123', '1120'),
    (b_real, 'Accounts & Legal', 'Accounts & Legal', 'Rental receivables, maintenance escrow, registered agreements', 'Legal', 'Legal@123', '1130')
    ON CONFLICT (business_id, role_id) DO UPDATE SET
      label = EXCLUDED.label, description = EXCLUDED.description, department = EXCLUDED.department, password = EXCLUDED.password, pin = EXCLUDED.pin, updated_at = NOW();
  END IF;

END $$;

-- -----------------------------------------------------------------------------
-- 12. HORECA CROCKERY RENTAL ENGINE & OPERATIONAL TABLES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('quotation', 'confirmed', 'dispatched', 'returned', 'closed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  total_quantity INTEGER NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
  pack_size INTEGER NOT NULL DEFAULT 1 CHECK (pack_size >= 1),
  rent_per_day NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (rent_per_day >= 0),
  replacement_cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (replacement_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  event_type TEXT NOT NULL DEFAULT '',
  event_date DATE,
  delivery_date DATE NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date DATE,
  transport_charge NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (transport_charge >= 0),
  advance_paid NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (advance_paid >= 0),
  status public.booking_status NOT NULL DEFAULT 'quotation',
  dispatched_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expected_return_date >= delivery_date)
);

CREATE TABLE IF NOT EXISTS public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  dispatched_quantity INTEGER NOT NULL DEFAULT 0 CHECK (dispatched_quantity >= 0),
  returned_good INTEGER NOT NULL DEFAULT 0 CHECK (returned_good >= 0),
  returned_broken INTEGER NOT NULL DEFAULT 0 CHECK (returned_broken >= 0),
  UNIQUE (booking_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type in ('dispatch','return_good','return_broken','missing','purchase','adjustment')),
  owned_change INTEGER NOT NULL DEFAULT 0,
  rented_change INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_number BIGINT NOT NULL DEFAULT nextval('public.invoice_number_seq'),
  delivery_date DATE NOT NULL,
  return_date DATE NOT NULL,
  rent_days INTEGER NOT NULL,
  rent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  transport_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  damage_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by UUID
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method in ('cash','upi','bank_transfer')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON public.booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_item ON public.booking_items(item_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_delivery ON public.bookings(delivery_date);
CREATE INDEX IF NOT EXISTS idx_bookings_return ON public.bookings(expected_return_date);
CREATE INDEX IF NOT EXISTS idx_ledger_item ON public.stock_ledger(item_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);

-- Crockery Rental Seed Items
INSERT INTO public.items (name, category, total_quantity, pack_size, rent_per_day, replacement_cost) VALUES
  ('Dinner Plate', 'Plates', 500, 10, 5.00, 150.00),
  ('Quarter Plate', 'Plates', 400, 10, 3.00, 90.00),
  ('Curry Bowl', 'Bowls', 600, 12, 2.00, 60.00),
  ('Water Glass', 'Glasses', 800, 6, 2.00, 45.00),
  ('Tea Cup with Saucer', 'Cups', 300, 6, 3.00, 120.00),
  ('Spoon', 'Cutlery', 1000, 12, 1.00, 15.00)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SEQUENCE public.invoice_number_seq TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
