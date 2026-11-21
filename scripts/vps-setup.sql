-- =============================================================================
-- HOMESEVA DATABASE: 00 - CORE PLATFORM ARCHITECTURE
-- =============================================================================
-- Core platform: Super Admin, 10 Multi-Tenant Businesses registry,
-- Roles Catalog, Tabs Navigation, Access Control, Audit Logs, Members & System Tables.
-- Idempotent & Non-destructive: Uses IF NOT EXISTS, OR REPLACE, and ON CONFLICT.
-- =============================================================================

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

ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS tab_key TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

DO $$
BEGIN
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
-- 7. ROLE MEMBERS TABLE (Multi-user per role & PIN Security)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 8. ENTERPRISE EMPLOYEES, FINANCE ENTRIES & MONTHLY SUMMARIES
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 9. ENTERPRISE DATABASE BACKUP & RESTORE PACKAGES
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_business_roles_lookup ON public.business_roles(business_id, role_id);
CREATE INDEX IF NOT EXISTS idx_tabs_business ON public.tabs(business_id);
CREATE INDEX IF NOT EXISTS idx_role_tab_access ON public.role_tab_access(role_id, tab_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_role_members_business_role ON public.role_members(business_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_members_email ON public.role_members(email);
CREATE INDEX IF NOT EXISTS idx_employees_biz ON public.employees(business_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_biz_date ON public.finance_entries(business_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_backup_packages_job ON public.backup_packages(job_id);
CREATE INDEX IF NOT EXISTS idx_backup_packages_biz ON public.backup_packages(business_id);

-- -----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.super_admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_tab_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'businesses' AND policyname = 'public_read_active_businesses') THEN
    CREATE POLICY "public_read_active_businesses" ON public.businesses FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tabs' AND policyname = 'public_read_active_tabs') THEN
    CREATE POLICY "public_read_active_tabs" ON public.tabs FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_roles' AND policyname = 'deny_anon_business_roles') THEN
    CREATE POLICY "deny_anon_business_roles" ON public.business_roles FOR ALL USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'super_admin_credentials' AND policyname = 'deny_anon_super_admin') THEN
    CREATE POLICY "deny_anon_super_admin" ON public.super_admin_credentials FOR ALL USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'deny_anon_audit_logs') THEN
    CREATE POLICY "deny_anon_audit_logs" ON public.audit_logs FOR ALL USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'role_tab_access' AND policyname = 'deny_anon_role_tab_access') THEN
    CREATE POLICY "deny_anon_role_tab_access" ON public.role_tab_access FOR ALL USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'role_members' AND policyname = 'deny_anon_role_members') THEN
    CREATE POLICY "deny_anon_role_members" ON public.role_members FOR ALL USING (false);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 12. SEED: SUPER ADMIN (Credentials: madyydam, bcrypt hashed)
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
-- 13. SEED: THE 10 PRODUCTION BUSINESS REGISTRY
-- -----------------------------------------------------------------------------
INSERT INTO public.businesses (id, slug, name, subtitle, description, theme_color, is_active) VALUES
('b1000000-0000-0000-0000-000000000001', 'prefab-construction', 'Prefab Construction Solutions', 'Civil & Modular Sites', 'Civil engineering, modular building solutions and site project management', 'blue', true),
('b1000000-0000-0000-0000-000000000002', 'horeca-essentials', 'HoReCa Essentials & Crockery Rental', 'Essentials Sales & Crockery Rental', 'B2B commercial kitchen supply and premium event/banquet crockery rentals', 'emerald', true),
('b1000000-0000-0000-0000-000000000003', 'gentle-hair-wigs', 'Gentle Hair Wigs Studio', 'Viman Nagar, Ravet & Kolhapur', 'Custom hair systems, medical aesthetics, wig styling, and specialist consultations', 'amber', true),
('b1000000-0000-0000-0000-000000000004', 'ecolab-distribution', 'Ecolab Institutional Distribution', 'Hygiene & Chemical Solutions', 'Commercial hygiene solutions, industrial sanitization, and chemical safety audits', 'blue', true),
('b1000000-0000-0000-0000-000000000005', 'hs-coworking', 'HS Co-working Spaces', 'Flexible Desks & Workspaces', 'Executive co-working desks, private cabins, and collaborative team environments', 'indigo', true),
('b1000000-0000-0000-0000-000000000006', 'first-mover-advantage', 'First Mover Advantage', 'App SaaS Platform', 'Next-generation tech platform, SaaS application ecosystems, and platform development', 'cyan', true),
('b1000000-0000-0000-0000-000000000007', 'adjs', 'ADJS - PRINTBOOTHâ„¢', 'Smart Self-Service Printing Kiosks', 'Parent company for smart automated kiosks, merchant printing networks, and PRINTBOOTHâ„¢ business solutions', 'purple', true),
('b1000000-0000-0000-0000-000000000008', 'dvr-enterprise', 'DVR Enterprise', 'Commercial Trading & Supplies', 'Industrial goods trading, wholesale material distribution, and supply chain solutions', 'orange', true),
('b1000000-0000-0000-0000-000000000009', 'nda-services', 'NDA Security & Facility Care', 'Security & Facility Care', 'Facility upkeep, manned guarding, surveillance deployments, and corporate security', 'sky', true),
('b1000000-0000-0000-0000-000000000010', 'hs-real-estate', 'HS Real Estate & Assets', 'Property Leasing & Assets', 'Commercial leasing, high-yield asset portfolios, and legal conveyance management', 'rose', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  theme_color = EXCLUDED.theme_color,
  is_active = true,
  updated_at = NOW();
-- =============================================================================
-- HOMESEVA DATABASE: 01 - PREFAB CONSTRUCTION SOLUTIONS
-- =============================================================================
-- Business Slug: prefab-construction
-- Industry: Civil & Modular Engineering, Site Project Management
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'prefab-construction';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Project Director', 'Project Director', 'Overall oversight of civil and prefab sites', 'Projects', '12345678', '1234'),
  (b_id, 'Civil Site Engineer', 'Civil Site Engineer', 'Daily site progress, labor supervision and quality control', 'Engineering', '12345678', '1234'),
  (b_id, 'Procurement & Materials Desk', 'Procurement & Materials Desk', 'Steel, sandwich panels, modular materials and vendor orders', 'Procurement', '12345678', '1234'),
  (b_id, 'Billing & Contract Estimator', 'Billing & Contract Estimator', 'Client milestones, RA bills, and contractor estimates', 'Commercial', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'site_tracker', 'Site Operations Tracker', 'Daily site logs, stage progress, and construction milestones', 1),
  (b_id, 'materials_procurement', 'Materials & Indents', 'Structural steel, sandwich panels, and vendor procurement orders', 2),
  (b_id, 'ra_billing', 'Running Account (RA) Billing', 'Client project invoices, contractor billing, and payment milestones', 3),
  (b_id, 'labor_muster', 'Site Labor & Attendance', 'Daily labor headcounts, contractor rosters, and safety reports', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. PREFAB SPECIFIC TABLES
CREATE TABLE IF NOT EXISTS public.prefab_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_code TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT,
  contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'Planning',
  start_date DATE,
  target_completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prefab_site_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.prefab_projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_summary TEXT NOT NULL,
  labor_count INT NOT NULL DEFAULT 0,
  weather_conditions TEXT,
  engineer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prefab_projects_biz ON public.prefab_projects(business_id);
CREATE INDEX IF NOT EXISTS idx_prefab_site_logs_proj ON public.prefab_site_logs(project_id, log_date);
-- =============================================================================
-- HOMESEVA DATABASE: 02 - HORECA ESSENTIALS & CROCKERY RENTAL
-- =============================================================================
-- Business Slug: horeca-essentials (with crockery-rental division)
-- Industry: Commercial Kitchenware Sales, Premium Event & Banquet Crockery Rentals
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'horeca-essentials';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Owner', 'Owner', 'Complete business oversight, revenue P&L & expansion', 'Executive', '12345678', '1234'),
  (b_id, 'Store Manager', 'Store Manager', 'Daily orders, stock coordination & customer requests', 'Operations', '12345678', '1234'),
  (b_id, 'Logistics & Dispatch', 'Logistics & Dispatch', 'Delivery manifests, pickup scheduling & vehicle tracking', 'Logistics', '12345678', '1234'),
  (b_id, 'Billing & Accounts', 'Billing & Accounts', 'Invoices, GST returns, security deposits & payments', 'Finance', '12345678', '1234'),
  (b_id, 'General Manager', 'General Manager', 'Overall management of sales supply and crockery rental', 'Management', '12345678', '1234'),
  (b_id, 'Sales Representative (Essentials)', 'Sales Representative (Essentials)', 'Commercial cutlery, chinaware, glassware & amenities sales', 'Sales', '12345678', '1234'),
  (b_id, 'Rental Logistics Supervisor', 'Rental Logistics Supervisor', 'Banquet and event hire logistics, delivery & return checks', 'Rental', '12345678', '1234'),
  (b_id, 'Inventory & Warehousing Desk', 'Inventory & Warehousing Desk', 'Stock tracking, breakage register, and warehouse audits', 'Inventory', '12345678', '1234'),
  (b_id, 'Banquet Billing & Invoicing', 'Banquet Billing & Invoicing', 'Invoicing, advances, security deposits, and settlement register', 'Finance', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'crockery_rental', 'Crockery Rental App', 'Bookings, calendar availability, dispatch, and returns', 1),
  (b_id, 'essentials_sales', 'Essentials Supply', 'B2B kitchenware supply catalog and orders', 2),
  (b_id, 'finance', 'Invoices & Ledger', 'Banquet invoices, advance receipts, and ledger', 3),
  (b_id, 'inventory', 'Inventory Master', 'Crockery item stock, broken items and cleaning queue', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. CROCKERY RENTAL RELATIONAL ENGINE (10 DEDICATED TABLES)
CREATE TABLE IF NOT EXISTS public.crockery_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  item_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  description TEXT,
  image_url TEXT,
  total_stock INT NOT NULL DEFAULT 0,
  available_stock INT NOT NULL DEFAULT 0,
  rented_stock INT NOT NULL DEFAULT 0,
  damaged_stock INT NOT NULL DEFAULT 0,
  washing_stock INT NOT NULL DEFAULT 0,
  lost_stock INT NOT NULL DEFAULT 0,
  rate_per_day NUMERIC(10, 2) NOT NULL DEFAULT 0,
  replacement_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  hsn_code TEXT DEFAULT '997319',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  gstin TEXT,
  billing_address TEXT,
  delivery_address TEXT,
  city TEXT DEFAULT 'Pune',
  pincode TEXT,
  security_deposit_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  booking_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES public.crockery_customers(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT,
  event_venue TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rental_days INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  security_deposit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_received NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'QUOTATION',
  delivery_status TEXT NOT NULL DEFAULT 'PENDING',
  return_status TEXT NOT NULL DEFAULT 'PENDING',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  dispatched_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  dispatch_manifest_url TEXT,
  return_manifest_url TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_booking_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES public.crockery_bookings(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.crockery_items(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity_booked INT NOT NULL,
  quantity_dispatched INT NOT NULL DEFAULT 0,
  quantity_returned_clean INT NOT NULL DEFAULT 0,
  quantity_returned_dirty INT NOT NULL DEFAULT 0,
  quantity_damaged INT NOT NULL DEFAULT 0,
  quantity_lost INT NOT NULL DEFAULT 0,
  rate_per_day NUMERIC(10, 2) NOT NULL,
  rental_days INT NOT NULL DEFAULT 1,
  line_subtotal NUMERIC(12, 2) NOT NULL,
  damage_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  loss_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_stock_movements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  item_id TEXT NOT NULL REFERENCES public.crockery_items(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.crockery_bookings(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  quantity INT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reference_no TEXT,
  performed_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  booking_id TEXT REFERENCES public.crockery_bookings(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES public.crockery_customers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  firm_type TEXT NOT NULL DEFAULT 'HOMESEVA',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  billing_name TEXT NOT NULL,
  billing_address TEXT,
  billing_gstin TEXT,
  shipping_name TEXT,
  shipping_address TEXT,
  shipping_gstin TEXT,
  event_name TEXT,
  event_date DATE,
  delivery_note TEXT,
  dispatch_doc_no TEXT,
  dispatched_through TEXT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  taxable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 9.00,
  cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 9.00,
  sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  igst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  round_off NUMERIC(6, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_in_words TEXT,
  status TEXT NOT NULL DEFAULT 'ISSUED',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_invoice_lines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES public.crockery_invoices(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES public.crockery_items(id) ON DELETE SET NULL,
  sr_no INT NOT NULL,
  description TEXT NOT NULL,
  hsn_sac TEXT NOT NULL DEFAULT '997319',
  quantity INT NOT NULL,
  rate NUMERIC(10, 2) NOT NULL,
  rental_days INT NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'nos',
  taxable_value NUMERIC(12, 2) NOT NULL,
  cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 9.00,
  cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 9.00,
  sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  booking_id TEXT REFERENCES public.crockery_bookings(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES public.crockery_customers(id) ON DELETE CASCADE,
  payment_number TEXT UNIQUE NOT NULL,
  payment_type TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  transaction_ref TEXT,
  receipt_url TEXT,
  is_security_deposit BOOLEAN NOT NULL DEFAULT false,
  is_refunded BOOLEAN NOT NULL DEFAULT false,
  refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_package_combos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  name TEXT NOT NULL,
  guest_count_hint INT,
  event_category TEXT,
  package_price_per_day NUMERIC(10, 2) NOT NULL DEFAULT 0,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crockery_business_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT UNIQUE NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000002',
  name TEXT NOT NULL DEFAULT 'HomeSeva Crockery & Catering Rentals',
  legal_entity TEXT,
  gstin TEXT,
  pan TEXT,
  registered_address TEXT,
  warehouse_address TEXT,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account_no TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  upi_id TEXT,
  invoice_prefix TEXT DEFAULT 'HS-CRK',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_crockery_items_biz ON public.crockery_items(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_customers_phone ON public.crockery_customers(phone);
CREATE INDEX IF NOT EXISTS idx_crockery_bookings_biz ON public.crockery_bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_bookings_dates ON public.crockery_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_crockery_invoices_biz ON public.crockery_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_crockery_payments_booking ON public.crockery_payments(booking_id);
-- =============================================================================
-- HOMESEVA DATABASE: 03 - GENTLE HAIR WIGS STUDIO
-- =============================================================================
-- Business Slug: gentle-hair-wigs
-- Industry: Custom Hair Systems, Medical Aesthetics, Wig Styling & Consultations
-- Studios: Viman Nagar, Ravet & Kolhapur
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'gentle-hair-wigs';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Studio Manager', 'Studio Manager', 'Studio operations, staff roster & desk oversight', 'Operations', '12345678', '1234'),
  (b_id, 'Cold Caller', 'Cold Caller / Telecaller', 'Dedicated telecalling, follow-ups & monthly lead sheets CRM', 'Telecalling', '12345678', '1234'),
  (b_id, 'Senior Wig Specialist & Stylist', 'Senior Wig Specialist & Stylist', 'Custom hair fittings, styling & cutting suites', 'Styling', '12345678', '1234'),
  (b_id, 'Scalp & Measurement Consultant', 'Scalp & Measurement Consultant', 'Head contouring, base templates & scalp scans', 'Consultation', '12345678', '1234'),
  (b_id, 'Billing & Front Desk', 'Billing & Front Desk', 'Counter POS, appointments & invoicing register', 'Front Desk', '12345678', '1234'),
  (b_id, 'Inventory Coordinator (Wigs & Patches)', 'Inventory Coordinator (Wigs & Patches)', 'Lace systems, patch stock, tapes & adhesives', 'Inventory', '12345678', '1234'),
  (b_id, 'Studio Partner / Owner', 'Studio Partner / Owner', 'Executive P&L oversight, studio audits & reports', 'Executive', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'crm', 'CRM Leads Sheet', 'Lead management, conversion stages, notes and call tracking', 1),
  (b_id, 'telecalling', 'Cold Caller Desk', 'Dedicated telecaller leads, calling logs and follow-ups', 2),
  (b_id, 'finance', 'Finance & PnL', 'Monthly profit/loss statement, collections and expenses', 3),
  (b_id, 'sop', 'SOP & Knowledge Base', 'Standard Operating Procedures for fittings, consultation and care', 4),
  (b_id, 'google_sheets', 'Live Google Sheets', 'Direct spreadsheet synchronization and backup view', 5)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. GENTLE OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.gentle_crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
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

CREATE TABLE IF NOT EXISTS public.gentle_leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
  sr_no INT,
  studio_slug TEXT NOT NULL DEFAULT 'viman-nagar',
  studio_name TEXT NOT NULL DEFAULT 'Studio of Viman Nagar',
  client_name TEXT NOT NULL DEFAULT 'Inquiry',
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Interested',
  custom_status_text TEXT,
  call_count INT NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS public.gentle_studios (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  city TEXT NOT NULL,
  manager_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gentle_appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
  lead_id TEXT REFERENCES public.gentle_leads(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  studio TEXT NOT NULL DEFAULT 'Viman Nagar',
  specialist TEXT,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gentle_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
  order_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  system_type TEXT NOT NULL,
  hair_specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'CONFIRMED',
  fitting_date DATE,
  studio TEXT NOT NULL DEFAULT 'Viman Nagar',
  specialist TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gentle_inventory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
  item_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  base_type TEXT,
  hair_type TEXT,
  hair_length TEXT,
  hair_color TEXT,
  stock_quantity INT NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_alert_level INT NOT NULL DEFAULT 2,
  studio_location TEXT NOT NULL DEFAULT 'Viman Nagar',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gentle_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'UPI',
  payment_status TEXT NOT NULL DEFAULT 'PAID',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  studio TEXT NOT NULL DEFAULT 'Viman Nagar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.telecaller_daily_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL DEFAULT 'b1000000-0000-0000-0000-000000000003',
  telecaller_id TEXT NOT NULL,
  telecaller_name TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made INT NOT NULL DEFAULT 0,
  calls_connected INT NOT NULL DEFAULT 0,
  interested_count INT NOT NULL DEFAULT 0,
  not_interested_count INT NOT NULL DEFAULT 0,
  callback_count INT NOT NULL DEFAULT 0,
  closed_count INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, telecaller_id, report_date)
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_caller ON public.gentle_crm_leads(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_biz ON public.gentle_crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_phone ON public.gentle_crm_leads(phone);
CREATE INDEX IF NOT EXISTS idx_gentle_leads_biz ON public.gentle_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_gentle_orders_biz ON public.gentle_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_gentle_invoices_biz ON public.gentle_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_telecaller_reports_biz_date ON public.telecaller_daily_reports(business_id, report_date);
-- =============================================================================
-- HOMESEVA DATABASE: 04 - ECOLAB INSTITUTIONAL DISTRIBUTION
-- =============================================================================
-- Business Slug: ecolab-distribution
-- Industry: Commercial Hygiene Solutions, Industrial Sanitization, Chemical Safety
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'ecolab-distribution';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Distribution Manager', 'Distribution Manager', 'Institutional distribution and order dispatch oversight', 'Operations', '12345678', '1234'),
  (b_id, 'Institutional Key Account Executive', 'Key Account Executive', 'Hotel, hospital and catering corporate accounts', 'Sales', '12345678', '1234'),
  (b_id, 'Chemical Safety & Stock Auditor', 'Safety & Stock Auditor', 'Hazardous storage compliance, expiration tracking & QA', 'Compliance', '12345678', '1234'),
  (b_id, 'Billing & Dispatch Desk', 'Billing & Dispatch Desk', 'Tax invoices, e-way bills, and dispatch manifests', 'Logistics', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'distribution', 'Institutional Accounts', 'Hotel, hospital, and catering corporate account catalog', 1),
  (b_id, 'client_orders', 'Commercial Chemical Orders', 'Bulk industrial hygiene supply orders and requisitions', 2),
  (b_id, 'safety_audits', 'Chemical Safety & Audits', 'Dosage calibration reports, safety certifications, and audits', 3),
  (b_id, 'dispatch', 'Dispatch & Invoicing', 'Tax invoices, e-way bills, delivery challans, and manifests', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. ECOLAB OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.ecolab_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sku_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pack_size TEXT NOT NULL,
  stock_units INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_hazardous BOOLEAN NOT NULL DEFAULT false,
  msds_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ecolab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  institution_type TEXT NOT NULL DEFAULT 'Hotel',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  delivery_date DATE,
  invoice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecolab_products_biz ON public.ecolab_products(business_id);
CREATE INDEX IF NOT EXISTS idx_ecolab_orders_biz ON public.ecolab_orders(business_id);
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
-- =============================================================================
-- HOMESEVA DATABASE: 06 - FIRST MOVER ADVANTAGE
-- =============================================================================
-- Business Slug: first-mover-advantage
-- Industry: App SaaS Platform, Next-Gen Technology & Software Ecosystems
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'first-mover-advantage';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Product Lead', 'Product Lead', 'Roadmap, feature backlog, and release planning', 'Product', '12345678', '1234'),
  (b_id, 'DevOps & Platform Desk', 'DevOps & Platform Desk', 'Cloud infrastructure, CI/CD, uptime, and database metrics', 'Engineering', '12345678', '1234'),
  (b_id, 'Billing & Accounts', 'Billing & Accounts', 'Subscription billing, invoices, and payment gateways', 'Finance', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'saas_metrics', 'Platform Health & Metrics', 'Live server uptime, API traffic latency, and active tenant quotas', 1),
  (b_id, 'app_ecosystem', 'Application Catalog', 'Microservices registry, release versions, and webhooks config', 2),
  (b_id, 'developer_keys', 'API Gateway & Tokens', 'Tenant credentials, OAuth2 clients, and security policies', 3),
  (b_id, 'billing', 'SaaS Subscriptions', 'Recurring Stripe/Razorpay billing, MRR analytics, and tax invoices', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. FMA OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.fma_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  app_slug TEXT UNIQUE NOT NULL,
  app_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fma_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.fma_apps(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'Pro',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fma_apps_biz ON public.fma_apps(business_id);
CREATE INDEX IF NOT EXISTS idx_fma_subs_app ON public.fma_subscriptions(app_id);
-- =============================================================================
-- HOMESEVA DATABASE: 07 - ADJS - PRINTBOOTHâ„¢
-- =============================================================================
-- Business Slug: adjs (aliases: printbooth)
-- Industry: Smart Automated Kiosks, Merchant Printing Networks, Touchscreen OS
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'adjs';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Owner', 'Owner', 'Business P&L, kiosk unit economics & expansion', 'Executive', '12345678', '1234'),
  (b_id, 'Manager', 'Manager', 'Machine orders, merchant onboarding & dispatch', 'Operations', '12345678', '1234'),
  (b_id, 'Coldcaller', 'Coldcaller', 'B2B merchant prospecting & kiosk placement CRM', 'Sales / CRM', '12345678', '1234'),
  (b_id, 'Developer', 'Developer', 'Kiosk touchscreen OS, Cloud Print APIs & payment gateways', 'Engineering', '12345678', '1234'),
  (b_id, 'Staff', 'Staff', 'Freight dispatch logistics & merchant helpdesk', 'Support', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'kiosk_fleet', 'Kiosk Fleet Monitor', 'Real-time heartbeat, paper levels, ink levels, and online status', 1),
  (b_id, 'machine_orders', 'Kiosk Orders & Dispatch', 'B2B merchant sales orders, manufacturing stages, and transport LR', 2),
  (b_id, 'crm', 'Merchant Placement CRM', 'Telecaller lead pipeline, merchant shop locations, and contracts', 3),
  (b_id, 'support_tickets', 'Kiosk Helpdesk & Tickets', 'Hardware faults, printer jams, UPI refund tickets, and resolution', 4),
  (b_id, 'daily_reports', 'Telecaller Daily Attendance', 'Daily call volumes, converted merchants, and attendance records', 5)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. PRINTBOOTH OPERATIONAL TABLES
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

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_printbooth_reports_member_date ON public.printbooth_daily_reports(member_id, report_date);
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_caller ON public.printbooth_crm_leads(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_biz ON public.printbooth_crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_orders_biz ON public.printbooth_machine_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_tickets_biz ON public.printbooth_support_tickets(business_id);
-- =============================================================================
-- HOMESEVA DATABASE: 08 - DVR ENTERPRISE
-- =============================================================================
-- Business Slug: dvr-enterprise
-- Industry: Commercial Trading, Industrial Supplies, Wholesale Material Distribution
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'dvr-enterprise';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin) VALUES
  (b_id, 'Trading Manager', 'Trading Manager', 'Supplier procurement, pricing margins, wholesale orders', 'Trade', '12345678', '1234'),
  (b_id, 'Dispatch Coordinator', 'Dispatch Coordinator', 'Warehouse loading, transporter booking, LR receipts', 'Logistics', '12345678', '1234'),
  (b_id, 'Accounts Desk', 'Accounts Desk', 'Vendor ledgers, receivables collections, and reconciliation', 'Finance', '12345678', '1234')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    updated_at = NOW();

  -- 2. TABS & MODULE NAVIGATION
  INSERT INTO public.tabs (business_id, tab_key, label, description, sort_order) VALUES
  (b_id, 'trading_inventory', 'Industrial Goods Catalog', 'Wholesale raw materials, steel coils, polymers, and stock', 1),
  (b_id, 'purchase_orders', 'B2B Trade Orders', 'High-volume purchase orders, margin sheets, and buyer contracts', 2),
  (b_id, 'transport_logistics', 'Transporter Logistics', 'Truck allocations, lorry receipts (LR), and weighing bridge slips', 3),
  (b_id, 'receivables', 'Debtor Receivables & Aging', 'Credit terms, payment reminders, and bank reconciliations', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. DVR OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.dvr_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  item_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  hsn_code TEXT NOT NULL DEFAULT '7208',
  unit TEXT NOT NULL DEFAULT 'MT',
  stock_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  base_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dvr_trade_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  buyer_company TEXT NOT NULL,
  buyer_gstin TEXT,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  transporter_name TEXT,
  lr_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dvr_materials_biz ON public.dvr_materials(business_id);
CREATE INDEX IF NOT EXISTS idx_dvr_orders_biz ON public.dvr_trade_orders(business_id);
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
