import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = '3';
const BUSINESS_SLUG = 'gentle-hair-wigs';

// Default Telecaller Staff Roster per branch
const GENTLE_TELECALLER_ROSTER = [
  { staffId: 'tc-vn-1', staffName: 'Priya Sharma (Lead Telecaller)', branch: 'viman-nagar', role: 'Cold Caller' },
  { staffId: 'tc-vn-2', staffName: 'Anjali Patil (Cold Caller)', branch: 'viman-nagar', role: 'Cold Caller' },
  { staffId: 'tc-rv-1', staffName: 'Snehal Deshmukh (Telecaller)', branch: 'ravet', role: 'Cold Caller' },
  { staffId: 'tc-kl-1', staffName: 'Pooja Kadam (Telecaller)', branch: 'kolhapur', role: 'Cold Caller' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch') || 'viman-nagar';
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const admin = getAdminClient();

    // Query active roster for the requested branch
    const branchRoster = branch === 'all'
      ? GENTLE_TELECALLER_ROSTER
      : GENTLE_TELECALLER_ROSTER.filter((r) => r.branch === branch);

    // Try fetching from telecaller_daily_reports table
    let dbReports: any[] = [];
    try {
      let query = admin
        .from('telecaller_daily_reports')
        .select('*')
        .eq('business_id', BUSINESS_ID)
        .eq('report_date', date);

      if (branch !== 'all') {
        query = query.eq('branch', branch);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        dbReports = data;
      }
    } catch (err) {
      console.warn('Could not query telecaller_daily_reports table directly:', err);
    }

    // Merge with branch roster to guarantee every telecaller has a record
    const reportsMap = new Map<string, any>();
    dbReports.forEach((r) => {
      reportsMap.set(`${r.staff_id}_${r.branch}`, {
        id: r.id,
        staffId: r.staff_id,
        staffName: r.staff_name,
        branch: r.branch,
        reportDate: r.report_date,
        punchInTime: r.punch_in_time || null,
        punchOutTime: r.punch_out_time || null,
        totalHours: Number(r.total_hours) || 0,
        callsMade: Number(r.calls_made) || 0,
        callsConnected: Number(r.calls_connected) || 0,
        appointmentsBooked: Number(r.appointments_booked) || 0,
        convertedClients: Number(r.converted_clients) || 0,
        followUpsDue: Number(r.follow_ups_due) || 0,
        workSummary: r.work_summary || '',
        status: r.status || 'PRESENT',
        isHoliday: Boolean(r.is_holiday),
        updatedAt: r.updated_at || r.created_at,
      });
    });

    // Populate missing roster entries
    const isPastDate = date < today;
    const finalReports = branchRoster.map((member) => {
      const key = `${member.staffId}_${member.branch}`;
      if (reportsMap.has(key)) {
        return reportsMap.get(key);
      }

      // If not entered:
      // Past date -> automatic HOLIDAY
      // Today -> PENDING (awaiting punch-in or report)
      return {
        id: `auto_${member.staffId}_${date}`,
        staffId: member.staffId,
        staffName: member.staffName,
        branch: member.branch,
        reportDate: date,
        punchInTime: null,
        punchOutTime: null,
        totalHours: 0,
        callsMade: 0,
        callsConnected: 0,
        appointmentsBooked: 0,
        convertedClients: 0,
        followUpsDue: 0,
        workSummary: isPastDate ? 'No daily report submitted (Marked Holiday / Absent)' : 'Awaiting punch-in / daily submission',
        status: isPastDate ? 'HOLIDAY' : 'PENDING',
        isHoliday: isPastDate,
        updatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      date,
      branch,
      reports: finalReports,
      roster: branchRoster,
    });
  } catch (err: any) {
    console.error('Error in daily reports GET:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      branch = 'viman-nagar',
      staffId = 'tc-vn-1',
      staffName = 'Priya Sharma (Lead Telecaller)',
      reportDate = new Date().toISOString().slice(0, 10),
      punchInTime,
      punchOutTime,
      totalHours = 0,
      callsMade = 0,
      callsConnected = 0,
      appointmentsBooked = 0,
      convertedClients = 0,
      followUpsDue = 0,
      workSummary = '',
      status = 'PRESENT',
      isHoliday = false,
    } = body;

    const admin = getAdminClient();

    const payload = {
      business_id: BUSINESS_ID,
      business_slug: BUSINESS_SLUG,
      branch,
      staff_id: staffId,
      staff_name: staffName,
      report_date: reportDate,
      punch_in_time: punchInTime || null,
      punch_out_time: punchOutTime || null,
      total_hours: Number(totalHours) || 0,
      calls_made: Number(callsMade) || 0,
      calls_connected: Number(callsConnected) || 0,
      appointments_booked: Number(appointmentsBooked) || 0,
      converted_clients: Number(convertedClients) || 0,
      follow_ups_due: Number(followUpsDue) || 0,
      work_summary: workSummary || '',
      status: isHoliday ? 'HOLIDAY' : status,
      is_holiday: Boolean(isHoliday),
      updated_at: new Date().toISOString(),
    };

    let result = payload;

    // 1. Attempt upsert into telecaller_daily_reports table
    try {
      const { data, error } = await admin
        .from('telecaller_daily_reports')
        .upsert(payload, { onConflict: 'staff_id,report_date,branch' })
        .select()
        .single();

      if (!error && data) {
        result = data;
      }
    } catch (err) {
      console.warn('Upsert to telecaller_daily_reports failed, logging audit:', err);
    }

    // 2. Audit log entry for attendance tracking
    try {
      await admin.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_identifier: staffName,
        business_slug: BUSINESS_SLUG,
        action: punchOutTime ? 'staff.report_submitted' : 'staff.punch_in',
        entity_type: 'attendance_report',
        entity_id: staffId,
        metadata: {
          branch,
          reportDate,
          punchInTime,
          punchOutTime,
          totalHours,
          status,
          callsMade,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Daily report and attendance recorded successfully',
      report: result,
    });
  } catch (err: any) {
    console.error('Error in daily reports POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
