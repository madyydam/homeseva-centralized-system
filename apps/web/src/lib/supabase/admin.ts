import { createClient } from '@supabase/supabase-js';

// Server-side only Admin Client using SUPABASE_SERVICE_ROLE_KEY
// DO NOT import or use this client in any 'use client' code or frontend components.
let adminInstance: any = null;

export function getAdminClient(): any {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!adminInstance) {
    adminInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminInstance;
}
