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
  enabled_modules TEXT[] DEFAULT '{}',
  "enabledModules" TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'blue';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS enabled_modules TEXT[] DEFAULT '{}';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "enabledModules" TEXT[] DEFAULT '{}';
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
  subcompany_slug TEXT DEFAULT 'SHARED',
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
ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS subcompany_slug TEXT DEFAULT 'SHARED';

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
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  subcompany_slug TEXT DEFAULT 'SHARED',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT role_members_business_role_email_unique UNIQUE (business_id, role_id, email)
);

ALTER TABLE public.role_members ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0;
ALTER TABLE public.role_members ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE public.role_members ADD COLUMN IF NOT EXISTS subcompany_slug TEXT DEFAULT 'SHARED';

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
-- 10. UNIVERSAL MULTI-TENANT WORKSPACE PERSISTENCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_workspace_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  section TEXT NOT NULL DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_business_section UNIQUE (business_id, section)
);

-- -----------------------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_business_roles_lookup ON public.business_roles(business_id, role_id);
CREATE INDEX IF NOT EXISTS idx_business_roles_subcompany ON public.business_roles(business_id, subcompany_slug);
CREATE INDEX IF NOT EXISTS idx_tabs_business ON public.tabs(business_id);
CREATE INDEX IF NOT EXISTS idx_role_tab_access ON public.role_tab_access(role_id, tab_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_role_members_business_role ON public.role_members(business_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_members_email ON public.role_members(email);
CREATE INDEX IF NOT EXISTS idx_role_members_subcompany ON public.role_members(business_id, subcompany_slug);
CREATE INDEX IF NOT EXISTS idx_employees_biz ON public.employees(business_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_biz_date ON public.finance_entries(business_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_backup_packages_job ON public.backup_packages(job_id);
CREATE INDEX IF NOT EXISTS idx_backup_packages_biz ON public.backup_packages(business_id);
CREATE INDEX IF NOT EXISTS idx_bwd_business_id ON public.business_workspace_data(business_id);

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
  '$2b$10$pZqlONT6aGnVFnVRJg2zne8UoQCAMttvV0HImdWUIiW2zYplVr1fK',
  '$2b$10$fr7EF8LAXz1yZKjI6A9auudV7EUOeRFB3SaWpKvSFXtzv4nteD7eK',
  '$2b$10$TJKWKvaQBBS62ZfYVolRSOUS9PUTdCFiT7F7i8tbw8z8ECsdZaE.q',
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
('b1000000-0000-0000-0000-000000000007', 'adjs', 'ADJS - PRINTBOOTH™', 'Smart Self-Service Printing Kiosks', 'Parent company for smart automated kiosks, merchant printing networks, and PRINTBOOTH™ business solutions', 'purple', true),
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

-- -----------------------------------------------------------------------------
-- 14. UNIVERSAL MULTI-TENANT WORKSPACE PERSISTENCE (Future-Scalable)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_workspace_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  section TEXT NOT NULL DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_business_section UNIQUE (business_id, section)
);

CREATE INDEX IF NOT EXISTS idx_bwd_business_id ON public.business_workspace_data (business_id);

