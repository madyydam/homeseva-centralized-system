import { NextRequest, NextResponse } from 'next/server';
import { getMailTransporter, sendMemberWelcomeCredentialsEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const transporter = getMailTransporter();
    
    // Verify connection configuration
    await transporter.verify();

    const { searchParams } = new URL(req.url);
    const to = searchParams.get('to');

    let sendResult = null;
    if (to) {
      sendResult = await sendMemberWelcomeCredentialsEmail({
        to,
        memberName: 'Test Member',
        companyName: 'ADJS PRINTBOOTH',
        subcompany: 'Kiosk Calling Desk',
        role: 'Coldcaller',
        email: to,
        password: 'TestPassword@123',
        pin: '9876',
        businessSlug: 'adjs',
      });
    }

    return NextResponse.json({
      success: true,
      smtpConnected: true,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      user: process.env.SMTP_USER || 'madhurdhadve7@gmail.com',
      sendResult,
      message: to ? `Test email dispatched to ${to}` : 'SMTP connection verified successfully. Pass ?to=your_email to dispatch a sample credentials email.',
    });
  } catch (err: any) {
    console.error('SMTP test route error:', err);
    return NextResponse.json({
      success: false,
      smtpConnected: false,
      error: err?.message || 'SMTP connection failed',
    }, { status: 500 });
  }
}
