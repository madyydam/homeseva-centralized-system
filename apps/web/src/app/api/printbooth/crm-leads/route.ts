import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, resolveBusinessId } from '@homeseva/db';
import { PrintboothLeadItem } from '@/businesses/adjs/types';
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

function formatPrintboothLead(row: any): PrintboothLeadItem {
  let notesList: [string, string, string, string, string] = ['', '', '', '', ''];
  const rawNotes = row.notesList ?? row.notes_list;
  if (Array.isArray(rawNotes)) {
    notesList = [
      rawNotes[0] || '',
      rawNotes[1] || '',
      rawNotes[2] || '',
      rawNotes[3] || '',
      rawNotes[4] || '',
    ];
  } else if (typeof rawNotes === 'string') {
    try {
      const parsed = JSON.parse(rawNotes);
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

  const createdAt = row.createdAt ?? row.created_at;
  const updatedAt = row.updatedAt ?? row.updated_at;

  return {
    id: String(row.id),
    telecallerId: (row.telecallerId ?? row.telecaller_id) || undefined,
    telecallerName: (row.telecallerName ?? row.telecaller_name) || undefined,
    telecallerEmail: (row.telecallerEmail ?? row.telecaller_email) || undefined,
    clientName: (row.clientName ?? row.client_name) || 'Merchant Inquiry',
    phone: row.phone || '',
    shopName: (row.shopName ?? row.shop_name) || undefined,
    locationCategory: (row.locationCategory ?? row.location_category) || undefined,
    status: row.status || 'Interested',
    callCount: typeof (row.callCount ?? row.call_count) === 'number' ? (row.callCount ?? row.call_count) : 0,
    notesList,
    leadDate: (row.leadDate ?? row.lead_date) || (createdAt ? new Date(createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt || new Date().toISOString()),
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt || new Date().toISOString()),
    kioskModel: (row.kioskModel ?? row.kiosk_model) || undefined,
    unitsOrdered: typeof (row.unitsOrdered ?? row.units_ordered) === 'number' ? (row.unitsOrdered ?? row.units_ordered) : undefined,
    installationCity: (row.installationCity ?? row.installation_city) || undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalBizId = await resolveBusinessId('adjs');
    const { searchParams } = new URL(req.url);
    const telecallerId = searchParams.get('telecallerId') || searchParams.get('memberId');
    const month = searchParams.get('month'); // e.g. "2026-10"
    const year = searchParams.get('year'); // e.g. "2026"

    const where: any = {
      businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
    };

    if (telecallerId && telecallerId !== 'all') {
      where.telecallerId = telecallerId;
    }

    const rows = await prisma.printboothLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let leads = rows.map(formatPrintboothLead);

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
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalBizId = await resolveBusinessId('adjs');
    const body = await req.json();

    // Batch import support
    if (Array.isArray(body.leads)) {
      const incomingDigits = body.leads
        .map((item: any) => (item.phone || '').replace(/\D/g, '').slice(-10))
        .filter((d: string) => d.length >= 5);

      const existingInDb = incomingDigits.length > 0
        ? await prisma.printboothLead.findMany({
            where: {
              businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
              OR: incomingDigits.slice(0, 500).map((d: string) => ({ phone: { endsWith: d } })),
            },
            select: { phone: true },
          })
        : [];

      const seenPhones = new Set(
        existingInDb.map((l) => (l.phone || '').replace(/\D/g, '').slice(-10)).filter(Boolean)
      );

      const created: any[] = [];
      for (const item of body.leads) {
        const itemDigits = (item.phone || '').replace(/\D/g, '').slice(-10);
        if (itemDigits && seenPhones.has(itemDigits)) {
          continue;
        }
        if (itemDigits) {
          seenPhones.add(itemDigits);
        }

        const notesList = item.notesList || ['', '', '', '', ''];
        const leadDate = item.leadDate || new Date().toISOString().slice(0, 10);

        const newLead = await prisma.printboothLead.create({
          data: {
            businessId: canonicalBizId,
            telecallerId: item.telecallerId || null,
            telecallerName: item.telecallerName || null,
            telecallerEmail: item.telecallerEmail || null,
            clientName: item.clientName || 'Merchant Inquiry',
            phone: item.phone,
            shopName: item.shopName || null,
            locationCategory: item.locationCategory || null,
            status: item.status || 'Interested',
            callCount: typeof item.callCount === 'number' ? item.callCount : 0,
            notesList: notesList,
            leadDate,
            kioskModel: item.kioskModel || null,
            unitsOrdered: typeof item.unitsOrdered === 'number' ? item.unitsOrdered : 1,
            installationCity: item.installationCity || null,
          },
        });
        created.push(formatPrintboothLead(newLead));
      }
      return NextResponse.json({ success: true, count: created.length, leads: created });
    }

    // Single lead creation - check duplicate phone
    const rawPhone = (body.phone || '').trim();
    const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10);

    if (phoneDigits && phoneDigits.length >= 5) {
      const existing = await prisma.printboothLead.findFirst({
        where: {
          businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
          phone: { endsWith: phoneDigits },
        },
        select: { id: true, clientName: true, phone: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `This phone number (${rawPhone}) already exists in the CRM for ${existing.clientName}.`,
            existingLead: existing,
          },
          { status: 409 }
        );
      }
    }

    const notesList = body.notesList || ['', '', '', '', ''];
    const leadDate = body.leadDate || new Date().toISOString().slice(0, 10);
    const assignedId =
      typeof body.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)
        ? body.id
        : crypto.randomUUID();

    const createdLead = await prisma.printboothLead.create({
      data: {
        id: assignedId,
        businessId: canonicalBizId,
        telecallerId: body.telecallerId || null,
        telecallerName: body.telecallerName || null,
        telecallerEmail: body.telecallerEmail || null,
        clientName: body.clientName || 'Merchant Inquiry',
        phone: body.phone,
        shopName: body.shopName || null,
        locationCategory: body.locationCategory || null,
        status: body.status || 'Interested',
        callCount: typeof body.callCount === 'number' ? body.callCount : 0,
        notesList: notesList,
        leadDate,
        kioskModel: body.kioskModel || null,
        unitsOrdered: typeof body.unitsOrdered === 'number' ? body.unitsOrdered : 1,
        installationCity: body.installationCity || null,
      },
    });

    return NextResponse.json({
      success: true,
      lead: formatPrintboothLead(createdLead),
    });
  } catch (error: any) {
    console.error('Error creating printbooth lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead id is required' }, { status: 400 });
    }

    const data: any = {};
    if (updates.clientName !== undefined) data.clientName = updates.clientName;
    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.callCount !== undefined) data.callCount = updates.callCount;
    if (updates.notesList !== undefined) data.notesList = updates.notesList;
    if (updates.shopName !== undefined) data.shopName = updates.shopName;
    if (updates.locationCategory !== undefined) data.locationCategory = updates.locationCategory;
    if (updates.kioskModel !== undefined) data.kioskModel = updates.kioskModel;
    if (updates.unitsOrdered !== undefined) data.unitsOrdered = updates.unitsOrdered;
    if (updates.installationCity !== undefined) data.installationCity = updates.installationCity;

    const existing = await prisma.printboothLead.findFirst({
      where: {
        id,
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const updated = await prisma.printboothLead.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      lead: formatPrintboothLead(updated),
    });
  } catch (error: any) {
    console.error('Error updating printbooth lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Lead id is required' }, { status: 400 });
    }

    await prisma.printboothLead.deleteMany({
      where: {
        id,
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
    });

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting printbooth lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
