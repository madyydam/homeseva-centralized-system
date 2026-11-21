import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Legacy role verification endpoint.
 * Permanently disabled in production to enforce strict individual member authentication:
 * Every staff member must authenticate with their allotted email, password, and security PIN
 * in their specific assigned company and role.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Legacy role authentication is disabled. All access requires individual member credentials (email, password, and security PIN).',
    },
    { status: 403 }
  );
}
