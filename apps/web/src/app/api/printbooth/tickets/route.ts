import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, resolveBusinessId } from '@homeseva/db';
import { getCurrentStaffSession, getCurrentSuperAdminSession } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

async function isAuthorized(): Promise<boolean> {
  const saSession = await getCurrentSuperAdminSession();
  if (saSession?.isSuperAdmin) return true;

  const staffSession = await getCurrentStaffSession();
  if (
    staffSession &&
    (staffSession.businessSlug === 'adjs' ||
      staffSession.businessSlug === 'printbooth' ||
      staffSession.businessSlug === '7')
  ) {
    return true;
  }

  return false;
}

function formatTicket(t: any) {
  return {
    id: String(t.id),
    ticketNumber: t.ticketNumber,
    merchantName: t.merchantName,
    phone: t.phone,
    issueType: t.issueType,
    status: t.status,
    resolutionNotes: t.resolutionNotes || undefined,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
  };
}

export async function GET() {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalBizId = await resolveBusinessId('adjs');
    const rows = await prisma.printboothSupportTicket.findMany({
      where: {
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      tickets: rows.map(formatTicket),
    });
  } catch (err: any) {
    console.error('Error fetching printbooth tickets:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch tickets', tickets: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalBizId = await resolveBusinessId('adjs');
    const body = await req.json();
    const {
      ticketNumber,
      merchantName,
      phone,
      issueType,
      status = 'Open',
      resolutionNotes,
    } = body;

    if (!merchantName || !phone || !issueType) {
      return NextResponse.json(
        { success: false, error: 'Merchant Name, Phone, and Issue Type are required' },
        { status: 400 }
      );
    }

    const assignedId =
      typeof body.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)
        ? body.id
        : crypto.randomUUID();
    const assignedNumber = ticketNumber || `PB-TCK-${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.printboothSupportTicket.create({
      data: {
        id: assignedId,
        businessId: canonicalBizId,
        ticketNumber: assignedNumber,
        merchantName: merchantName.trim(),
        phone: phone.trim(),
        issueType: String(issueType),
        status: String(status),
        resolutionNotes: resolutionNotes?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      ticket: formatTicket(ticket),
    });
  } catch (err: any) {
    console.error('Error creating printbooth ticket:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalBizId = await resolveBusinessId('adjs');
    const body = await req.json();
    const { id, status, resolutionNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required' }, { status: 400 });
    }

    const existing = await prisma.printboothSupportTicket.findFirst({
      where: {
        id,
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;

    const updated = await prisma.printboothSupportTicket.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      ticket: formatTicket(updated),
    });
  } catch (err: any) {
    console.error('Error updating printbooth ticket:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalBizId = await resolveBusinessId('adjs');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required' }, { status: 400 });
    }

    await prisma.printboothSupportTicket.deleteMany({
      where: {
        id,
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
    });

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting printbooth ticket:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
