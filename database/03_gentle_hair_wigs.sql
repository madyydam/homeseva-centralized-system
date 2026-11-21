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
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin, subcompany_slug) VALUES
  (b_id, 'Studio Manager', 'Studio Manager', 'Studio operations, staff roster & desk oversight', 'Operations', '12345678', '1234', 'SHARED'),
  (b_id, 'Cold Caller', 'Cold Caller / Telecaller', 'Dedicated telecalling, follow-ups & monthly lead sheets CRM', 'Telecalling', '12345678', '1234', 'SHARED'),
  (b_id, 'Senior Wig Specialist & Stylist', 'Senior Wig Specialist & Stylist', 'Custom hair fittings, styling & cutting suites', 'Styling', '12345678', '1234', 'SHARED'),
  (b_id, 'Scalp & Measurement Consultant', 'Scalp & Measurement Consultant', 'Head contouring, base templates & scalp scans', 'Consultation', '12345678', '1234', 'SHARED'),
  (b_id, 'Billing & Front Desk', 'Billing & Front Desk', 'Counter POS, appointments & invoicing register', 'Front Desk', '12345678', '1234', 'SHARED'),
  (b_id, 'Inventory Coordinator (Wigs & Patches)', 'Inventory Coordinator (Wigs & Patches)', 'Lace systems, patch stock, tapes & adhesives', 'Inventory', '12345678', '1234', 'SHARED'),
  (b_id, 'Studio Partner / Owner', 'Studio Partner / Owner', 'Executive P&L oversight, studio audits & reports', 'Executive', '12345678', '1234', 'SHARED')
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
  branch TEXT DEFAULT 'viman-nagar',
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
