import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = '3';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studioSlug = searchParams.get('studioSlug') || 'viman-nagar';

    const where: any = { businessId: BUSINESS_ID };
    if (studioSlug && studioSlug !== 'all') {
      where.studioSlug = studioSlug;
    }

    const [
      orders,
      measurements,
      appointments,
      inventory,
      invoices,
      assets,
      dailyTasks,
      callLogs,
      transactions,
    ] = await Promise.all([
      prisma.gentleHairWigsOrder.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.gentleHairWigsMeasurement.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.gentleHairWigsAppointment.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.gentleHairWigsInventoryItem.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.gentleHairWigsInvoice.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.gentleHairWigsAsset.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.gentleHairWigsDailyTask.findMany({ where, orderBy: { createdAt: 'asc' } }),
      prisma.gentleHairWigsCallLog.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.gentleHairWigsFinanceTransaction.findMany({ where, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          clientName: o.clientName?.trim() || "Don't know",
          phone: o.phone,
          wigType: o.wigType,
          density: o.density,
          hairLength: o.hairLength,
          hairShade: o.hairShade,
          amount: Number(o.amount),
          advancePaid: Number(o.advancePaid),
          fittingDate: o.fittingDate,
          stage: o.stage,
          createdAt: o.createdAt.toISOString().slice(0, 10),
        })),
        measurements: measurements.map((m) => ({
          id: m.id,
          clientName: m.clientName?.trim() || "Don't know",
          phone: m.phone,
          hairLossType: m.hairLossType,
          circumference: m.circumference,
          frontToNape: m.frontToNape,
          earToEar: m.earToEar,
          templeToTemple: m.templeToTemple,
          baseSize: m.baseSize,
          baseMaterial: m.baseMaterial,
          attachmentMethod: m.attachmentMethod,
          notes: m.notes ?? '',
          recordedAt: m.recordedAt,
        })),
        appointments: appointments.map((a) => ({
          id: a.id,
          clientName: a.clientName?.trim() || "Don't know",
          phone: a.phone,
          serviceType: a.serviceType,
          suite: a.suite,
          stylistName: a.stylistName,
          appointmentDate: a.appointmentDate,
          timeSlot: a.timeSlot,
          status: a.status,
        })),
        inventory: inventory.map((i) => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
          category: i.category,
          stockQuantity: i.stockQuantity,
          reorderLevel: i.reorderLevel,
          unitPrice: Number(i.unitPrice),
          unit: i.unit,
        })),
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName?.trim() || "Don't know",
          phone: inv.phone,
          itemsSummary: inv.itemsSummary,
          subtotal: Number(inv.subtotal),
          gstAmount: Number(inv.gstAmount),
          totalAmount: Number(inv.totalAmount),
          paymentMode: inv.paymentMode,
          paymentStatus: inv.paymentStatus,
          invoiceDate: inv.invoiceDate,
        })),
        assets: assets.map((ast) => ({
          id: ast.id,
          name: ast.name,
          category: ast.category,
          quantity: ast.quantity,
          condition: ast.condition,
          purchaseCost: Number(ast.purchaseCost),
          location: ast.location,
          lastServiceDate: ast.lastServiceDate ?? undefined,
        })),
        dailyTasks: dailyTasks.map((t) => ({
          id: t.id,
          taskTitle: t.taskTitle,
          category: t.category,
          assignedTo: t.assignedTo,
          timeSlot: t.timeSlot,
          completed: t.completed,
          completedAt: t.completedAt ?? undefined,
        })),
        callLogs: callLogs.map((c) => ({
          id: c.id,
          clientName: c.clientName?.trim() || "Don't know",
          phone: c.phone,
          callType: c.callType,
          status: c.status,
          notes: c.notes,
          date: c.date,
        })),
        financeTransactions: transactions.map((f) => ({
          id: f.id,
          type: f.type,
          category: f.category,
          description: f.description,
          amount: Number(f.amount),
          date: f.date,
          month: f.month,
          paymentMode: f.paymentMode,
          recordedBy: f.recordedBy,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching gentle studio sync data from postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entity, studioSlug = 'viman-nagar', item, items } = body;

    const dataList = Array.isArray(items) ? items : item ? [item] : [];
    if (!entity || dataList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Entity and item(s) are required' },
        { status: 400 }
      );
    }

    const results: any[] = [];

    for (const record of dataList) {
      const recordId = record.id || undefined;

      switch (entity) {
        case 'order': {
          const updateOrder: any = {};
          if (record.stage !== undefined) updateOrder.stage = record.stage;
          if (record.advancePaid != null) updateOrder.advancePaid = Number(record.advancePaid);
          if (record.amount != null) updateOrder.amount = Number(record.amount);
          if (record.fittingDate !== undefined) updateOrder.fittingDate = record.fittingDate;

          const res = recordId
            ? await prisma.gentleHairWigsOrder.upsert({
                where: { id: recordId },
                update: updateOrder,
                create: {
                  id: recordId,
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  clientName: record.clientName?.trim() || "Don't know",
                  phone: record.phone || '',
                  wigType: record.wigType || '',
                  density: record.density || '130%',
                  hairLength: record.hairLength || '10 Inch',
                  hairShade: record.hairShade || '#1B',
                  amount: Number(record.amount) || 0,
                  advancePaid: Number(record.advancePaid) || 0,
                  fittingDate: record.fittingDate || '',
                  stage: record.stage || 'Measurements Recorded',
                },
              })
            : await prisma.gentleHairWigsOrder.create({
                data: {
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  clientName: record.clientName?.trim() || "Don't know",
                  phone: record.phone || '',
                  wigType: record.wigType || '',
                  density: record.density || '130%',
                  hairLength: record.hairLength || '10 Inch',
                  hairShade: record.hairShade || '#1B',
                  amount: Number(record.amount) || 0,
                  advancePaid: Number(record.advancePaid) || 0,
                  fittingDate: record.fittingDate || '',
                  stage: record.stage || 'Measurements Recorded',
                },
              });
          results.push(res);
          break;
        }

        case 'measurement': {
          const res = recordId
            ? await prisma.gentleHairWigsMeasurement.upsert({
                where: { id: recordId },
                update: { ...record },
                create: {
                  id: recordId,
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  clientName: record.clientName?.trim() || "Don't know",
                  phone: record.phone || '',
                  hairLossType: record.hairLossType || '',
                  circumference: record.circumference || '',
                  frontToNape: record.frontToNape || '',
                  earToEar: record.earToEar || '',
                  templeToTemple: record.templeToTemple || '',
                  baseSize: record.baseSize || '',
                  baseMaterial: record.baseMaterial || '',
                  attachmentMethod: record.attachmentMethod || '',
                  notes: record.notes || '',
                  recordedAt: record.recordedAt || '',
                },
              })
            : await prisma.gentleHairWigsMeasurement.create({
                data: {
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  clientName: record.clientName?.trim() || "Don't know",
                  phone: record.phone || '',
                  hairLossType: record.hairLossType || '',
                  circumference: record.circumference || '',
                  frontToNape: record.frontToNape || '',
                  earToEar: record.earToEar || '',
                  templeToTemple: record.templeToTemple || '',
                  baseSize: record.baseSize || '',
                  baseMaterial: record.baseMaterial || '',
                  attachmentMethod: record.attachmentMethod || '',
                  notes: record.notes || '',
                  recordedAt: record.recordedAt || '',
                },
              });
          results.push(res);
          break;
        }

        case 'appointment': {
          const updateAppt: any = {};
          if (record.status !== undefined) updateAppt.status = record.status;
          if (record.stylistName !== undefined) updateAppt.stylistName = record.stylistName;
          if (record.suite !== undefined) updateAppt.suite = record.suite;

          const res = recordId
            ? await prisma.gentleHairWigsAppointment.upsert({
                where: { id: recordId },
                update: updateAppt,
                create: {
                  id: recordId,
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  clientName: record.clientName?.trim() || "Don't know",
                  phone: record.phone || '',
                  serviceType: record.serviceType || '',
                  suite: record.suite || '',
                  stylistName: record.stylistName || '',
                  appointmentDate: record.appointmentDate || '',
                  timeSlot: record.timeSlot || '',
                  status: record.status || 'Scheduled',
                },
              })
            : await prisma.gentleHairWigsAppointment.create({
                data: {
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  clientName: record.clientName?.trim() || "Don't know",
                  phone: record.phone || '',
                  serviceType: record.serviceType || '',
                  suite: record.suite || '',
                  stylistName: record.stylistName || '',
                  appointmentDate: record.appointmentDate || '',
                  timeSlot: record.timeSlot || '',
                  status: record.status || 'Scheduled',
                },
              });
          results.push(res);
          break;
        }

        case 'inventory': {
          const updateInv: any = {};
          if (record.stockQuantity != null) updateInv.stockQuantity = Number(record.stockQuantity);
          if (record.unitPrice != null) updateInv.unitPrice = Number(record.unitPrice);

          const res = recordId
            ? await prisma.gentleHairWigsInventoryItem.upsert({
                where: { id: recordId },
                update: updateInv,
                create: {
                  id: recordId,
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  sku: record.sku || '',
                  name: record.name || '',
                  category: record.category || '',
                  stockQuantity: Number(record.stockQuantity) || 0,
                  reorderLevel: Number(record.reorderLevel) || 0,
                  unitPrice: Number(record.unitPrice) || 0,
                  unit: record.unit || 'Units',
                },
              })
            : await prisma.gentleHairWigsInventoryItem.create({
                data: {
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  sku: record.sku || '',
                  name: record.name || '',
                  category: record.category || '',
                  stockQuantity: Number(record.stockQuantity) || 0,
                  reorderLevel: Number(record.reorderLevel) || 0,
                  unitPrice: Number(record.unitPrice) || 0,
                  unit: record.unit || 'Units',
                },
              });
          results.push(res);
          break;
        }

        case 'invoice': {
          const res = await prisma.gentleHairWigsInvoice.create({
            data: {
              id: recordId,
              businessId: BUSINESS_ID,
              studioSlug: record.studioSlug || studioSlug,
              invoiceNumber: record.invoiceNumber || `INV-${Date.now()}`,
              clientName: record.clientName?.trim() || "Don't know",
              phone: record.phone || '',
              itemsSummary: record.itemsSummary || '',
              subtotal: Number(record.subtotal) || 0,
              gstAmount: Number(record.gstAmount) || 0,
              totalAmount: Number(record.totalAmount) || 0,
              paymentMode: record.paymentMode || 'UPI / QR Pay',
              paymentStatus: record.paymentStatus || 'Paid',
              invoiceDate: record.invoiceDate || '',
            },
          });
          results.push(res);
          break;
        }

        case 'asset': {
          const updateAsset: any = {};
          if (record.condition !== undefined) updateAsset.condition = record.condition;
          if (record.lastServiceDate !== undefined) updateAsset.lastServiceDate = record.lastServiceDate;

          const res = recordId
            ? await prisma.gentleHairWigsAsset.upsert({
                where: { id: recordId },
                update: updateAsset,
                create: {
                  id: recordId,
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  name: record.name || '',
                  category: record.category || '',
                  quantity: Number(record.quantity) || 1,
                  condition: record.condition || 'Good',
                  purchaseCost: Number(record.purchaseCost) || 0,
                  location: record.location || '',
                  lastServiceDate: record.lastServiceDate || null,
                },
              })
            : await prisma.gentleHairWigsAsset.create({
                data: {
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  name: record.name || '',
                  category: record.category || '',
                  quantity: Number(record.quantity) || 1,
                  condition: record.condition || 'Good',
                  purchaseCost: Number(record.purchaseCost) || 0,
                  location: record.location || '',
                  lastServiceDate: record.lastServiceDate || null,
                },
              });
          results.push(res);
          break;
        }

        case 'dailyTask': {
          const updateTask: any = {};
          if (record.completed !== undefined) updateTask.completed = Boolean(record.completed);
          if (record.completedAt !== undefined) updateTask.completedAt = record.completedAt;

          const res = recordId
            ? await prisma.gentleHairWigsDailyTask.upsert({
                where: { id: recordId },
                update: updateTask,
                create: {
                  id: recordId,
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  taskTitle: record.taskTitle || '',
                  category: record.category || '',
                  assignedTo: record.assignedTo || '',
                  timeSlot: record.timeSlot || '',
                  completed: Boolean(record.completed),
                  completedAt: record.completedAt || null,
                },
              })
            : await prisma.gentleHairWigsDailyTask.create({
                data: {
                  businessId: BUSINESS_ID,
                  studioSlug: record.studioSlug || studioSlug,
                  taskTitle: record.taskTitle || '',
                  category: record.category || '',
                  assignedTo: record.assignedTo || '',
                  timeSlot: record.timeSlot || '',
                  completed: Boolean(record.completed),
                  completedAt: record.completedAt || null,
                },
              });
          results.push(res);
          break;
        }

        case 'callLog': {
          const res = await prisma.gentleHairWigsCallLog.create({
            data: {
              id: recordId,
              businessId: BUSINESS_ID,
              studioSlug: record.studioSlug || studioSlug,
              clientName: record.clientName?.trim() || "Don't know",
              phone: record.phone || '',
              callType: record.callType || '',
              status: record.status || '',
              notes: record.notes || '',
              date: record.date || '',
            },
          });
          results.push(res);
          break;
        }

        case 'financeTransaction': {
          const res = await prisma.gentleHairWigsFinanceTransaction.create({
            data: {
              id: recordId,
              businessId: BUSINESS_ID,
              studioSlug: record.studioSlug || studioSlug,
              type: record.type || 'expense',
              category: record.category || '',
              description: record.description || '',
              amount: Number(record.amount) || 0,
              date: record.date || '',
              month: record.month || '',
              paymentMode: record.paymentMode || 'UPI / QR Pay',
              recordedBy: record.recordedBy || '',
            },
          });
          results.push(res);
          break;
        }

        default:
          break;
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error('Error syncing entity to postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const id = searchParams.get('id');

    if (!entity || !id) {
      return NextResponse.json(
        { success: false, error: 'Entity and id are required' },
        { status: 400 }
      );
    }

    switch (entity) {
      case 'financeTransaction':
        await prisma.gentleHairWigsFinanceTransaction.deleteMany({
          where: { id, businessId: BUSINESS_ID },
        });
        break;
      case 'order':
        await prisma.gentleHairWigsOrder.deleteMany({
          where: { id, businessId: BUSINESS_ID },
        });
        break;
      case 'appointment':
        await prisma.gentleHairWigsAppointment.deleteMany({
          where: { id, businessId: BUSINESS_ID },
        });
        break;
      case 'inventory':
        await prisma.gentleHairWigsInventoryItem.deleteMany({
          where: { id, businessId: BUSINESS_ID },
        });
        break;
      case 'asset':
        await prisma.gentleHairWigsAsset.deleteMany({
          where: { id, businessId: BUSINESS_ID },
        });
        break;
      case 'dailyTask':
        await prisma.gentleHairWigsDailyTask.deleteMany({
          where: { id, businessId: BUSINESS_ID },
        });
        break;
      case 'callLog':
        await prisma.gentleHairWigsCallLog.deleteMany({
          where: { id, businessId: BUSINESS_ID },
        });
        break;
      default:
        break;
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting sync entity in postgres:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
