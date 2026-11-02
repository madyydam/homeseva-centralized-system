import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = '3'; // Gentle Hair Wigs Business ID

// Helper to format Prisma lead to frontend CrmLeadItem
function formatLead(lead: any) {
  return {
    id: lead.id,
    srNo: lead.srNo ?? undefined,
    studioSlug: lead.studioSlug,
    studioName: lead.studioName,
    clientName: lead.clientName?.trim() || "Don't know",
    phone: lead.phone,
    status: lead.status,
    customStatusText: lead.customStatusText ?? undefined,
    callCount: lead.callCount ?? 0,
    notesList: Array.isArray(lead.notesList) ? lead.notesList : [],
    city: lead.city ?? undefined,
    source: lead.source ?? undefined,
    stage: lead.stage ?? undefined,
    hairLossConcern: lead.hairLossConcern ?? undefined,
    interestCategory: lead.interestCategory ?? undefined,
    estimatedBudget: lead.estimatedBudget != null ? Number(lead.estimatedBudget) : undefined,
    assignedSpecialist: lead.assignedSpecialist ?? undefined,
    lastContactDate: lead.lastContactDate ?? undefined,
    nextFollowUpDate: lead.nextFollowUpDate ?? undefined,
    notes: lead.notes ?? undefined,
    priority: lead.priority ?? 'Normal',
    createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString().slice(0, 10) : String(lead.createdAt).slice(0, 10),
    updatedAt: lead.updatedAt instanceof Date ? lead.updatedAt.toISOString().slice(0, 10) : undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studioSlug = searchParams.get('studioSlug');
    const month = searchParams.get('month'); // e.g. "2026-10"
    const since = searchParams.get('since'); // ISO date string, e.g. "2026-10-30T10:00:00.000Z"

    const where: any = {
      businessId: BUSINESS_ID,
    };

    if (studioSlug && studioSlug !== 'all') {
      where.studioSlug = studioSlug;
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.updatedAt = {
          gt: sinceDate,
        };
      }
    }

    const leads = await prisma.gentleHairWigsLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let formatted = leads.map(formatLead);

    // If month filter is provided, filter by createdAt month
    if (month) {
      formatted = formatted.filter((l) => l.createdAt.startsWith(month));
    }

    return NextResponse.json(
      {
        success: true,
        count: formatted.length,
        serverTime: new Date().toISOString(),
        isDelta: Boolean(since),
        leads: formatted,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-transform',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching gentle crm leads from postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message, leads: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if body is an array (batch import)
    if (Array.isArray(body)) {
      const createdLeads = [];
      const existingInDb = await prisma.gentleHairWigsLead.findMany({
        where: { businessId: BUSINESS_ID },
        select: { phone: true },
      });
      const seenPhones = new Set(
        existingInDb.map((l) => (l.phone || '').replace(/\D/g, '').slice(-10)).filter(Boolean)
      );

      for (const item of body) {
        const itemDigits = (item.phone || '').replace(/\D/g, '').slice(-10);
        if (itemDigits && seenPhones.has(itemDigits)) {
          // Skip duplicate phone
          continue;
        }
        if (itemDigits) {
          seenPhones.add(itemDigits);
        }

        const lead = await prisma.gentleHairWigsLead.create({
          data: {
            businessId: BUSINESS_ID,
            srNo: item.srNo ?? null,
            studioSlug: item.studioSlug || 'viman-nagar',
            studioName: item.studioName || 'Studio of Viman Nagar',
            clientName: item.clientName?.trim() || "Don't know",
            phone: item.phone || '',
            status: item.status || 'Interested',
            customStatusText: item.customStatusText ?? null,
            callCount: typeof item.callCount === 'number' ? item.callCount : 0,
            notesList: Array.isArray(item.notesList) ? item.notesList : [],
            city: item.city ?? null,
            source: item.source ?? null,
            stage: item.stage ?? null,
            hairLossConcern: item.hairLossConcern ?? null,
            interestCategory: item.interestCategory ?? null,
            estimatedBudget: item.estimatedBudget != null ? Number(item.estimatedBudget) : null,
            assignedSpecialist: item.assignedSpecialist ?? null,
            lastContactDate: item.lastContactDate ?? null,
            nextFollowUpDate: item.nextFollowUpDate ?? null,
            notes: item.notes ?? null,
            priority: item.priority ?? 'Normal',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          },
        });
        createdLeads.push(formatLead(lead));
      }

      return NextResponse.json({
        success: true,
        count: createdLeads.length,
        leads: createdLeads,
      });
    }

    // Single lead creation - check duplicate phone
    const rawPhone = (body.phone || '').trim();
    const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10);

    if (phoneDigits && phoneDigits.length >= 5) {
      const allLeads = await prisma.gentleHairWigsLead.findMany({
        where: { businessId: BUSINESS_ID },
        select: { id: true, clientName: true, phone: true, studioName: true, status: true, createdAt: true },
      });
      const existing = allLeads.find((l) => (l.phone || '').replace(/\D/g, '').slice(-10) === phoneDigits);
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

    const lead = await prisma.gentleHairWigsLead.create({
      data: {
        businessId: BUSINESS_ID,
        srNo: body.srNo ?? null,
        studioSlug: body.studioSlug || 'viman-nagar',
        studioName: body.studioName || 'Studio of Viman Nagar',
        clientName: body.clientName?.trim() || "Don't know",
        phone: body.phone || '',
        status: body.status || 'Interested',
        customStatusText: body.customStatusText ?? null,
        callCount: typeof body.callCount === 'number' ? body.callCount : 0,
        notesList: Array.isArray(body.notesList) ? body.notesList : [],
        city: body.city ?? null,
        source: body.source ?? null,
        stage: body.stage ?? null,
        hairLossConcern: body.hairLossConcern ?? null,
        interestCategory: body.interestCategory ?? null,
        estimatedBudget: body.estimatedBudget != null ? Number(body.estimatedBudget) : null,
        assignedSpecialist: body.assignedSpecialist ?? null,
        lastContactDate: body.lastContactDate ?? null,
        nextFollowUpDate: body.nextFollowUpDate ?? null,
        notes: body.notes ?? null,
        priority: body.priority ?? 'Normal',
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      lead: formatLead(lead),
    });
  } catch (error: any) {
    console.error('Error creating gentle crm lead in postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead id is required' },
        { status: 400 }
      );
    }

    const data: any = {};
    if (updates.clientName !== undefined) data.clientName = updates.clientName?.trim() || "Don't know";
    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.customStatusText !== undefined) data.customStatusText = updates.customStatusText;
    if (updates.callCount !== undefined) data.callCount = updates.callCount;
    if (updates.notesList !== undefined) data.notesList = updates.notesList;
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.studioSlug !== undefined) data.studioSlug = updates.studioSlug;
    if (updates.studioName !== undefined) data.studioName = updates.studioName;
    if (updates.nextFollowUpDate !== undefined) data.nextFollowUpDate = updates.nextFollowUpDate;
    if (updates.lastContactDate !== undefined) data.lastContactDate = updates.lastContactDate;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.city !== undefined) data.city = updates.city;
    if (updates.source !== undefined) data.source = updates.source;
    if (updates.stage !== undefined) data.stage = updates.stage;
    if (updates.hairLossConcern !== undefined) data.hairLossConcern = updates.hairLossConcern;
    if (updates.interestCategory !== undefined) data.interestCategory = updates.interestCategory;
    if (updates.estimatedBudget !== undefined) data.estimatedBudget = updates.estimatedBudget;
    if (updates.createdAt !== undefined) data.createdAt = new Date(updates.createdAt);

    // If ID is a temp ID (e.g. from local optimistic creation before sync), check if exists or create
    let lead;
    const existing = await prisma.gentleHairWigsLead.findFirst({
      where: { id, businessId: BUSINESS_ID },
    });

    if (existing) {
      lead = await prisma.gentleHairWigsLead.update({
        where: { id },
        data,
      });
    } else {
      lead = await prisma.gentleHairWigsLead.create({
        data: {
          id,
          businessId: BUSINESS_ID,
          studioSlug: updates.studioSlug || 'viman-nagar',
          studioName: updates.studioName || 'Studio of Viman Nagar',
          clientName: updates.clientName?.trim() || "Don't know",
          phone: updates.phone || '',
          status: updates.status || 'Interested',
          ...data,
        },
      });
    }

    return NextResponse.json({
      success: true,
      lead: formatLead(lead),
    });
  } catch (error: any) {
    console.error('Error updating gentle crm lead in postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead id is required' },
        { status: 400 }
      );
    }

    await prisma.gentleHairWigsLead.deleteMany({
      where: {
        id,
        businessId: BUSINESS_ID,
      },
    });

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error: any) {
    console.error('Error deleting gentle crm lead from postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
