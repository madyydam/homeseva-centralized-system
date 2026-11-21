import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, resolveBusinessId } from '@homeseva/db';
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

function formatOrder(o: any) {
  return {
    id: String(o.id),
    orderNumber: o.orderNumber,
    merchantName: o.merchantName,
    phone: o.phone,
    shopName: o.shopName || '',
    kioskModel: o.kioskModel,
    units: Number(o.units) || 1,
    unitPrice: Number(o.unitPrice) || 0,
    totalAmount: Number(o.totalAmount) || 0,
    stage: o.stage,
    city: o.city,
    orderDate: o.orderDate,
    trackingNumber: o.trackingNumber || undefined,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : String(o.updatedAt),
  };
}

export async function GET() {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalBizId = await resolveBusinessId('adjs');
    const rows = await prisma.printboothMachineOrder.findMany({
      where: {
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      orders: rows.map(formatOrder),
    });
  } catch (err: any) {
    console.error('Error fetching printbooth orders:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch orders', orders: [] },
      { status: 500 }
    );
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
    const {
      orderNumber,
      merchantName,
      phone,
      shopName,
      kioskModel,
      units = 1,
      unitPrice = 0,
      totalAmount = 0,
      stage = 'Order Booked',
      city,
      orderDate = new Date().toISOString().slice(0, 10),
      trackingNumber,
    } = body;

    if (!merchantName || !phone || !kioskModel) {
      return NextResponse.json(
        { success: false, error: 'Merchant Name, Phone, and Kiosk Model are required' },
        { status: 400 }
      );
    }

    const assignedId =
      typeof body.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)
        ? body.id
        : crypto.randomUUID();
    const assignedNumber = orderNumber || `PB-ORD-${Date.now().toString().slice(-6)}`;
    const assignedCity = city?.trim() || 'Pune';

    const order = await prisma.printboothMachineOrder.create({
      data: {
        id: assignedId,
        businessId: canonicalBizId,
        orderNumber: assignedNumber,
        merchantName: merchantName.trim(),
        phone: phone.trim(),
        shopName: shopName?.trim() || null,
        kioskModel: String(kioskModel),
        units: Number(units) || 1,
        unitPrice: Number(unitPrice) || 0,
        totalAmount: Number(totalAmount) || 0,
        stage: String(stage),
        city: assignedCity,
        orderDate: String(orderDate),
        trackingNumber: trackingNumber?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      order: formatOrder(order),
    });
  } catch (err: any) {
    console.error('Error creating printbooth order:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create order' },
      { status: 500 }
    );
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
    const { id, stage, trackingNumber } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const existing = await prisma.printboothMachineOrder.findFirst({
      where: {
        id,
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const data: any = {};
    if (stage !== undefined) data.stage = stage;
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;

    const updated = await prisma.printboothMachineOrder.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      order: formatOrder(updated),
    });
  } catch (err: any) {
    console.error('Error updating printbooth order:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update order' },
      { status: 500 }
    );
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
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    await prisma.printboothMachineOrder.deleteMany({
      where: {
        id,
        businessId: { in: [canonicalBizId, 'adjs', 'printbooth'] },
      },
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting printbooth order:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
