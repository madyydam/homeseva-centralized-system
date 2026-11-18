import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = 'adjs';

async function ensureTicketsTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.printbooth_support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id TEXT NOT NULL DEFAULT 'adjs',
        ticket_number TEXT NOT NULL,
        merchant_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        resolution_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.warn('ensureTicketsTable notice:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTicketsTable();
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM public.printbooth_support_tickets WHERE business_id = $1 ORDER BY created_at DESC`,
      BUSINESS_ID
    );

    const tickets = (Array.isArray(rows) ? rows : []).map((t: any) => ({
      id: String(t.id),
      ticketNumber: t.ticket_number,
      merchantName: t.merchant_name,
      phone: t.phone,
      issueType: t.issue_type,
      status: t.status,
      resolutionNotes: t.resolution_notes || undefined,
      createdAt: t.created_at instanceof Date ? t.created_at.toISOString() : String(t.created_at),
    }));

    return NextResponse.json({
      success: true,
      tickets,
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
    await ensureTicketsTable();
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

    const assignedId = (typeof body.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id))
      ? body.id
      : crypto.randomUUID();
    const assignedNumber = ticketNumber || `PB-TCK-${Date.now().toString().slice(-6)}`;

    const insertQuery = `
      INSERT INTO public.printbooth_support_tickets (
        id, business_id, ticket_number, merchant_name, phone, issue_type, status, resolution_notes
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const rows: any = await prisma.$queryRawUnsafe(
      insertQuery,
      assignedId,
      BUSINESS_ID,
      assignedNumber,
      merchantName.trim(),
      phone.trim(),
      String(issueType),
      String(status),
      resolutionNotes?.trim() || null
    );

    const ticket = rows[0];

    return NextResponse.json({
      success: true,
      ticket: {
        id: String(ticket.id),
        ticketNumber: ticket.ticket_number,
        merchantName: ticket.merchant_name,
        phone: ticket.phone,
        issueType: ticket.issue_type,
        status: ticket.status,
        resolutionNotes: ticket.resolution_notes || undefined,
        createdAt: ticket.created_at instanceof Date ? ticket.created_at.toISOString() : String(ticket.created_at),
      },
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
    await ensureTicketsTable();
    const body = await req.json();
    const { id, status, resolutionNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required' }, { status: 400 });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [id];

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (resolutionNotes !== undefined) {
      params.push(resolutionNotes);
      updates.push(`resolution_notes = $${params.length}`);
    }

    const query = `
      UPDATE public.printbooth_support_tickets
      SET ${updates.join(', ')}
      WHERE id::text = $1::text
      RETURNING *;
    `;

    const rows: any = await prisma.$queryRawUnsafe(query, ...params);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: rows[0],
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
    await ensureTicketsTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM public.printbooth_support_tickets WHERE id::text = $1::text`,
      id
    );

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting printbooth ticket:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
