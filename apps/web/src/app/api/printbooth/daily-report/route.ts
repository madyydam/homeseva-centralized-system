import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
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

function parseUtcMidnight(dateStr: string): Date {
  const clean = dateStr.slice(0, 10);
  return new Date(`${clean}T00:00:00.000Z`);
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const date = searchParams.get('date');
    const isHistory = searchParams.get('history') === 'true';

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'memberId is required' }, { status: 400 });
    }

    if (isHistory) {
      const reports = await prisma.printboothDailyReport.findMany({
        where: { memberId },
        orderBy: { reportDate: 'desc' },
        take: 30,
      });

      const serialized = reports.map((r) => ({
        id: r.id,
        member_id: r.memberId,
        member_name: r.memberName,
        report_date: r.reportDate.toISOString().slice(0, 10),
        punch_in: r.punchIn,
        punch_out: r.punchOut,
        calls_made: r.callsMade,
        machines_sold: r.machinesSold,
        notes: r.notes,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));

      return NextResponse.json({ success: true, reports: serialized });
    }

    if (!date) {
      return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
    }

    const report = await prisma.printboothDailyReport.findFirst({
      where: {
        memberId,
        reportDate: parseUtcMidnight(date),
      },
    });

    if (!report) {
      return NextResponse.json({ success: true, report: null });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        member_id: report.memberId,
        member_name: report.memberName,
        report_date: report.reportDate.toISOString().slice(0, 10),
        punch_in: report.punchIn,
        punch_out: report.punchOut,
        calls_made: report.callsMade,
        machines_sold: report.machinesSold,
        notes: report.notes,
        created_at: report.createdAt.toISOString(),
        updated_at: report.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { member_id, member_name, report_date, punch_in, punch_out, calls_made, machines_sold, notes } = body;

    if (!member_id || !report_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'member_id and report_date are required',
        },
        { status: 400 }
      );
    }

    const reportDateObj = parseUtcMidnight(report_date);

    const report = await prisma.printboothDailyReport.upsert({
      where: {
        memberId_reportDate: {
          memberId: member_id,
          reportDate: reportDateObj,
        },
      },
      update: {
        memberName: member_name || 'Staff Member',
        punchIn: punch_in || null,
        punchOut: punch_out || null,
        callsMade: Number(calls_made) || 0,
        machinesSold: Number(machines_sold) || 0,
        notes: notes || '',
        updatedAt: new Date(),
      },
      create: {
        memberId: member_id,
        memberName: member_name || 'Staff Member',
        reportDate: reportDateObj,
        punchIn: punch_in || null,
        punchOut: punch_out || null,
        callsMade: Number(calls_made) || 0,
        machinesSold: Number(machines_sold) || 0,
        notes: notes || '',
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        member_id: report.memberId,
        member_name: report.memberName,
        report_date: report.reportDate.toISOString().slice(0, 10),
        punch_in: report.punchIn,
        punch_out: report.punchOut,
        calls_made: report.callsMade,
        machines_sold: report.machinesSold,
        notes: report.notes,
        created_at: report.createdAt.toISOString(),
        updated_at: report.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error in printbooth daily report POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
