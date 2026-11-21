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
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin, subcompany_slug) VALUES
  (b_id, 'Trading Manager', 'Trading Manager', 'Supplier procurement, pricing margins, wholesale orders', 'Trade', '12345678', '1234', 'SHARED'),
  (b_id, 'Dispatch Coordinator', 'Dispatch Coordinator', 'Warehouse loading, transporter booking, LR receipts', 'Logistics', '12345678', '1234', 'SHARED'),
  (b_id, 'Accounts Desk', 'Accounts Desk', 'Vendor ledgers, receivables collections, and reconciliation', 'Finance', '12345678', '1234', 'SHARED')
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
