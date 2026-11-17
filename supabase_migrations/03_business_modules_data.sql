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
