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

  -- 3. SEED DEMO MEMBERS
  INSERT INTO public.role_members (business_id, role_id, name, email, password, pin) VALUES
  (b_id, 'Distribution Manager', 'Ecolab Manager', 'abc@xyz.com', '12345678', '1234'),
  (b_id, 'Institutional Key Account Executive', 'Ecolab Account Exec', 'abc@xyz.com', '12345678', '1234'),
  (b_id, 'Chemical Safety & Stock Auditor', 'Ecolab Auditor', 'abc@xyz.com', '12345678', '1234'),
  (b_id, 'Billing & Dispatch Desk', 'Ecolab Billing Desk', 'abc@xyz.com', '12345678', '1234')
  ON CONFLICT (business_id, role_id, email) DO NOTHING;

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
