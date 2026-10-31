import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getAdminClient } from '../../../../lib/supabase/admin';
import {
  signSession,
  verifySession,
  SUPER_ADMIN_COOKIE,
  USER_SESSION_COOKIE,
} from '../../../../lib/authSession';

export const dynamic = 'force-dynamic';

export interface RoleCredential {
  role: string;
  label: string;
  password?: string;
  pin?: string;
  department: string;
  lastUpdated?: string | undefined;
}

export interface BusinessCredentials {
  businessId: string;
  businessSlug: string;
  businessName: string;
  roles: RoleCredential[];
}

export interface SuperAdminConfig {
  username: string;
  password?: string;
  pin4?: string;
  pin8?: string;
  lastUpdated?: string | undefined;
}

// GET: Securely load business roles and super admin metadata from Supabase
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    const admin = getAdminClient();

    // Check super admin session
    const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const session = await verifySession(saToken);

    // Fetch Super Admin config metadata (masked, no raw passwords)
    const { data: adminRecord, error: saError } = await admin
      .from('super_admin_credentials')
      .select('username, updated_at')
      .eq('id', 'primary')
      .single();

    if (saError || !adminRecord) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized. Please run scripts/supabase_master_setup.sql in Supabase first.',
      }, { status: 503 });
    }

    const superAdminMeta: SuperAdminConfig = {
      username: adminRecord.username,
      lastUpdated: adminRecord.updated_at,
    };

    if (action === 'get-super-admin') {
      return NextResponse.json({ success: true, superAdmin: superAdminMeta });
    }

    if (action === 'all') {
      // Guarded: only accessible by verified Super Admin session
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { data: businesses } = await admin
        .from('businesses')
        .select(`
          id, name, slug,
          business_roles (
            id, role_id, label, description, department, password, pin, updated_at
          )
        `)
        .order('name');

      const companies: BusinessCredentials[] = (businesses || []).map((b: any) => ({
        businessId: b.id,
        businessSlug: b.slug,
        businessName: b.name,
        roles: (b.business_roles || []).map((r: any) => ({
          role: r.role_id,
          label: r.label || r.role_id,
          department: r.department || 'General',
          password: r.password,
          pin: r.pin,
          lastUpdated: r.updated_at,
        })),
      }));

      return NextResponse.json({ success: true, companies, superAdmin: superAdminMeta });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching role credentials:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST: Secure verification and updates directly via Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const admin = getAdminClient();

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: LOGOUT
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'logout') {
      cookies().delete(SUPER_ADMIN_COOKIE);
      cookies().delete(USER_SESSION_COOKIE);
      return NextResponse.json({ success: true });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: VERIFY SUPER ADMIN (4-FACTOR BCRYPT MATCH)
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'verify-super-admin') {
      const { username, password, pin4, pin8 } = body;
      const u = (username || '').trim();
      const p = (password || '').trim();
      const p4 = (pin4 || '').trim();
      const p8 = (pin8 || '').trim();

      if (!u || !p || !p4 || !p8) {
        return NextResponse.json(
          { success: false, error: 'All 4 verification credentials (Username, Password, 4-digit PIN, 8-digit PIN) are mandatory.' },
          { status: 400 }
        );
      }

      const { data: adminRecord, error: saErr } = await admin
        .from('super_admin_credentials')
        .select('*')
        .eq('id', 'primary')
        .single();

      if (saErr || !adminRecord) {
        return NextResponse.json(
          { success: false, error: 'Database not initialized. Table "super_admin_credentials" not found in Supabase. Please run scripts/supabase_master_setup.sql first.' },
          { status: 503 }
        );
      }

      const expectedUsername = adminRecord.username;
      const expectedPassHash = adminRecord.password_hash;
      const expectedPin4Hash = adminRecord.pin4_hash;
      const expectedPin8Hash = adminRecord.pin8_hash;

      // Check lockout
      if (adminRecord?.locked_until) {
        const lockExpiry = new Date(adminRecord.locked_until).getTime();
        if (lockExpiry > Date.now()) {
          const remainingMinutes = Math.ceil((lockExpiry - Date.now()) / (60 * 1000));
          return NextResponse.json(
            { success: false, error: `Account locked due to 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` },
            { status: 403 }
          );
        }
      }

      const isUserMatch = u.toLowerCase() === expectedUsername.toLowerCase();
      const isPassMatch = bcrypt.compareSync(p, expectedPassHash);
      const isPin4Match = bcrypt.compareSync(p4, expectedPin4Hash);
      const isPin8Match = bcrypt.compareSync(p8, expectedPin8Hash);

      if (!isUserMatch || !isPassMatch || !isPin4Match || !isPin8Match) {
        if (adminRecord) {
          const newAttempts = (adminRecord.failed_attempts || 0) + 1;
          const updatePayload: Record<string, any> = { failed_attempts: newAttempts };
          if (newAttempts >= 5) {
            updatePayload.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          }
          await admin.from('super_admin_credentials').update(updatePayload).eq('id', 'primary');
        }
        return NextResponse.json({ success: false, error: 'Invalid master credentials. Access denied.' }, { status: 401 });
      }

      // Success
      if (adminRecord) {
        await admin.from('super_admin_credentials').update({ failed_attempts: 0, locked_until: null }).eq('id', 'primary');
      }

      const token = await signSession({
        sub: expectedUsername,
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
      }, 86400);

      cookies().set(SUPER_ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });

      return NextResponse.json({
        success: true,
        message: 'Master Super Admin authentication verified successfully.',
        user: { role: 'SUPER_ADMIN', username: expectedUsername },
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: UPDATE SUPER ADMIN CREDENTIALS
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'update-super-admin') {
      const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      const session = await verifySession(saToken);
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { newUsername, newPassword, newPin4, newPin8 } = body;
      if (!newUsername || !newPassword || !newPin4 || !newPin8) {
        return NextResponse.json(
          { success: false, error: 'New Username, Password, 4-digit PIN, and 8-digit PIN are required.' },
          { status: 400 }
        );
      }

      const passHash = bcrypt.hashSync(newPassword.trim(), 10);
      const pin4Hash = bcrypt.hashSync(newPin4.trim(), 10);
      const pin8Hash = bcrypt.hashSync(newPin8.trim(), 10);

      await admin.from('super_admin_credentials').upsert({
        id: 'primary',
        username: newUsername.trim(),
        password_hash: passHash,
        pin4_hash: pin4Hash,
        pin8_hash: pin8Hash,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Super Admin Master Credentials successfully hashed and updated in Supabase!',
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: VERIFY STAFF CREDENTIALS
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const { businessSlug, role, password, pin } = body;
      const slug = (businessSlug || '').trim();
      const roleName = (role || '').trim();
      const pass = (password || '').trim();
      const p = (pin || '').trim();

      if (!slug || !roleName || !pass) {
        return NextResponse.json({ success: false, error: 'Please select a role and enter your password.' }, { status: 400 });
      }

      const { data: b } = await admin.from('businesses').select('id, is_active').eq('slug', slug).single();
      if (!b || !b.is_active) {
        return NextResponse.json({ success: false, error: 'Business workspace not found or inactive.' }, { status: 404 });
      }

      const { data: dbRole } = await admin
        .from('business_roles')
        .select('*')
        .eq('business_id', b.id)
        .eq('role_id', roleName)
        .single();

      if (!dbRole) {
        return NextResponse.json({ success: false, error: `Role "${roleName}" not configured.` }, { status: 404 });
      }

      // Check lockout
      if (dbRole.locked_until && new Date(dbRole.locked_until).getTime() > Date.now()) {
        const remainingMinutes = Math.ceil((new Date(dbRole.locked_until).getTime() - Date.now()) / (60 * 1000));
        return NextResponse.json({ success: false, error: `Account locked after 5 failed attempts. Please retry in ${remainingMinutes} minute(s).` }, { status: 403 });
      }

      const isPassCorrect = pass === dbRole.password.trim();
      const isPinCorrect = !dbRole.pin || p === dbRole.pin.trim();

      if (!isPassCorrect || !isPinCorrect) {
        const attempts = (dbRole.failed_attempts || 0) + 1;
        const updatePayload: Record<string, any> = { failed_attempts: attempts };
        if (attempts >= 5) {
          updatePayload.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        await admin.from('business_roles').update(updatePayload).eq('id', dbRole.id);

        const remaining = 5 - attempts;
        const warning = remaining > 0 && remaining <= 3 ? ` (${remaining} attempt(s) remaining)` : '';
        return NextResponse.json({ success: false, error: `Incorrect password or PIN for role "${roleName}".${warning}` }, { status: 401 });
      }

      // Reset attempts
      await admin.from('business_roles').update({ failed_attempts: 0, locked_until: null }).eq('id', dbRole.id);

      const token = await signSession({
        sub: roleName,
        role: roleName,
        businessSlug: slug,
        isSuperAdmin: false,
      }, 43200);

      cookies().set(USER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 43200,
      });

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        role: roleName,
        businessSlug: slug,
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: UPDATE ROLE CREDENTIALS (SUPER ADMIN)
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'update') {
      const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      const session = await verifySession(saToken);
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { businessSlug, role, newPassword, newPin } = body;
      if (!role || !newPassword) {
        return NextResponse.json({ success: false, error: 'Role and new password are required' }, { status: 400 });
      }

      const { data: b } = await admin.from('businesses').select('id').eq('slug', businessSlug).single();
      if (!b) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

      const nowStr = new Date().toISOString();
      await admin.from('business_roles').update({
        password: newPassword.trim(),
        pin: (newPin || '').trim(),
        updated_at: nowStr,
        failed_attempts: 0,
        locked_until: null,
      }).eq('business_id', b.id).eq('role_id', role);

      return NextResponse.json({
        success: true,
        message: `Credentials for "${role}" updated in Supabase.`,
        lastUpdated: nowStr,
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ACTION: BATCH UPDATE (SUPER ADMIN)
    // ───────────────────────────────────────────────────────────────────────────
    if (action === 'batch-update') {
      const saToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value;
      const session = await verifySession(saToken);
      if (!session || !session.isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { businessSlug, credentials } = body;
      const { data: b } = await admin.from('businesses').select('id').eq('slug', businessSlug).single();
      if (!b) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

      const nowStr = new Date().toISOString();
      for (const item of (credentials || [])) {
        if (!item.role || !item.password) continue;
        await admin.from('business_roles').update({
          password: item.password.trim(),
          pin: (item.pin || '').trim(),
          updated_at: nowStr,
          failed_attempts: 0,
          locked_until: null,
        }).eq('business_id', b.id).eq('role_id', item.role);
      }

      return NextResponse.json({
        success: true,
        message: `All credentials for ${businessSlug} updated successfully in Supabase.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in role-credentials POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
