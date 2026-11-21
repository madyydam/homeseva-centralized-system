-- =============================================================================
-- HOMESEVA DATABASE: 07 - ADJS - PRINTBOOTH™
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
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin, subcompany_slug) VALUES
  (b_id, 'Owner', 'Owner', 'Business P&L, kiosk unit economics & expansion', 'Executive', '12345678', '1234', 'SHARED'),
  (b_id, 'Manager', 'Manager', 'Machine orders, merchant onboarding & dispatch', 'Operations', '12345678', '1234', 'SHARED'),
  (b_id, 'Coldcaller', 'Coldcaller', 'B2B merchant prospecting & kiosk placement CRM', 'Sales / CRM', '12345678', '1234', 'SHARED'),
  (b_id, 'Developer', 'Developer', 'Kiosk touchscreen OS, Cloud Print APIs & payment gateways', 'Engineering', '12345678', '1234', 'SHARED'),
  (b_id, 'Staff', 'Staff', 'Freight dispatch logistics & merchant helpdesk', 'Support', '12345678', '1234', 'SHARED')
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
