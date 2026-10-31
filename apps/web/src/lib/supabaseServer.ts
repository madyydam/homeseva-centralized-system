import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://pxkopnkocescmtqcokda.supabase.co';

// Service role key strictly for server-side trusted operations
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export interface SupabaseRoleCredentialRow {
  id: string;
  businessId: string;
  businessSlug: string;
  role: string;
  label: string;
  department: string;
  password: string;
  pin: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseSuperAdminRow {
  id: string;
  username: string;
  passwordHash: string;
  pin4: string;
  pin8: string;
  createdAt: string;
  updatedAt: string;
}
