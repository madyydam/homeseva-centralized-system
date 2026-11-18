import { NextResponse } from 'next/server';
import { getCurrentStaffSession, getCurrentSuperAdminSession } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Check staff session
    const staffSession = await getCurrentStaffSession();
    if (staffSession) {
      return NextResponse.json({
        authenticated: true,
        isSuperAdmin: false,
        sub: staffSession.sub,
        role: staffSession.role,
        businessSlug: staffSession.businessSlug,
        username: staffSession.username,
        memberId: staffSession.memberId || staffSession.sub,
        memberName: staffSession.memberName || staffSession.username || 'Staff Member',
        email: staffSession.email || '',
      });
    }

    // 2. Check super admin session
    const saSession = await getCurrentSuperAdminSession();
    if (saSession) {
      return NextResponse.json({
        authenticated: true,
        isSuperAdmin: true,
        sub: saSession.sub,
        role: saSession.role || 'Super Admin',
        username: saSession.username || 'Super Admin',
        memberId: saSession.sub,
        memberName: saSession.username || 'Super Admin',
        email: saSession.email || 'admin@homeseva.com',
      });
    }

    return NextResponse.json({
      authenticated: false,
      error: 'No active session found',
    }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({
      authenticated: false,
      error: err.message,
    }, { status: 500 });
  }
}
