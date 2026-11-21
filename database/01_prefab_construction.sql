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
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin, subcompany_slug) VALUES
  (b_id, 'Project Director', 'Project Director', 'Overall oversight of civil and prefab sites', 'Projects', '12345678', '1234', 'SHARED'),
  (b_id, 'Civil Site Engineer', 'Civil Site Engineer', 'Daily site progress, labor supervision and quality control', 'Engineering', '12345678', '1234', 'SHARED'),
  (b_id, 'Procurement & Materials Desk', 'Procurement & Materials Desk', 'Steel, sandwich panels, modular materials and vendor orders', 'Procurement', '12345678', '1234', 'SHARED'),
  (b_id, 'Billing & Contract Estimator', 'Billing & Contract Estimator', 'Client milestones, RA bills, and contractor estimates', 'Commercial', '12345678', '1234', 'SHARED')
  ON CONFLICT (business_id, role_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    pin = EXCLUDED.pin,
    subcompany_slug = EXCLUDED.subcompany_slug,
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
