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

  -- 1. BUSINESS ROLES (STRICT ZERO-SHARED SUB-COMPANY VERTICAL ISOLATION)
  -- A. Crockery Rental Vertical Roles
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin, subcompany_slug) VALUES
  (b_id, 'Owner', 'Owner (Crockery Rental)', 'Complete business oversight, banquet revenue P&L & rental expansion', 'Executive', '12345678', '1234', 'crockery-rental'),
  (b_id, 'General Manager', 'General Manager (Crockery)', 'Overall operations and logistics management for banquet crockery rentals', 'Management', '12345678', '1234', 'crockery-rental'),
  (b_id, 'Rental Logistics Supervisor', 'Rental Logistics Supervisor', 'Banquet and event hire logistics, delivery & return checks', 'Rental', '12345678', '1234', 'crockery-rental'),
  (b_id, 'Inventory & Warehousing Desk', 'Inventory & Warehousing Desk', 'Stock tracking, breakage register, and warehouse audits', 'Inventory', '12345678', '1234', 'crockery-rental'),
  (b_id, 'Banquet Billing & Invoicing', 'Banquet Billing & Invoicing', 'Invoicing, advances, security deposits, and settlement register', 'Finance', '12345678', '1234', 'crockery-rental'),

  -- B. Essentials Sales Vertical Roles
  (b_id, 'Store Manager', 'Store Manager (Sales)', 'Daily B2B orders, kitchenware stock coordination & customer requests', 'Operations', '12345678', '1234', 'essentials-sales'),
  (b_id, 'Sales Representative (Essentials)', 'Sales Representative (Essentials)', 'Commercial cutlery, chinaware, glassware & amenities sales', 'Sales', '12345678', '1234', 'essentials-sales'),
  (b_id, 'Billing & Accounts', 'Billing & Accounts (Sales)', 'Invoices, GST returns, accounts receivables & payment reconciliation', 'Finance', '12345678', '1234', 'essentials-sales'),
  (b_id, 'Logistics & Dispatch', 'Logistics & Dispatch (Sales)', 'Commercial kitchenware delivery manifests, transport logistics & LR receipts', 'Logistics', '12345678', '1234', 'essentials-sales'),
  (b_id, 'General Manager (Sales)', 'General Manager (Essentials Sales)', 'Commercial kitchenware sales oversight, wholesale distribution & expansion', 'Management', '12345678', '1234', 'essentials-sales'),
  (b_id, 'Owner (Sales)', 'Owner (Essentials Sales)', 'Executive P&L oversight, enterprise kitchenware contracts & growth', 'Executive', '12345678', '1234', 'essentials-sales')
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
