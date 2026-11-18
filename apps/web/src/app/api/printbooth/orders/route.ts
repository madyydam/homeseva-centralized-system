import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = 'adjs';

async function ensureOrdersTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.printbooth_machine_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id TEXT NOT NULL DEFAULT 'adjs',
        order_number TEXT NOT NULL,
        merchant_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        shop_name TEXT,
        kiosk_model TEXT NOT NULL,
        units INT NOT NULL DEFAULT 1,
        unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        stage TEXT NOT NULL DEFAULT 'Order Booked',
        city TEXT NOT NULL,
        order_date TEXT NOT NULL,
        tracking_number TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.warn('ensureOrdersTable notice:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureOrdersTable();
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM public.printbooth_machine_orders WHERE business_id = $1 ORDER BY created_at DESC`,
      BUSINESS_ID
    );

    const orders = (Array.isArray(rows) ? rows : []).map((o: any) => ({
      id: String(o.id),
      orderNumber: o.order_number,
      merchantName: o.merchant_name,
      phone: o.phone,
      shopName: o.shop_name || '',
      kioskModel: o.kiosk_model,
      units: Number(o.units) || 1,
      unitPrice: Number(o.unit_price) || 0,
      totalAmount: Number(o.total_amount) || 0,
      stage: o.stage,
      city: o.city,
      orderDate: o.order_date,
      trackingNumber: o.tracking_number || undefined,
      createdAt: o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at),
    }));

    return NextResponse.json({
      success: true,
      orders,
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
    await ensureOrdersTable();
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

    const assignedId = (typeof body.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id))
      ? body.id
      : crypto.randomUUID();
    const assignedNumber = orderNumber || `PB-ORD-${Date.now().toString().slice(-6)}`;
    const assignedCity = city?.trim() || 'Pune';

    const insertQuery = `
      INSERT INTO public.printbooth_machine_orders (
        id, business_id, order_number, merchant_name, phone, shop_name, kiosk_model,
        units, unit_price, total_amount, stage, city, order_date, tracking_number
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const rows: any = await prisma.$queryRawUnsafe(
      insertQuery,
      assignedId,
      BUSINESS_ID,
      assignedNumber,
      merchantName.trim(),
      phone.trim(),
      shopName?.trim() || null,
      String(kioskModel),
      Number(units) || 1,
      Number(unitPrice) || 0,
      Number(totalAmount) || 0,
      String(stage),
      assignedCity,
      String(orderDate),
      trackingNumber?.trim() || null
    );

    const order = rows[0];

    return NextResponse.json({
      success: true,
      order: {
        id: String(order.id),
        orderNumber: order.order_number,
        merchantName: order.merchant_name,
        phone: order.phone,
        shopName: order.shop_name || '',
        kioskModel: order.kiosk_model,
        units: Number(order.units) || 1,
        unitPrice: Number(order.unit_price) || 0,
        totalAmount: Number(order.total_amount) || 0,
        stage: order.stage,
        city: order.city,
        orderDate: order.order_date,
        trackingNumber: order.tracking_number || undefined,
        createdAt: order.created_at instanceof Date ? order.created_at.toISOString() : String(order.created_at),
      },
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
    await ensureOrdersTable();
    const body = await req.json();
    const { id, stage, trackingNumber } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [id];

    if (stage) {
      params.push(stage);
      updates.push(`stage = $${params.length}`);
    }
    if (trackingNumber !== undefined) {
      params.push(trackingNumber);
      updates.push(`tracking_number = $${params.length}`);
    }

    const query = `
      UPDATE public.printbooth_machine_orders
      SET ${updates.join(', ')}
      WHERE id::text = $1::text
      RETURNING *;
    `;

    const rows: any = await prisma.$queryRawUnsafe(query, ...params);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: rows[0],
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
    await ensureOrdersTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM public.printbooth_machine_orders WHERE id::text = $1::text`,
      id
    );

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting printbooth order:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
