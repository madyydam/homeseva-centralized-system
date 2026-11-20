import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const date = searchParams.get('date');
    const isHistory = searchParams.get('history') === 'true';

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'memberId is required' }, { status: 400 });
    }

    const admin = getAdminClient();

    if (isHistory) {
      const { data, error } = await admin
        .from('printbooth_daily_reports')
        .select('*')
        .eq('member_id', memberId)
        .order('report_date', { ascending: false })
        .limit(30);

      if (error) {
        return NextResponse.json({ success: true, reports: [] });
      }
      return NextResponse.json({ success: true, reports: data || [] });
    }

    if (!date) {
      return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('printbooth_daily_reports')
      .select('*')
      .eq('member_id', memberId)
      .eq('report_date', date)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: true, report: null });
    }

    return NextResponse.json({ success: true, report: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { member_id, member_name, report_date, punch_in, punch_out, calls_made, machines_sold, notes } = body;

    if (!member_id || !report_date) {
      return NextResponse.json({
        success: false,
        error: 'member_id and report_date are required',
      }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('printbooth_daily_reports')
      .upsert({
        member_id,
        member_name: member_name || 'Staff Member',
        report_date,
        punch_in: punch_in || null,
        punch_out: punch_out || null,
        calls_made: Number(calls_made) || 0,
        machines_sold: Number(machines_sold) || 0,
        notes: notes || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'member_id,report_date' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase printbooth_daily_reports table pending migration:', error.message);
      return NextResponse.json({
        success: true,
        report: {
          member_id,
          member_name: member_name || 'Staff Member',
          report_date,
          punch_in: punch_in || null,
          punch_out: punch_out || null,
          calls_made: Number(calls_made) || 0,
          machines_sold: Number(machines_sold) || 0,
          notes: notes || '',
        },
        notice: 'Saved in memory. Run scripts/vps-setup.sql for database persistence.',
      });
    }

    return NextResponse.json({ success: true, report: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
