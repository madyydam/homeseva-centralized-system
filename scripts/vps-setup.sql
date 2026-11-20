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
  '$2b$10$2HgmHfakW8PSkI8DynNNT./WnAxuLt7aaf62lZFwFGmoP1ru/KVSC',
  '$2b$10$XUv/rXecQsoxByDuRsfBwezToPfAnDV2EvpoLX8PliZv3.7OoAzE6',
  '$2b$10$VNraDf89t3Jrow7iKdmwuOtMySaLEhIpED40efICcuZhMPxYZU7Jq',
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
(gen_random_uuid()::text, 'adjs', 'ADJS - PRINTBOOTH™', 'Smart Self-Service Printing Kiosks', 'Parent company for smart automated kiosks, merchant printing networks, and PRINTBOOTH™ business solutions', 'purple', true),
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

-- -----------------------------------------------------------------------------
-- 15. TELECALLER DAILY REPORTING & ATTENDANCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telecaller_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT '3',
  business_slug TEXT NOT NULL DEFAULT 'gentle-hair-wigs',
  branch TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  punch_in_time TEXT,
  punch_out_time TEXT,
  total_hours NUMERIC(4,2) DEFAULT 0.0,
  calls_made INTEGER DEFAULT 0,
  calls_connected INTEGER DEFAULT 0,
  appointments_booked INTEGER DEFAULT 0,
  converted_clients INTEGER DEFAULT 0,
  follow_ups_due INTEGER DEFAULT 0,
  work_summary TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PRESENT',
  is_holiday BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, report_date, branch)
);

CREATE INDEX IF NOT EXISTS idx_telecaller_reports_date ON public.telecaller_daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_telecaller_reports_branch ON public.telecaller_daily_reports(branch);

-- Grant permissions
GRANT USAGE ON SEQUENCE public.invoice_number_seq TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;


-- =============================================================================
-- HOMESEVA - MEMBER SYSTEM & PRINTBOOTH DAILY REPORTS MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- 1. ROLE MEMBERS TABLE (Multi-user per role)
CREATE TABLE IF NOT EXISTS public.role_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  pin TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT role_members_business_role_email_unique UNIQUE (business_id, role_id, email)
);


-- Ensure constraint compatibility if table was partially created
ALTER TABLE public.role_members DROP CONSTRAINT IF EXISTS role_members_business_email_unique;
ALTER TABLE public.role_members DROP CONSTRAINT IF EXISTS role_members_email_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_members_business_role_email_unique'
  ) THEN
    ALTER TABLE public.role_members ADD CONSTRAINT role_members_business_role_email_unique UNIQUE (business_id, role_id, email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_role_members_business_role ON public.role_members(business_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_members_email ON public.role_members(email);

ALTER TABLE public.role_members ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'role_members' AND policyname = 'deny_anon_role_members'
  ) THEN
    CREATE POLICY "deny_anon_role_members" ON public.role_members FOR ALL USING (false);
  END IF;
END $$;

-- 2. PRINTBOOTH DAILY REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.printbooth_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  punch_in TEXT,
  punch_out TEXT,
  calls_made INT NOT NULL DEFAULT 0,
  machines_sold INT NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT printbooth_daily_reports_member_date_unique UNIQUE (member_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_printbooth_reports_member_date ON public.printbooth_daily_reports(member_id, report_date);

ALTER TABLE public.printbooth_daily_reports ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'printbooth_daily_reports' AND policyname = 'deny_anon_printbooth_reports'
  ) THEN
    CREATE POLICY "deny_anon_printbooth_reports" ON public.printbooth_daily_reports FOR ALL USING (false);
  END IF;
END $$;

-- 3. SEED UNIVERSAL DEMO MEMBER (abc@xyz.com / 12345678 / 1234) FOR ALL 45 ROLES
INSERT INTO public.role_members (business_id, role_id, name, email, password, pin)
VALUES
  ('0178c937-18ce-4bd3-900c-ceb67195d0d8', 'Operations Head', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('0178c937-18ce-4bd3-900c-ceb67195d0d8', 'Admin Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('0178c937-18ce-4bd3-900c-ceb67195d0d8', 'Deployment Officer', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('0d900d63-d53d-4870-a4a9-8fb0435fd55f', 'Coldcaller', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('0d900d63-d53d-4870-a4a9-8fb0435fd55f', 'Staff', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('0d900d63-d53d-4870-a4a9-8fb0435fd55f', 'Developer', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('0d900d63-d53d-4870-a4a9-8fb0435fd55f', 'Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('0d900d63-d53d-4870-a4a9-8fb0435fd55f', 'Owner', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('1', 'Billing & Contract Estimator', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('1', 'Project Director', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('1', 'Procurement & Materials Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('1', 'Civil Site Engineer', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('1de2e728-7e90-4730-8dfa-750cd3bf1086', 'Billing & Accounts', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('1de2e728-7e90-4730-8dfa-750cd3bf1086', 'Product Lead', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('1de2e728-7e90-4730-8dfa-750cd3bf1086', 'DevOps & Platform Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('2', 'Rental Logistics Supervisor', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('2', 'Sales Representative (Essentials)', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('2', 'Inventory & Warehousing Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('2', 'Banquet Billing & Invoicing', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('2', 'General Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('25cdeb20-99cb-43da-91cb-3d25b1280231', 'Facility & Access Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('25cdeb20-99cb-43da-91cb-3d25b1280231', 'Community Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('25cdeb20-99cb-43da-91cb-3d25b1280231', 'Front Desk Coordinator', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('3', 'Cold Caller', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('3', 'Cold Caller', 'Caller 2 (Pooja)', 'pooja@gentlehairwigs.com', '12345678', '1234'),
  ('3', 'Scalp & Measurement Consultant', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('3', 'Senior Wig Specialist & Stylist', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('3', 'Studio Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('3', 'Inventory Coordinator (Wigs & Patches)', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('3', 'Billing & Front Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('3', 'Studio Partner / Owner', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('4', 'Distribution Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('4', 'Institutional Key Account Executive', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('4', 'Chemical Safety & Stock Auditor', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('4', 'Billing & Dispatch Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('4474711a-525e-4544-b3c2-513ade9426ea', 'Portfolio Lead', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('4474711a-525e-4544-b3c2-513ade9426ea', 'Leasing Executive', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('4474711a-525e-4544-b3c2-513ade9426ea', 'Accounts & Legal', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('6b285697-bb63-4782-a3d5-930ce59e33d0', 'Staff', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('6b285697-bb63-4782-a3d5-930ce59e33d0', 'Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('6b285697-bb63-4782-a3d5-930ce59e33d0', 'Developer', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('6b285697-bb63-4782-a3d5-930ce59e33d0', 'Owner', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('6b285697-bb63-4782-a3d5-930ce59e33d0', 'Coldcaller', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('6b285697-bb63-4782-a3d5-930ce59e33d0', 'Coldcaller', 'Caller 2 (Aakash)', 'aakash@printbooth.in', '12345678', '1234'),
  ('f9d7e763-d4b9-451e-b173-d8edec97e752', 'Accounts Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('f9d7e763-d4b9-451e-b173-d8edec97e752', 'Dispatch Coordinator', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('f9d7e763-d4b9-451e-b173-d8edec97e752', 'Trading Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234')
ON CONFLICT (business_id, role_id, email) DO UPDATE SET
  password = EXCLUDED.password,
  pin = EXCLUDED.pin,
  name = EXCLUDED.name,
  role_id = EXCLUDED.role_id,
  is_active = true,
  updated_at = NOW();

-- -----------------------------------------------------------------------------
-- 18. COLD CALLER LEADS DATA ISOLATION (GENTLE HAIR WIGS & PRINTBOOTH)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gentle_crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT '3',
  telecaller_id TEXT,
  telecaller_name TEXT,
  telecaller_email TEXT,
  sr_no INT,
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  studio_name TEXT NOT NULL DEFAULT 'Studio of Viman Nagar',
  client_name TEXT NOT NULL DEFAULT 'Inquiry',
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Interested',
  custom_status_text TEXT,
  call_count INT NOT NULL DEFAULT 0,
  notes_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  city TEXT,
  source TEXT,
  stage TEXT,
  hair_loss_concern TEXT,
  interest_category TEXT,
  estimated_budget NUMERIC(12, 2),
  assigned_specialist TEXT,
  last_contact_date TEXT,
  next_follow_up_date TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'Normal',
  lead_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_caller ON public.gentle_crm_leads(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_business ON public.gentle_crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_phone ON public.gentle_crm_leads(phone);

CREATE TABLE IF NOT EXISTS public.printbooth_crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'adjs',
  telecaller_id TEXT,
  telecaller_name TEXT,
  telecaller_email TEXT,
  sr_no INT,
  client_name TEXT NOT NULL DEFAULT 'Merchant Inquiry',
  phone TEXT NOT NULL,
  shop_name TEXT,
  location_category TEXT,
  city TEXT,
  kiosk_model TEXT,
  units_ordered INT DEFAULT 1,
  installation_city TEXT,
  status TEXT NOT NULL DEFAULT 'Interested',
  custom_status_text TEXT,
  call_count INT NOT NULL DEFAULT 0,
  notes_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_caller ON public.printbooth_crm_leads(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_business ON public.printbooth_crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_phone ON public.printbooth_crm_leads(phone);



-- =============================================================================
-- 19. GENTLE HAIR WIGS OPERATIONAL & STUDIO SCHEMA (PRISMA + SUPABASE HARMONIZED)
-- =============================================================================

-- Ensure gentle_leads table exists for Prisma ORM compatibility
CREATE TABLE IF NOT EXISTS public.gentle_leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  sr_no INT,
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  studio_name TEXT NOT NULL DEFAULT 'Studio of Viman Nagar',
  client_name TEXT NOT NULL DEFAULT 'Inquiry',
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Interested',
  custom_status_text TEXT,
  call_count INT NOT NULL DEFAULT 0,
  notes_list TEXT[] DEFAULT '{}',
  city TEXT,
  source TEXT,
  stage TEXT,
  hair_loss_concern TEXT,
  interest_category TEXT,
  estimated_budget NUMERIC(12, 2),
  assigned_specialist TEXT,
  telecaller_id TEXT,
  telecaller_name TEXT,
  telecaller_email TEXT,
  last_contact_date TEXT,
  next_follow_up_date TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'Normal',
  lead_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CamelCase column support if created via Prisma migration
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "srNo" INT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "studioName" TEXT DEFAULT 'Studio of Viman Nagar';
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "clientName" TEXT DEFAULT 'Inquiry';
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "customStatusText" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "callCount" INT DEFAULT 0;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "notesList" TEXT[] DEFAULT '{}';
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "hairLossConcern" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "interestCategory" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "estimatedBudget" NUMERIC(12, 2);
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "assignedSpecialist" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "telecallerId" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "telecallerName" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "telecallerEmail" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "lastContactDate" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "nextFollowUpDate" TEXT;
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "leadDate" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_leads ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_gentle_leads_biz_studio ON public.gentle_leads(business_id, studio_slug);
CREATE INDEX IF NOT EXISTS idx_gentle_leads_phone ON public.gentle_leads(phone);
CREATE INDEX IF NOT EXISTS idx_gentle_leads_telecaller ON public.gentle_leads(telecaller_id);

-- Harmonize gentle_crm_leads and gentle_leads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'gentle_crm_leads') AND
     NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gentle_crm_leads') THEN
    CREATE VIEW public.gentle_crm_leads AS SELECT * FROM public.gentle_leads;
  END IF;
END $$;

-- Gentle Hair Wigs Orders
CREATE TABLE IF NOT EXISTS public.gentle_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wig_type TEXT NOT NULL,
  density TEXT NOT NULL,
  hair_length TEXT NOT NULL,
  hair_shade TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fitting_date TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Measurements Recorded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CamelCase Prisma support
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "wigType" TEXT;
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "hairLength" TEXT;
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "hairShade" TEXT;
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "advancePaid" NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "fittingDate" TEXT;
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_orders ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_gentle_orders_biz_studio ON public.gentle_orders(business_id, studio_slug);

-- Gentle Hair Wigs Measurements
CREATE TABLE IF NOT EXISTS public.gentle_measurements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  hair_loss_type TEXT NOT NULL,
  circumference TEXT NOT NULL,
  front_to_nape TEXT NOT NULL,
  ear_to_ear TEXT NOT NULL,
  temple_to_temple TEXT NOT NULL,
  base_size TEXT NOT NULL,
  base_material TEXT NOT NULL,
  attachment_method TEXT NOT NULL,
  notes TEXT,
  recorded_at TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "hairLossType" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "frontToNape" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "earToEar" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "templeToTemple" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "baseSize" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "baseMaterial" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "attachmentMethod" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "recordedAt" TEXT;
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_measurements ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_gentle_measurements_biz_studio ON public.gentle_measurements(business_id, studio_slug);

-- Gentle Hair Wigs Appointments
CREATE TABLE IF NOT EXISTS public.gentle_appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  suite TEXT NOT NULL,
  stylist_name TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "serviceType" TEXT;
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "stylistName" TEXT;
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "appointmentDate" TEXT;
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "timeSlot" TEXT;
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_appointments ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_gentle_appointments_biz_studio ON public.gentle_appointments(business_id, studio_slug);

-- Gentle Hair Wigs Inventory
CREATE TABLE IF NOT EXISTS public.gentle_inventory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Units',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_inventory ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_inventory ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_inventory ADD COLUMN IF NOT EXISTS "stockQuantity" INT DEFAULT 0;
ALTER TABLE public.gentle_inventory ADD COLUMN IF NOT EXISTS "reorderLevel" INT DEFAULT 0;
ALTER TABLE public.gentle_inventory ADD COLUMN IF NOT EXISTS "unitPrice" NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.gentle_inventory ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_inventory ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_gentle_inventory_biz_studio ON public.gentle_inventory(business_id, studio_slug);

-- Gentle Hair Wigs Invoices
CREATE TABLE IF NOT EXISTS public.gentle_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  items_summary TEXT NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'UPI / QR Pay',
  payment_status TEXT NOT NULL DEFAULT 'Paid',
  invoice_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "itemsSummary" TEXT;
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "gstAmount" NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "paymentMode" TEXT DEFAULT 'UPI / QR Pay';
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'Paid';
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "invoiceDate" TEXT;
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_invoices ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_gentle_invoices_biz_studio ON public.gentle_invoices(business_id, studio_slug);

-- Gentle Hair Wigs Studios
CREATE TABLE IF NOT EXISTS public.gentle_studios (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  address TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, slug)
);

ALTER TABLE public.gentle_studios ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_studios ADD COLUMN IF NOT EXISTS "shortName" TEXT;
ALTER TABLE public.gentle_studios ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN DEFAULT false;
ALTER TABLE public.gentle_studios ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_studios ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Seed Default Studios for Gentle Hair Wigs
INSERT INTO public.gentle_studios (business_id, slug, name, short_name, address)
VALUES
  ('3', 'viman-nagar', 'Studio of Viman Nagar', 'Viman Nagar', 'Phoenix Marketcity Area, Viman Nagar, Pune'),
  ('3', 'koregaon-park', 'Studio of Koregaon Park', 'Koregaon Park', 'North Main Road, Koregaon Park, Pune'),
  ('3', 'baner', 'Studio of Baner', 'Baner', 'High Street, Baner, Pune'),
  ('3', 'fc-road', 'Studio of FC Road', 'FC Road', 'Fergusson College Road, Shivajinagar, Pune'),
  ('3', 'wakad', 'Studio of Wakad', 'Wakad', 'Dutt Mandir Road, Wakad, Pune')
ON CONFLICT (business_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  address = EXCLUDED.address;

-- Gentle Hair Wigs Finance Transactions
CREATE TABLE IF NOT EXISTS public.gentle_finance_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  month TEXT NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'UPI / QR Pay',
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_finance_transactions ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_finance_transactions ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_finance_transactions ADD COLUMN IF NOT EXISTS "paymentMode" TEXT DEFAULT 'UPI / QR Pay';
ALTER TABLE public.gentle_finance_transactions ADD COLUMN IF NOT EXISTS "recordedBy" TEXT;
ALTER TABLE public.gentle_finance_transactions ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_finance_transactions ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_gentle_finance_biz_month ON public.gentle_finance_transactions(business_id, month);

-- Gentle Hair Wigs Assets
CREATE TABLE IF NOT EXISTS public.gentle_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  condition TEXT NOT NULL DEFAULT 'Good',
  purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  last_service_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_assets ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_assets ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_assets ADD COLUMN IF NOT EXISTS "purchaseCost" NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.gentle_assets ADD COLUMN IF NOT EXISTS "lastServiceDate" TEXT;
ALTER TABLE public.gentle_assets ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_assets ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Gentle Hair Wigs Daily Tasks
CREATE TABLE IF NOT EXISTS public.gentle_daily_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  task_title TEXT NOT NULL,
  category TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "taskTitle" TEXT;
ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "assignedTo" TEXT;
ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "timeSlot" TEXT;
ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "completedAt" TEXT;
ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_daily_tasks ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Gentle Hair Wigs Call Logs
CREATE TABLE IF NOT EXISTS public.gentle_call_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT '3',
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  call_type TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gentle_call_logs ADD COLUMN IF NOT EXISTS "businessId" TEXT DEFAULT '3';
ALTER TABLE public.gentle_call_logs ADD COLUMN IF NOT EXISTS "studioSlug" TEXT DEFAULT 'viman-nagar';
ALTER TABLE public.gentle_call_logs ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE public.gentle_call_logs ADD COLUMN IF NOT EXISTS "callType" TEXT;
ALTER TABLE public.gentle_call_logs ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gentle_call_logs ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 20. PRINTBOOTH MACHINE ORDERS & SUPPORT TICKETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.printbooth_machine_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'adjs',
  order_number TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  shop_name TEXT,
  kiosk_model TEXT NOT NULL,
  units INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'Order Booked',
  city TEXT NOT NULL,
  order_date TEXT NOT NULL,
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_printbooth_orders_biz ON public.printbooth_machine_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_orders_phone ON public.printbooth_machine_orders(phone);

CREATE TABLE IF NOT EXISTS public.printbooth_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'adjs',
  ticket_number TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_printbooth_tickets_biz ON public.printbooth_support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_tickets_phone ON public.printbooth_support_tickets(phone);

-- =============================================================================
-- 21. ENTERPRISE DATABASE BACKUP & RESTORE PACKAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'PENDING',
  triggered_by TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.backup_packages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id TEXT NOT NULL REFERENCES public.backup_jobs(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  file_path TEXT,
  file_size_bytes BIGINT,
  checksum TEXT,
  encrypted_at TIMESTAMPTZ,
  schema_version TEXT DEFAULT '1.0.0',
  downloaded_at TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,
  retention_rule TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_packages_job ON public.backup_packages(job_id);
CREATE INDEX IF NOT EXISTS idx_backup_packages_biz ON public.backup_packages(business_id);

-- =============================================================================
-- 22. ENTERPRISE EMPLOYEES, FINANCE ENTRIES & MONTHLY SUMMARIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  designation TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  joining_date DATE,
  leaving_date DATE,
  reporting_manager TEXT,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_biz ON public.employees(business_id);

CREATE TABLE IF NOT EXISTS public.finance_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  category TEXT NOT NULL,
  description TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  attachment_url TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_entries_biz_date ON public.finance_entries(business_id, entry_date);

CREATE TABLE IF NOT EXISTS public.monthly_summaries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL,
  total_sales NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  salary_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, year, month)
);

CREATE TABLE IF NOT EXISTS public.sheet_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  google_sheet_url TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 23. CROCKERY RENTAL DEDICATED RELATIONAL ENGINE & INVOICING DDL
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.crockery_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pack_size INTEGER NOT NULL DEFAULT 1,
  rent_per_day NUMERIC(10,2) NOT NULL DEFAULT 0,
  rent_basis TEXT NOT NULL DEFAULT 'per_day',
  replacement_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  in_godown INTEGER NOT NULL DEFAULT 0,
  out_on_rent INTEGER NOT NULL DEFAULT 0,
  in_cleaning INTEGER NOT NULL DEFAULT 0,
  written_off INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  image TEXT,
  low_stock_threshold INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crockery_items_biz ON public.crockery_items(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_items_cat ON public.crockery_items(category);

CREATE TABLE IF NOT EXISTS public.crockery_customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  address TEXT NOT NULL,
  gstin TEXT,
  tag TEXT NOT NULL DEFAULT 'regular',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crockery_customers_biz ON public.crockery_customers(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_customers_phone ON public.crockery_customers(phone);

CREATE TABLE IF NOT EXISTS public.crockery_bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  booking_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES public.crockery_customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Wedding',
  event_date TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  expected_return_date TEXT NOT NULL,
  actual_return_date TEXT,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  contact_person TEXT,
  status TEXT NOT NULL DEFAULT 'Quotation',
  transport_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  damage_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  late_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  dispatched_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  dispatched_by TEXT,
  vehicle_details TEXT,
  signature_dispatch TEXT,
  signature_return TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crockery_bookings_biz ON public.crockery_bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_bookings_status ON public.crockery_bookings(status);
CREATE INDEX IF NOT EXISTS idx_crockery_bookings_phone ON public.crockery_bookings(customer_phone);

CREATE TABLE IF NOT EXISTS public.crockery_booking_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  booking_id TEXT NOT NULL REFERENCES public.crockery_bookings(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'plates',
  pack_size INTEGER NOT NULL DEFAULT 1,
  quantity INTEGER NOT NULL DEFAULT 1,
  dispatched_quantity INTEGER NOT NULL DEFAULT 0,
  returned_good INTEGER NOT NULL DEFAULT 0,
  returned_broken INTEGER NOT NULL DEFAULT 0,
  returned_missing INTEGER NOT NULL DEFAULT 0,
  rate_snapshot NUMERIC(10,2) NOT NULL DEFAULT 0,
  rent_basis TEXT NOT NULL DEFAULT 'per_day',
  replacement_cost_snapshot NUMERIC(10,2) NOT NULL DEFAULT 0,
  damage_grade TEXT
);
CREATE INDEX IF NOT EXISTS idx_crockery_booking_items_bk ON public.crockery_booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_crockery_booking_items_it ON public.crockery_booking_items(item_id);

CREATE TABLE IF NOT EXISTS public.crockery_stock_movements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  bucket_from TEXT,
  bucket_to TEXT,
  booking_id TEXT,
  booking_number TEXT,
  "user" TEXT NOT NULL DEFAULT 'Staff',
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crockery_stock_mov_biz ON public.crockery_stock_movements(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_stock_mov_it ON public.crockery_stock_movements(item_id);

CREATE TABLE IF NOT EXISTS public.crockery_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  firm TEXT NOT NULL DEFAULT 'someshwar',
  invoice_number TEXT NOT NULL UNIQUE,
  financial_year TEXT NOT NULL DEFAULT '2026-27',
  booking_id TEXT NOT NULL,
  booking_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_gstin TEXT,
  consignee_name TEXT,
  consignee_address TEXT,
  consignee_gstin TEXT,
  delivery_note TEXT,
  dispatch_doc_no TEXT,
  delivery_date TEXT NOT NULL,
  return_date TEXT NOT NULL,
  event_date TEXT,
  rent_days INTEGER NOT NULL DEFAULT 1,
  rent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  transport_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  damage_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  late_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  round_off NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by TEXT NOT NULL DEFAULT 'Billing Staff',
  remarks TEXT
);
CREATE INDEX IF NOT EXISTS idx_crockery_inv_biz ON public.crockery_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_inv_bk ON public.crockery_invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_crockery_inv_status ON public.crockery_invoices(status);

CREATE TABLE IF NOT EXISTS public.crockery_invoice_lines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  invoice_id TEXT NOT NULL REFERENCES public.crockery_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  particulars TEXT,
  hsn_sac TEXT DEFAULT '997319',
  quantity INTEGER NOT NULL DEFAULT 1,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  per TEXT DEFAULT 'Nos',
  days INTEGER DEFAULT 1,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'rent'
);
CREATE INDEX IF NOT EXISTS idx_crockery_inv_lines_inv ON public.crockery_invoice_lines(invoice_id);

CREATE TABLE IF NOT EXISTS public.crockery_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  booking_id TEXT NOT NULL,
  booking_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'UPI',
  reference TEXT,
  notes TEXT,
  date TEXT NOT NULL,
  received_by TEXT NOT NULL DEFAULT 'Staff',
  direction TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crockery_payments_biz ON public.crockery_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_payments_bk ON public.crockery_payments(booking_id);

CREATE TABLE IF NOT EXISTS public.crockery_package_combos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'horeca-essentials',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  suggested_guests INTEGER NOT NULL DEFAULT 100,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crockery_package_combos_biz ON public.crockery_package_combos(business_id);

CREATE TABLE IF NOT EXISTS public.crockery_business_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL UNIQUE DEFAULT 'horeca-essentials',
  name TEXT NOT NULL DEFAULT 'HomeSeva Crockery & Catering Rentals',
  tagline TEXT NOT NULL DEFAULT 'Commercial Tableware, Glassware & Buffet Catering Equipment Hire',
  phone TEXT NOT NULL DEFAULT '+91 98765 00000',
  alt_phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT 'rentals@homeseva.com',
  address TEXT NOT NULL DEFAULT 'HomeSeva Central Logistics Hub',
  gstin TEXT NOT NULL DEFAULT '',
  upi_id TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  ifsc TEXT NOT NULL DEFAULT '',
  terms_conditions TEXT NOT NULL DEFAULT '1. All counts must be verified upon delivery and return.\n2. Broken or missing pieces will be charged at current replacement cost.\n3. Overdue rentals attract standard daily fee plus late surcharge.',
  default_prep_days INTEGER NOT NULL DEFAULT 0,
  return_buffer_days INTEGER NOT NULL DEFAULT 1,
  cleaning_stage_enabled BOOLEAN NOT NULL DEFAULT true,
  late_fee_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  min_advance_percent NUMERIC(5,2) NOT NULL DEFAULT 25.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

