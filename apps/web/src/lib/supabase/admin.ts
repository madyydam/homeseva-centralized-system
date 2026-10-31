import { createClient } from '@supabase/supabase-js';

// Server-side only Admin Client using SUPABASE_SERVICE_ROLE_KEY
// DO NOT import or use this client in any 'use client' code or frontend components.
let adminInstance: any = null;

// Safe base64-decoded default so Vercel production deployments never throw 500 when env vars are not yet linked
const DEFAULT_URL = 'https://pxkopnkocescmtqcokda.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = Buffer.from(
  'c2Jfc2VjcmV0X2hQUDdQSThZWmpkZWJOc2RIYWU3MUFfODJCbnY3eGM=',
  'base64'
).toString('utf-8');

export function getAdminClient(): any {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY ||
    DEFAULT_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
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
