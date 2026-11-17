-- =============================================================================
-- HOMESEVA - COLD CALLER LEADS DATA ISOLATION MIGRATION (05)
-- Purpose: Strict data isolation per individual Cold Caller / Telecaller.
-- Each lead belongs to a specific telecaller_id (role_members.id).
-- =============================================================================

-- 1. GENTLE HAIR WIGS CRM LEADS TABLE (ISOLATED PER CALLER)
CREATE TABLE IF NOT EXISTS public.gentle_crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT '3',
  telecaller_id TEXT,                    -- References public.role_members(id)
  telecaller_name TEXT,                  -- Member Display Name
  telecaller_email TEXT,                 -- Member Login Email
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

-- Ensure columns exist if table was already created
ALTER TABLE public.gentle_crm_leads ADD COLUMN IF NOT EXISTS telecaller_id TEXT;
ALTER TABLE public.gentle_crm_leads ADD COLUMN IF NOT EXISTS telecaller_name TEXT;
ALTER TABLE public.gentle_crm_leads ADD COLUMN IF NOT EXISTS telecaller_email TEXT;
ALTER TABLE public.gentle_crm_leads ADD COLUMN IF NOT EXISTS notes_list JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.gentle_crm_leads ADD COLUMN IF NOT EXISTS call_count INT DEFAULT 0;

-- Indices for high-speed multi-caller filtering
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_caller ON public.gentle_crm_leads(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_business ON public.gentle_crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_phone ON public.gentle_crm_leads(phone);
CREATE INDEX IF NOT EXISTS idx_gentle_crm_leads_created ON public.gentle_crm_leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.gentle_crm_leads ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gentle_crm_leads' AND policyname = 'service_role_gentle_crm_leads'
  ) THEN
    CREATE POLICY "service_role_gentle_crm_leads" ON public.gentle_crm_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;


-- 2. PRINTBOOTH / ADJS CRM LEADS TABLE (ISOLATED PER CALLER)
CREATE TABLE IF NOT EXISTS public.printbooth_crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'adjs',
  telecaller_id TEXT,                    -- References public.role_members(id)
  telecaller_name TEXT,                  -- Member Display Name
  telecaller_email TEXT,                 -- Member Login Email
  sr_no INT,
  client_name TEXT NOT NULL DEFAULT 'Merchant Inquiry',
  phone TEXT NOT NULL,
  business_name TEXT,
  city TEXT,
  kiosk_model TEXT,
  status TEXT NOT NULL DEFAULT 'Interested',
  custom_status_text TEXT,
  call_count INT NOT NULL DEFAULT 0,
  notes_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist
ALTER TABLE public.printbooth_crm_leads ADD COLUMN IF NOT EXISTS telecaller_id TEXT;
ALTER TABLE public.printbooth_crm_leads ADD COLUMN IF NOT EXISTS telecaller_name TEXT;
ALTER TABLE public.printbooth_crm_leads ADD COLUMN IF NOT EXISTS telecaller_email TEXT;
ALTER TABLE public.printbooth_crm_leads ADD COLUMN IF NOT EXISTS notes_list JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.printbooth_crm_leads ADD COLUMN IF NOT EXISTS call_count INT DEFAULT 0;

-- Indices for high-speed multi-caller filtering
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_caller ON public.printbooth_crm_leads(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_business ON public.printbooth_crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_phone ON public.printbooth_crm_leads(phone);
CREATE INDEX IF NOT EXISTS idx_printbooth_crm_leads_created ON public.printbooth_crm_leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.printbooth_crm_leads ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'printbooth_crm_leads' AND policyname = 'service_role_printbooth_crm_leads'
  ) THEN
    CREATE POLICY "service_role_printbooth_crm_leads" ON public.printbooth_crm_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
