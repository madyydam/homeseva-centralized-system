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
  CONSTRAINT role_members_business_email_unique UNIQUE (business_id, email)
);

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
  ('f9d7e763-d4b9-451e-b173-d8edec97e752', 'Accounts Desk', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('f9d7e763-d4b9-451e-b173-d8edec97e752', 'Dispatch Coordinator', 'Demo User', 'abc@xyz.com', '12345678', '1234'),
  ('f9d7e763-d4b9-451e-b173-d8edec97e752', 'Trading Manager', 'Demo User', 'abc@xyz.com', '12345678', '1234')
ON CONFLICT (business_id, email) DO UPDATE SET
  password = EXCLUDED.password,
  pin = EXCLUDED.pin,
  name = EXCLUDED.name,
  role_id = EXCLUDED.role_id,
  is_active = true,
  updated_at = NOW();
