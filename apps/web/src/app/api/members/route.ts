import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { getCurrentSuperAdminSession } from '@/lib/authSession';
import { sendMemberWelcomeCredentialsEmail } from '@/lib/email';
import { hashCredential } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let businessId = searchParams.get('businessId');
    const businessSlug = searchParams.get('businessSlug');
    const roleId = searchParams.get('roleId');

    if (!businessId && businessSlug) {
      const biz = await prisma.business.findFirst({
        where: { slug: businessSlug },
        select: { id: true },
      });
      if (biz?.id) {
        businessId = biz.id;
      }
    }

    const members = await prisma.roleMember.findMany({
      where: {
        ...(businessId ? { businessId } : {}),
        ...(roleId ? { roleId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    // Passwords and PINs are strictly masked in all responses (Zero-Trust Security)
    const sanitizedMembers = members.map((m) => ({
      id: m.id,
      business_id: m.businessId,
      role_id: m.roleId,
      name: m.name,
      email: m.email,
      is_active: m.isActive,
      created_at: m.createdAt.toISOString(),
      updated_at: m.updatedAt.toISOString(),
      hasPassword: !!(m.password && m.password.trim()),
      hasPin: !!(m.pin && m.pin.trim()),
      password: '••••••••',
      pin: '••••',
    }));

    return NextResponse.json({ success: true, members: sanitizedMembers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      business_id,
      role_id,
      name,
      email,
      password,
      pin,
      subcompany,
      company_name,
      action,
      member_id,
    } = body;

    // ── Resend Credentials Email Action ──
    if (action === 'resend_email') {
      const targetId = member_id || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'Member ID is required to resend email' }, { status: 400 });
      }

      const m = await prisma.roleMember.findUnique({
        where: { id: targetId },
      });

      if (!m) {
        return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
      }

      const b = await prisma.business.findUnique({
        where: { id: m.businessId },
        select: { name: true, slug: true },
      });

      const cName = company_name || b?.name || 'HomeSeva Business';
      const bSlug = b?.slug || 'adjs';

      const mailRes = await sendMemberWelcomeCredentialsEmail({
        to: m.email,
        memberName: m.name,
        companyName: cName,
        subcompany: subcompany || undefined,
        role: m.roleId,
        email: m.email,
        password: m.password,
        pin: m.pin,
        businessSlug: bSlug,
      });

      return NextResponse.json({
        success: true,
        emailDispatched: mailRes.success,
        emailError: mailRes.error,
        message: mailRes.success
          ? `Credentials card email re-sent to ${m.email} successfully!`
          : `Failed to dispatch email: ${mailRes.error}`,
      });
    }

    // ── Standard Member Creation ──
    if (!business_id || !role_id || !name || !email || !password || !pin) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required: business_id, role_id, name, email, password, pin',
      }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanPin = pin.trim();
    const cleanName = name.trim();

    const passwordHash = await hashCredential(cleanPassword);
    const pinHash = await hashCredential(cleanPin);

    const newMember = await prisma.roleMember.create({
      data: {
        businessId: business_id,
        roleId: role_id,
        name: cleanName,
        email: cleanEmail,
        password: passwordHash,
        pin: pinHash,
        isActive: true,
      },
    });

    // 1. Fetch business metadata for rich card email
    const biz = await prisma.business.findUnique({
      where: { id: business_id },
      select: { name: true, slug: true },
    });

    const targetCompanyName = company_name || biz?.name || 'HomeSeva Business';
    const targetBusinessSlug = biz?.slug || 'adjs';

    // 2. Automatically dispatch colorful credential card email via SMTP!
    let emailDispatched = false;
    let emailError: string | null = null;

    try {
      const mailRes = await sendMemberWelcomeCredentialsEmail({
        to: cleanEmail,
        memberName: cleanName,
        companyName: targetCompanyName,
        subcompany: subcompany || undefined,
        role: role_id,
        email: cleanEmail,
        password: cleanPassword,
        pin: cleanPin,
        businessSlug: targetBusinessSlug,
      });

      emailDispatched = mailRes.success;
      if (!mailRes.success) {
        emailError = mailRes.error || 'Failed to dispatch email';
      }
    } catch (mailErr: any) {
      console.error('SMTP automated dispatch exception:', mailErr);
      emailError = mailErr?.message || 'SMTP exception';
    }

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        business_id: newMember.businessId,
        role_id: newMember.roleId,
        name: newMember.name,
        email: newMember.email,
        is_active: newMember.isActive,
        created_at: newMember.createdAt.toISOString(),
        updated_at: newMember.updatedAt.toISOString(),
        password: '••••••••',
        pin: '••••',
      },
      emailDispatched,
      emailError,
      message: emailDispatched
        ? `Member "${cleanName}" allotted! Credentials card email automatically sent to ${cleanEmail}.`
        : `Member allotted to database. (Email notice: ${emailError || 'pending'})`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, password, pin, is_active, resendCredentials, company_name, subcompany } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member id is required' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updatePayload.name = name.trim();
    if (email !== undefined) updatePayload.email = email.trim().toLowerCase();
    if (password !== undefined && password !== '' && password !== '••••••••') {
      updatePayload.password = await hashCredential(password.trim());
    }
    if (pin !== undefined && pin !== '' && pin !== '••••') {
      updatePayload.pin = await hashCredential(pin.trim());
    }
    if (is_active !== undefined) updatePayload.isActive = is_active;

    const data = await prisma.roleMember.update({
      where: { id },
      data: updatePayload,
    });

    let emailDispatched = false;
    let emailError: string | null = null;

    // If credentials updated or resend explicitly requested, dispatch updated card email
    if (resendCredentials || (password && password !== '••••••••') || (pin && pin !== '••••')) {
      try {
        const biz = await prisma.business.findUnique({
          where: { id: data.businessId },
          select: { name: true, slug: true },
        });

        const mailRes = await sendMemberWelcomeCredentialsEmail({
          to: data.email,
          memberName: data.name,
          companyName: company_name || biz?.name || 'HomeSeva Business',
          subcompany: subcompany || undefined,
          role: data.roleId,
          email: data.email,
          password: (password && password !== '••••••••') ? password.trim() : '(unchanged / confidential)',
          pin: (pin && pin !== '••••') ? pin.trim() : '(unchanged / confidential)',
          businessSlug: biz?.slug || 'adjs',
        });
        emailDispatched = mailRes.success;
        if (!mailRes.success) emailError = mailRes.error || null;
      } catch (err: any) {
        emailError = err?.message;
      }
    }

    return NextResponse.json({
      success: true,
      member: {
        id: data.id,
        business_id: data.businessId,
        role_id: data.roleId,
        name: data.name,
        email: data.email,
        is_active: data.isActive,
        created_at: data.createdAt.toISOString(),
        updated_at: data.updatedAt.toISOString(),
        password: '••••••••',
        pin: '••••',
      },
      emailDispatched,
      emailError,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentSuperAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member id is required' }, { status: 400 });
    }

    await prisma.roleMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
