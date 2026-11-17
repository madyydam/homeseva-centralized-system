import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { PrintboothLeadItem } from '@/businesses/adjs/types';

export const dynamic = 'force-dynamic';

function formatPrintboothLead(row: any): PrintboothLeadItem {
  let notesList: [string, string, string, string, string] = ['', '', '', '', ''];
  if (Array.isArray(row.notes_list)) {
    notesList = [
      row.notes_list[0] || '',
      row.notes_list[1] || '',
      row.notes_list[2] || '',
      row.notes_list[3] || '',
      row.notes_list[4] || '',
    ];
  } else if (typeof row.notes_list === 'string') {
    try {
      const parsed = JSON.parse(row.notes_list);
      if (Array.isArray(parsed)) {
        notesList = [
          parsed[0] || '',
          parsed[1] || '',
          parsed[2] || '',
          parsed[3] || '',
          parsed[4] || '',
        ];
      }
    } catch {}
  }

  return {
    id: String(row.id),
    telecallerId: row.telecaller_id || undefined,
    telecallerName: row.telecaller_name || undefined,
    telecallerEmail: row.telecaller_email || undefined,
    clientName: row.client_name || 'Merchant Inquiry',
    phone: row.phone || '',
    shopName: row.shop_name || undefined,
    locationCategory: row.location_category || undefined,
    status: row.status || 'Interested',
    callCount: typeof row.call_count === 'number' ? row.call_count : 0,
    notesList,
    leadDate: row.lead_date || (row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || new Date().toISOString()),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || new Date().toISOString()),
    kioskModel: row.kiosk_model || undefined,
    unitsOrdered: typeof row.units_ordered === 'number' ? row.units_ordered : undefined,
    installationCity: row.installation_city || undefined,
  };
}

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.printbooth_crm_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id TEXT NOT NULL DEFAULT 'adjs',
      telecaller_id TEXT,
      telecaller_name TEXT,
      telecaller_email TEXT,
      sr_no INT,
      client_name TEXT NOT NULL DEFAULT 'Merchant Inquiry',
      phone TEXT NOT NULL,
      shop_name TEXT,
      location_category TEXT,
      city TEXT,
      kiosk_model TEXT,
      units_ordered INT DEFAULT 1,
      installation_city TEXT,
      status TEXT NOT NULL DEFAULT 'Interested',
      custom_status_text TEXT,
      call_count INT NOT NULL DEFAULT 0,
      notes_list JSONB NOT NULL DEFAULT '[]'::jsonb,
      lead_date TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const telecallerId = searchParams.get('telecallerId') || searchParams.get('memberId');
    const month = searchParams.get('month'); // e.g. "2026-10"
    const year = searchParams.get('year'); // e.g. "2026"

    let query = `SELECT * FROM public.printbooth_crm_leads WHERE business_id = 'adjs'`;
    const params: any[] = [];

    if (telecallerId && telecallerId !== 'all') {
      params.push(telecallerId);
      query += ` AND telecaller_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const rows: any = await prisma.$queryRawUnsafe(query, ...params);
    let leads = (Array.isArray(rows) ? rows : []).map(formatPrintboothLead);

    if (year) {
      leads = leads.filter((l) => (l.leadDate || '').startsWith(year));
    }
    if (month) {
      leads = leads.filter((l) => (l.leadDate || '').startsWith(month));
    }

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: any) {
    console.error('Error fetching printbooth leads:', error);
    return NextResponse.json({ success: false, error: error.message, leads: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();

    // Batch import support
    if (Array.isArray(body.leads)) {
      const created: any[] = [];
      for (const item of body.leads) {
        const notesJson = JSON.stringify(item.notesList || ['', '', '', '', '']);
        const leadDate = item.leadDate || new Date().toISOString().slice(0, 10);
        const rows: any = await prisma.$queryRawUnsafe(
          `INSERT INTO public.printbooth_crm_leads (
            telecaller_id, telecaller_name, telecaller_email, client_name, phone,
            shop_name, location_category, status, call_count, notes_list,
            lead_date, kiosk_model, units_ordered, installation_city
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14)
          RETURNING *`,
          item.telecallerId || null,
          item.telecallerName || null,
          item.telecallerEmail || null,
          item.clientName || 'Merchant Inquiry',
          item.phone,
          item.shopName || null,
          item.locationCategory || null,
          item.status || 'Interested',
          typeof item.callCount === 'number' ? item.callCount : 0,
          notesJson,
          leadDate,
          item.kioskModel || null,
          item.unitsOrdered || 1,
          item.installationCity || null
        );
        if (rows && rows[0]) {
          created.push(formatPrintboothLead(rows[0]));
        }
      }
      return NextResponse.json({ success: true, count: created.length, leads: created });
    }

    // Single lead creation - check duplicate phone
    const rawPhone = (body.phone || '').trim();
    const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10);

    if (phoneDigits && phoneDigits.length >= 5) {
      const existingRows: any = await prisma.$queryRawUnsafe(
        `SELECT id, client_name, phone FROM public.printbooth_crm_leads WHERE business_id = 'adjs'`
      );
      const existing = (existingRows || []).find((r: any) => (r.phone || '').replace(/\D/g, '').slice(-10) === phoneDigits);
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `This phone number (${rawPhone}) already exists in the CRM for ${existing.client_name}.`,
            existingLead: existing,
          },
          { status: 409 }
        );
      }
    }

    const notesJson = JSON.stringify(body.notesList || ['', '', '', '', '']);
    const leadDate = body.leadDate || new Date().toISOString().slice(0, 10);

    const rows: any = await prisma.$queryRawUnsafe(
      `INSERT INTO public.printbooth_crm_leads (
        telecaller_id, telecaller_name, telecaller_email, client_name, phone,
        shop_name, location_category, status, call_count, notes_list,
        lead_date, kiosk_model, units_ordered, installation_city
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14)
      RETURNING *`,
      body.telecallerId || null,
      body.telecallerName || null,
      body.telecallerEmail || null,
      body.clientName || 'Merchant Inquiry',
      body.phone,
      body.shopName || null,
      body.locationCategory || null,
      body.status || 'Interested',
      typeof body.callCount === 'number' ? body.callCount : 0,
      notesJson,
      leadDate,
      body.kioskModel || null,
      body.unitsOrdered || 1,
      body.installationCity || null
    );

    return NextResponse.json({
      success: true,
      lead: formatPrintboothLead(rows[0]),
    });
  } catch (error: any) {
    console.error('Error creating printbooth lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead id is required' }, { status: 400 });
    }

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [id];

    if (updates.clientName !== undefined) {
      params.push(updates.clientName);
      setClauses.push(`client_name = $${params.length}`);
    }
    if (updates.phone !== undefined) {
      params.push(updates.phone);
      setClauses.push(`phone = $${params.length}`);
    }
    if (updates.status !== undefined) {
      params.push(updates.status);
      setClauses.push(`status = $${params.length}`);
    }
    if (updates.callCount !== undefined) {
      params.push(updates.callCount);
      setClauses.push(`call_count = $${params.length}`);
    }
    if (updates.notesList !== undefined) {
      params.push(JSON.stringify(updates.notesList));
      setClauses.push(`notes_list = $${params.length}::jsonb`);
    }
    if (updates.shopName !== undefined) {
      params.push(updates.shopName);
      setClauses.push(`shop_name = $${params.length}`);
    }
    if (updates.locationCategory !== undefined) {
      params.push(updates.locationCategory);
      setClauses.push(`location_category = $${params.length}`);
    }
    if (updates.kioskModel !== undefined) {
      params.push(updates.kioskModel);
      setClauses.push(`kiosk_model = $${params.length}`);
    }
    if (updates.unitsOrdered !== undefined) {
      params.push(updates.unitsOrdered);
      setClauses.push(`units_ordered = $${params.length}`);
    }
    if (updates.installationCity !== undefined) {
      params.push(updates.installationCity);
      setClauses.push(`installation_city = $${params.length}`);
    }

    const query = `UPDATE public.printbooth_crm_leads SET ${setClauses.join(', ')} WHERE id = $1::uuid RETURNING *`;
    const rows: any = await prisma.$queryRawUnsafe(query, ...params);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      lead: formatPrintboothLead(rows[0]),
    });
  } catch (error: any) {
    console.error('Error updating printbooth lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead id is required' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM public.printbooth_crm_leads WHERE id = $1::uuid`,
      id
    );

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting printbooth lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
