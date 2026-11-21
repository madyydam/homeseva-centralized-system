-- =============================================================================
-- HOMESEVA DATABASE: 06 - FIRST MOVER ADVANTAGE
-- =============================================================================
-- Business Slug: first-mover-advantage
-- Industry: App SaaS Platform, Next-Gen Technology & Software Ecosystems
-- =============================================================================

DO $$
DECLARE
  b_id TEXT;
BEGIN
  SELECT id::text INTO b_id FROM public.businesses WHERE slug = 'first-mover-advantage';
  IF b_id IS NULL THEN RETURN; END IF;

  -- 1. BUSINESS ROLES
  INSERT INTO public.business_roles (business_id, role_id, label, description, department, password, pin, subcompany_slug) VALUES
  (b_id, 'Product Lead', 'Product Lead', 'Roadmap, feature backlog, and release planning', 'Product', '12345678', '1234', 'SHARED'),
  (b_id, 'DevOps & Platform Desk', 'DevOps & Platform Desk', 'Cloud infrastructure, CI/CD, uptime, and database metrics', 'Engineering', '12345678', '1234', 'SHARED'),
  (b_id, 'Billing & Accounts', 'Billing & Accounts', 'Subscription billing, invoices, and payment gateways', 'Finance', '12345678', '1234', 'SHARED')
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
  (b_id, 'saas_metrics', 'Platform Health & Metrics', 'Live server uptime, API traffic latency, and active tenant quotas', 1),
  (b_id, 'app_ecosystem', 'Application Catalog', 'Microservices registry, release versions, and webhooks config', 2),
  (b_id, 'developer_keys', 'API Gateway & Tokens', 'Tenant credentials, OAuth2 clients, and security policies', 3),
  (b_id, 'billing', 'SaaS Subscriptions', 'Recurring Stripe/Razorpay billing, MRR analytics, and tax invoices', 4)
  ON CONFLICT (business_id, tab_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

END $$;

-- 4. FMA OPERATIONAL TABLES
CREATE TABLE IF NOT EXISTS public.fma_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  app_slug TEXT UNIQUE NOT NULL,
  app_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fma_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.fma_apps(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'Pro',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fma_apps_biz ON public.fma_apps(business_id);
CREATE INDEX IF NOT EXISTS idx_fma_subs_app ON public.fma_subscriptions(app_id);
