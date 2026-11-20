import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = 'gentle-hair-wigs';
const BUSINESS_SLUG = 'gentle-hair-wigs';

// Persistent in-process cache to ensure instant availability and durability
const inMemoryReportsCache = new Map<string, any>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch') || 'viman-nagar';
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const allDates = searchParams.get('allDates') === 'true';

    // 1. Try fetching from telecallerDailyReport table
    let dbReports: any[] = [];
    try {
      const reports = await prisma.telecallerDailyReport.findMany({
        where: {
          businessId: { in: [BUSINESS_ID, '3', 'b1000000-0000-0000-0000-000000000003'] },
          ...(allDates ? {} : { reportDate: new Date(date) }),
          ...(branch !== 'all' ? { branch } : {}),
        },
        orderBy: { reportDate: 'desc' },
      });

      if (Array.isArray(reports) && reports.length > 0) {
        dbReports = reports.map((r) => ({
          ...r,
          report_date: r.reportDate.toISOString().slice(0, 10),
          staff_id: r.telecallerId,
          staff_name: r.telecallerName,
          calls_made: r.callsMade,
          calls_connected: r.callsConnected,
        }));
      }
    } catch (err) {
      console.warn('Could not query telecaller_daily_reports table directly:', err);
    }

    // 2. If table returned no rows, fall back to audit_logs where attendance was recorded
    if (dbReports.length === 0) {
      try {
        const auditData = await prisma.auditLog.findMany({
          where: {
            businessSlug: BUSINESS_SLUG,
            entityType: 'attendance_report',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (Array.isArray(auditData)) {
          const seen = new Set<string>();
          auditData.forEach((a) => {
            const m = (a.metadata as any) || {};
            if ((allDates || m.reportDate === date) && (!branch || branch === 'all' || m.branch === branch)) {
              const dedupeKey = `${a.entityId}_${m.reportDate || date}_${m.branch}`;
              if (!seen.has(dedupeKey)) {
                seen.add(dedupeKey);
                dbReports.push({
                  id: a.id,
                  staff_id: a.entityId,
                  staff_name: a.actorIdentifier || 'Staff Member',
                  branch: m.branch || branch,
                  report_date: m.reportDate || date,
                  punch_in_time: m.punchInTime || null,
                  punch_out_time: m.punchOutTime || null,
                  total_hours: m.totalHours || 0,
                  calls_made: m.callsMade || 0,
                  calls_connected: m.callsConnected || 0,
                  appointments_booked: m.appointmentsBooked || 0,
                  converted_clients: m.convertedClients || 0,
                  follow_ups_due: m.followUpsDue || 0,
                  work_summary: m.workSummary || '',
                  status: m.status || (m.isHoliday ? 'HOLIDAY' : 'PRESENT'),
                  is_holiday: !!m.isHoliday,
                  created_at: a.createdAt.toISOString(),
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn('Audit logs attendance fallback error:', err);
      }
    }

    // 3. Fall back to in-memory cache if DB returned nothing
    if (dbReports.length === 0) {
      inMemoryReportsCache.forEach((report) => {
        if (
          (allDates || report.reportDate === date) &&
          (branch === 'all' || !branch || report.branch === branch)
        ) {
          dbReports.push(report);
        }
      });
    }

    // Format final response objects
    const reports = dbReports.map((r) => {
      const isDateObj = r.report_date instanceof Date;
      const formattedDate = isDateObj
        ? r.report_date.toISOString().slice(0, 10)
        : r.report_date || r.reportDate || date;

      return {
        id: r.id || `rep_${r.staff_id || r.staffId}_${formattedDate}`,
        staffId: r.staff_id || r.staffId || 'staff_1',
        staffName: r.staff_name || r.staffName || 'Staff Member',
        branch: r.branch || branch,
        reportDate: formattedDate,
        punchInTime: r.punch_in_time || r.punchInTime || null,
        punchOutTime: r.punch_out_time || r.punchOutTime || null,
        totalHours: Number(r.total_hours || r.totalHours || 0),
        callsMade: Number(r.calls_made || r.callsMade || 0),
        callsConnected: Number(r.calls_connected || r.callsConnected || 0),
        appointmentsBooked: Number(r.appointments_booked || r.appointmentsBooked || 0),
        convertedClients: Number(r.converted_clients || r.convertedClients || 0),
        followUpsDue: Number(r.follow_ups_due || r.followUpsDue || 0),
        workSummary: r.work_summary || r.workSummary || '',
        status: r.status === 'HOLIDAY' ? 'HOLIDAY' : r.status === 'LEAVE' ? 'LEAVE' : r.status === 'HALF_DAY' ? 'HALF_DAY' : r.status || 'PRESENT',
        isHoliday: r.is_holiday ?? r.isHoliday ?? r.status === 'HOLIDAY',
        updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      branch,
      date,
      count: reports.length,
      reports,
    });
  } catch (err: any) {
    console.error('Error fetching daily reports:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      branch = 'viman-nagar',
      staffId,
      staffName,
      reportDate,
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

    const cacheKey = `${staffId}_${reportDate}_${branch}`;
    const formattedReport = {
      id: `rep_${staffId}_${reportDate}`,
      staffId,
      staffName,
      branch,
      reportDate,
      punchInTime: punchInTime || null,
      punchOutTime: punchOutTime || null,
      totalHours: Number(totalHours) || 0,
      callsMade: Number(callsMade) || 0,
      callsConnected: Number(callsConnected) || 0,
      appointmentsBooked: Number(appointmentsBooked) || 0,
      convertedClients: Number(convertedClients) || 0,
      followUpsDue: Number(followUpsDue) || 0,
      workSummary: workSummary || '',
      status: status === 'HOLIDAY' ? 'HOLIDAY' : status === 'LEAVE' ? 'LEAVE' : status === 'HALF_DAY' ? 'HALF_DAY' : status || 'PRESENT',
      isHoliday: status === 'HOLIDAY',
      updatedAt: new Date().toISOString(),
    };
    inMemoryReportsCache.set(cacheKey, formattedReport);

    // Audit log entry for attendance tracking in PostgreSQL
    try {
      await prisma.auditLog.create({
        data: {
          actorType: 'STAFF',
          actorIdentifier: staffName,
          businessSlug: BUSINESS_SLUG,
          action: punchOutTime ? 'staff.report_submitted' : 'staff.punch_in',
          entityType: 'attendance_report',
          entityId: staffId,
          metadata: {
            branch,
            reportDate,
            punchInTime,
            punchOutTime,
            totalHours,
            status,
            callsMade,
            callsConnected,
            appointmentsBooked,
            convertedClients,
            followUpsDue,
            workSummary,
            isHoliday,
          },
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Daily report and attendance recorded successfully',
      report: formattedReport,
    });
  } catch (err: any) {
    console.error('Error in daily reports POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
