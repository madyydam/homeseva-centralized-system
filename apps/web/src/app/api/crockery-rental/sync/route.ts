import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@homeseva/db';
import { getCurrentSuperAdminSession, getCurrentStaffSession } from '@/lib/authSession';
import {
  Item,
  Customer,
  Booking,
  BookingItem,
  StockMovement,
  Invoice,
  InvoiceLine,
  Payment,
  PackageCombo,
  BusinessProfile,
} from '@/businesses/horeca-essentials/crockery-rental/types';
import { initialBusinessProfile } from '@/businesses/horeca-essentials/crockery-rental/mockData';

export const dynamic = 'force-dynamic';

const BUSINESS_ID = 'crockery-rental';
const BUSINESS_ID_WHERE = { in: ['crockery-rental', 'horeca-essentials'] };

async function isAuthorized(): Promise<boolean> {
  const saSession = await getCurrentSuperAdminSession();
  if (saSession?.isSuperAdmin) return true;

  const staffSession = await getCurrentStaffSession();
  if (staffSession && staffSession.businessSlug === 'crockery-rental') {
    return true;
  }
  return false;
}

// Helper to format DB item to frontend Item
function formatItem(row: any): Item {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    pack_size: row.packSize ?? 1,
    rent_per_day: Number(row.rentPerDay) || 0,
    rent_basis: row.rentBasis ?? 'per_day',
    replacement_cost: Number(row.replacementCost) || 0,
    total_quantity: row.totalQuantity ?? 0,
    in_godown: row.inGodown ?? 0,
    out_on_rent: row.outOnRent ?? 0,
    in_cleaning: row.inCleaning ?? 0,
    written_off: row.writtenOff ?? 0,
    active: row.active ?? true,
    image: row.image || undefined,
    low_stock_threshold: row.lowStockThreshold ?? undefined,
  };
}

// Helper to format DB customer to frontend Customer
function formatCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    alt_phone: row.altPhone || undefined,
    address: row.address,
    gstin: row.gstin || undefined,
    tag: row.tag ?? 'regular',
    notes: row.notes || undefined,
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  };
}

// Helper to format DB booking to frontend Booking
function formatBooking(row: any): Booking {
  const items: BookingItem[] = (row.items || []).map((bi: any) => ({
    id: bi.id,
    item_id: bi.itemId,
    item_name: bi.itemName,
    category: bi.category,
    pack_size: bi.packSize ?? 1,
    quantity: bi.quantity ?? 1,
    dispatched_quantity: bi.dispatchedQuantity ?? 0,
    returned_good: bi.returnedGood ?? 0,
    returned_broken: bi.returnedBroken ?? 0,
    returned_missing: bi.returnedMissing ?? 0,
    rate_snapshot: Number(bi.rateSnapshot) || 0,
    rent_basis: bi.rentBasis ?? 'per_day',
    replacement_cost_snapshot: Number(bi.replacementCostSnapshot) || 0,
    damage_grade: bi.damageGrade || undefined,
  }));

  return {
    id: row.id,
    booking_number: row.bookingNumber,
    customer_id: row.customerId || '',
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    customer_address: row.customerAddress,
    event_type: row.eventType ?? 'Wedding',
    event_date: row.eventDate,
    delivery_date: row.deliveryDate,
    expected_return_date: row.expectedReturnDate,
    actual_return_date: row.actualReturnDate || undefined,
    venue_name: row.venueName,
    venue_address: row.venueAddress,
    contact_person: row.contactPerson || undefined,
    status: row.status,
    items,
    transport_charge: Number(row.transportCharge) || 0,
    discount: Number(row.discount) || 0,
    advance_paid: Number(row.advancePaid) || 0,
    security_deposit: Number(row.securityDeposit) || 0,
    damage_charge: Number(row.damageCharge) || 0,
    late_fee: Number(row.lateFee) || 0,
    notes: row.notes || undefined,
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    dispatched_at: row.dispatchedAt ? new Date(row.dispatchedAt).toISOString() : undefined,
    returned_at: row.returnedAt ? new Date(row.returnedAt).toISOString() : undefined,
    dispatched_by: row.dispatchedBy || undefined,
    vehicle_details: row.vehicleDetails || undefined,
    signature_dispatch: row.signatureDispatch || undefined,
    signature_return: row.signatureReturn || undefined,
  };
}

// Helper to format DB stock movement to frontend StockMovement
function formatStockMovement(row: any): StockMovement {
  return {
    id: row.id,
    item_id: row.itemId,
    item_name: row.itemName,
    type: row.type,
    quantity: row.quantity,
    bucket_from: row.bucketFrom || undefined,
    bucket_to: row.bucketTo || undefined,
    booking_id: row.bookingId || undefined,
    booking_number: row.bookingNumber || undefined,
    user: row.user || 'Staff',
    reason: row.reason || '',
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  };
}

// Helper to format DB invoice to frontend Invoice
function formatInvoice(row: any): Invoice {
  const lines: InvoiceLine[] = (row.lines || []).map((l: any) => ({
    id: l.id,
    description: l.description,
    quantity: l.quantity ?? 1,
    rate: Number(l.rate) || 0,
    amount: Number(l.amount) || 0,
    type: l.type ?? 'rent',
  }));

  return {
    id: row.id,
    invoice_number: row.invoiceNumber,
    financial_year: row.financialYear ?? '2026-27',
    booking_id: row.bookingId,
    booking_number: row.bookingNumber,
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    customer_address: row.customerAddress,
    delivery_date: row.deliveryDate,
    return_date: row.returnDate,
    rent_days: row.rentDays ?? 1,
    rent_amount: Number(row.rentAmount) || 0,
    transport_charge: Number(row.transportCharge) || 0,
    damage_amount: Number(row.damageAmount) || 0,
    late_fee: Number(row.lateFee) || 0,
    discount: Number(row.discount) || 0,
    tax_amount: Number(row.taxAmount) || 0,
    tax_rate: Number(row.taxRate) || 0,
    total_amount: Number(row.totalAmount) || 0,
    advance_paid: Number(row.advancePaid) || 0,
    balance_due: Number(row.balanceDue) || 0,
    status: row.status ?? 'draft',
    issued_at: row.issuedAt ? new Date(row.issuedAt).toISOString() : new Date().toISOString(),
    issued_by: row.issuedBy ?? 'Billing Staff',
    lines,
  };
}

// Helper to format DB payment to frontend Payment
function formatPayment(row: any): Payment {
  return {
    id: row.id,
    booking_id: row.bookingId,
    booking_number: row.bookingNumber,
    customer_id: row.customerId || '',
    customer_name: row.customerName,
    amount: Number(row.amount) || 0,
    method: row.method ?? 'UPI',
    reference: row.reference || undefined,
    notes: row.notes || undefined,
    date: row.date,
    received_by: row.receivedBy ?? 'Staff',
    direction: row.direction ?? 'received',
  };
}

// Helper to format DB package combo
function formatPackage(row: any): PackageCombo {
  let items: any[] = [];
  if (Array.isArray(row.itemsJson)) {
    items = row.itemsJson;
  } else if (typeof row.itemsJson === 'string') {
    try {
      items = JSON.parse(row.itemsJson);
    } catch {}
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    suggested_guests: row.suggestedGuests ?? 100,
    items,
  };
}

// Helper to format DB profile
function formatProfile(row: any): BusinessProfile {
  if (!row) return initialBusinessProfile;
  return {
    name: row.name || initialBusinessProfile.name,
    tagline: row.tagline || initialBusinessProfile.tagline,
    phone: row.phone || initialBusinessProfile.phone,
    alt_phone: row.altPhone || '',
    email: row.email || initialBusinessProfile.email,
    address: row.address || initialBusinessProfile.address,
    gstin: row.gstin || '',
    upi_id: row.upiId || '',
    bank_name: row.bankName || '',
    account_number: row.accountNumber || '',
    ifsc: row.ifsc || '',
    terms_conditions: row.termsConditions || initialBusinessProfile.terms_conditions,
    default_prep_days: row.defaultPrepDays ?? 0,
    return_buffer_days: row.returnBufferDays ?? 1,
    cleaning_stage_enabled: row.cleaningStageEnabled ?? true,
    late_fee_multiplier: Number(row.lateFeeMultiplier) || 1.0,
    min_advance_percent: Number(row.minAdvancePercent) || 25,
  };
}

// GET: Authoritative fetch from PostgreSQL
export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Active Crockery Rental session required' },
      { status: 401 }
    );
  }

  try {
    const [
      dbItems,
      dbCustomers,
      dbBookings,
      dbLedger,
      dbInvoices,
      dbPayments,
      dbPackages,
      dbProfile,
    ] = await Promise.all([
      prisma.crockeryItem.findMany({
        where: { businessId: BUSINESS_ID_WHERE },
        orderBy: { name: 'asc' },
      }),
      prisma.crockeryCustomer.findMany({
        where: { businessId: BUSINESS_ID_WHERE },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.crockeryBooking.findMany({
        where: { businessId: BUSINESS_ID_WHERE },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.crockeryStockMovement.findMany({
        where: { businessId: BUSINESS_ID_WHERE },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prisma.crockeryInvoice.findMany({
        where: { businessId: BUSINESS_ID_WHERE },
        include: { lines: true },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.crockeryPayment.findMany({
        where: { businessId: BUSINESS_ID_WHERE },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.crockeryPackageCombo.findMany({
        where: { businessId: BUSINESS_ID_WHERE },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.crockeryBusinessProfile.findFirst({
        where: { businessId: BUSINESS_ID_WHERE },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: dbItems.map(formatItem),
        customers: dbCustomers.map(formatCustomer),
        bookings: dbBookings.map(formatBooking),
        ledger: dbLedger.map(formatStockMovement),
        invoices: dbInvoices.map(formatInvoice),
        payments: dbPayments.map(formatPayment),
        packages: dbPackages.map(formatPackage),
        profile: formatProfile(dbProfile),
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/crockery-rental/sync:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch from PostgreSQL' },
      { status: 500 }
    );
  }
}

// POST: Direct mutations into PostgreSQL
export async function POST(req: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Active Crockery Rental session required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      // 1. Upsert / Add Item
      case 'upsert_item': {
        const item: Item = payload;
        const saved = await prisma.crockeryItem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            businessId: BUSINESS_ID,
            name: item.name,
            category: item.category,
            packSize: item.pack_size || 1,
            rentPerDay: item.rent_per_day || 0,
            rentBasis: item.rent_basis || 'per_day',
            replacementCost: item.replacement_cost || 0,
            totalQuantity: item.total_quantity || 0,
            inGodown: item.in_godown ?? item.total_quantity ?? 0,
            outOnRent: item.out_on_rent || 0,
            inCleaning: item.in_cleaning || 0,
            writtenOff: item.written_off || 0,
            active: item.active !== false,
            image: item.image || null,
            lowStockThreshold: item.low_stock_threshold || 50,
          },
          update: {
            name: item.name,
            category: item.category,
            packSize: item.pack_size,
            rentPerDay: item.rent_per_day,
            rentBasis: item.rent_basis,
            replacementCost: item.replacement_cost,
            totalQuantity: item.total_quantity,
            inGodown: item.in_godown,
            outOnRent: item.out_on_rent,
            inCleaning: item.in_cleaning,
            writtenOff: item.written_off,
            active: item.active,
            image: item.image || null,
            lowStockThreshold: item.low_stock_threshold ?? null,
          },
        });
        return NextResponse.json({ success: true, item: formatItem(saved) });
      }

      // 2. Upsert Customer
      case 'upsert_customer': {
        const customer: Customer = payload;
        const saved = await prisma.crockeryCustomer.upsert({
          where: { id: customer.id },
          create: {
            id: customer.id,
            businessId: BUSINESS_ID,
            name: customer.name,
            phone: customer.phone,
            altPhone: customer.alt_phone || null,
            address: customer.address,
            gstin: customer.gstin || null,
            tag: customer.tag || 'regular',
            notes: customer.notes || null,
          },
          update: {
            name: customer.name,
            phone: customer.phone,
            altPhone: customer.alt_phone || null,
            address: customer.address,
            gstin: customer.gstin || null,
            tag: customer.tag,
            notes: customer.notes || null,
          },
        });
        return NextResponse.json({ success: true, customer: formatCustomer(saved) });
      }

      // 3. Upsert Booking (including line items)
      case 'upsert_booking': {
        const booking: Booking = payload;

        // Upsert booking record
        const savedBooking = await prisma.crockeryBooking.upsert({
          where: { id: booking.id },
          create: {
            id: booking.id,
            businessId: BUSINESS_ID,
            bookingNumber: booking.booking_number,
            customerId: booking.customer_id || null,
            customerName: booking.customer_name,
            customerPhone: booking.customer_phone,
            customerAddress: booking.customer_address,
            eventType: booking.event_type,
            eventDate: booking.event_date,
            deliveryDate: booking.delivery_date,
            expectedReturnDate: booking.expected_return_date,
            actualReturnDate: booking.actual_return_date || null,
            venueName: booking.venue_name,
            venueAddress: booking.venue_address,
            contactPerson: booking.contact_person || null,
            status: booking.status,
            transportCharge: booking.transport_charge || 0,
            discount: booking.discount || 0,
            advancePaid: booking.advance_paid || 0,
            securityDeposit: booking.security_deposit || 0,
            damageCharge: booking.damage_charge || 0,
            lateFee: booking.late_fee || 0,
            notes: booking.notes || null,
            dispatchedAt: booking.dispatched_at ? new Date(booking.dispatched_at) : null,
            returnedAt: booking.returned_at ? new Date(booking.returned_at) : null,
            dispatchedBy: booking.dispatched_by || null,
            vehicleDetails: booking.vehicle_details || null,
            signatureDispatch: booking.signature_dispatch || null,
            signatureReturn: booking.signature_return || null,
          },
          update: {
            customerName: booking.customer_name,
            customerPhone: booking.customer_phone,
            customerAddress: booking.customer_address,
            eventType: booking.event_type,
            eventDate: booking.event_date,
            deliveryDate: booking.delivery_date,
            expectedReturnDate: booking.expected_return_date,
            actualReturnDate: booking.actual_return_date || null,
            venueName: booking.venue_name,
            venueAddress: booking.venue_address,
            contactPerson: booking.contact_person || null,
            status: booking.status,
            transportCharge: booking.transport_charge,
            discount: booking.discount,
            advancePaid: booking.advance_paid,
            securityDeposit: booking.security_deposit,
            damageCharge: booking.damage_charge,
            lateFee: booking.late_fee,
            notes: booking.notes || null,
            dispatchedAt: booking.dispatched_at ? new Date(booking.dispatched_at) : null,
            returnedAt: booking.returned_at ? new Date(booking.returned_at) : null,
            dispatchedBy: booking.dispatched_by || null,
            vehicleDetails: booking.vehicle_details || null,
            signatureDispatch: booking.signature_dispatch || null,
            signatureReturn: booking.signature_return || null,
          },
        });

        // Sync booking items: delete existing lines and re-insert
        await prisma.crockeryBookingItem.deleteMany({
          where: { bookingId: booking.id },
        });

        if (Array.isArray(booking.items) && booking.items.length > 0) {
          await prisma.crockeryBookingItem.createMany({
            data: booking.items.map((bi) => ({
              id: bi.id || `${booking.id}-${bi.item_id}`,
              businessId: BUSINESS_ID,
              bookingId: booking.id,
              itemId: bi.item_id,
              itemName: bi.item_name,
              category: bi.category,
              packSize: bi.pack_size || 1,
              quantity: bi.quantity || 1,
              dispatchedQuantity: bi.dispatched_quantity || 0,
              returnedGood: bi.returned_good || 0,
              returnedBroken: bi.returned_broken || 0,
              returnedMissing: bi.returned_missing || 0,
              rateSnapshot: bi.rate_snapshot || 0,
              rentBasis: bi.rent_basis || 'per_day',
              replacementCostSnapshot: bi.replacement_cost_snapshot || 0,
              damageGrade: bi.damage_grade || null,
            })),
          });
        }

        return NextResponse.json({ success: true, bookingId: savedBooking.id });
      }

      // 4. Upsert Invoice (including invoice lines)
      case 'upsert_invoice': {
        const inv: Invoice = payload;
        const savedInvoice = await prisma.crockeryInvoice.upsert({
          where: { id: inv.id },
          create: {
            id: inv.id,
            businessId: BUSINESS_ID,
            invoiceNumber: inv.invoice_number,
            financialYear: inv.financial_year || '2026-27',
            bookingId: inv.booking_id,
            bookingNumber: inv.booking_number,
            customerName: inv.customer_name,
            customerPhone: inv.customer_phone,
            customerAddress: inv.customer_address,
            deliveryDate: inv.delivery_date,
            returnDate: inv.return_date,
            rentDays: inv.rent_days || 1,
            rentAmount: inv.rent_amount || 0,
            transportCharge: inv.transport_charge || 0,
            damageAmount: inv.damage_amount || 0,
            lateFee: inv.late_fee || 0,
            discount: inv.discount || 0,
            taxAmount: inv.tax_amount || 0,
            taxRate: inv.tax_rate || 0,
            totalAmount: inv.total_amount || 0,
            advancePaid: inv.advance_paid || 0,
            balanceDue: inv.balance_due || 0,
            status: inv.status || 'draft',
            issuedAt: inv.issued_at ? new Date(inv.issued_at) : new Date(),
            issuedBy: inv.issued_by || 'Billing Staff',
          },
          update: {
            customerName: inv.customer_name,
            customerPhone: inv.customer_phone,
            customerAddress: inv.customer_address,
            deliveryDate: inv.delivery_date,
            returnDate: inv.return_date,
            rentDays: inv.rent_days,
            rentAmount: inv.rent_amount,
            transportCharge: inv.transport_charge,
            damageAmount: inv.damage_amount,
            lateFee: inv.late_fee,
            discount: inv.discount,
            taxAmount: inv.tax_amount,
            taxRate: inv.tax_rate,
            totalAmount: inv.total_amount,
            advancePaid: inv.advance_paid,
            balanceDue: inv.balance_due,
            status: inv.status,
            issuedBy: inv.issued_by,
          },
        });

        // Sync lines
        await prisma.crockeryInvoiceLine.deleteMany({
          where: { invoiceId: inv.id },
        });

        if (Array.isArray(inv.lines) && inv.lines.length > 0) {
          await prisma.crockeryInvoiceLine.createMany({
            data: inv.lines.map((l) => ({
              id: l.id || `${inv.id}-${Math.random().toString(36).slice(2, 8)}`,
              businessId: BUSINESS_ID,
              invoiceId: inv.id,
              description: l.description,
              quantity: l.quantity || 1,
              rate: l.rate || 0,
              amount: l.amount || 0,
              type: l.type || 'rent',
            })),
          });
        }

        return NextResponse.json({ success: true, invoiceId: savedInvoice.id });
      }

      // 5. Record Payment
      case 'record_payment': {
        const p: Payment = payload;
        const saved = await prisma.crockeryPayment.create({
          data: {
            id: p.id || `pay-${Date.now()}`,
            businessId: BUSINESS_ID,
            bookingId: p.booking_id,
            bookingNumber: p.booking_number,
            customerId: p.customer_id || null,
            customerName: p.customer_name,
            amount: p.amount || 0,
            method: p.method || 'UPI',
            reference: p.reference || null,
            notes: p.notes || null,
            date: p.date,
            receivedBy: p.received_by || 'Staff',
            direction: p.direction || 'received',
          },
        });
        return NextResponse.json({ success: true, payment: formatPayment(saved) });
      }

      // 6. Record Stock Movement (Ledger)
      case 'add_stock_movement': {
        const m: StockMovement = payload;
        const saved = await prisma.crockeryStockMovement.create({
          data: {
            id: m.id || `mov-${Date.now()}`,
            businessId: BUSINESS_ID,
            itemId: m.item_id,
            itemName: m.item_name,
            type: m.type,
            quantity: m.quantity,
            bucketFrom: m.bucket_from || null,
            bucketTo: m.bucket_to || null,
            bookingId: m.booking_id || null,
            bookingNumber: m.booking_number || null,
            user: m.user || 'Staff',
            reason: m.reason || '',
          },
        });
        return NextResponse.json({ success: true, movement: formatStockMovement(saved) });
      }

      // 7. Update Business Profile
      case 'update_profile': {
        const prof: BusinessProfile = payload;
        const saved = await prisma.crockeryBusinessProfile.upsert({
          where: { businessId: BUSINESS_ID },
          create: {
            businessId: BUSINESS_ID,
            name: prof.name,
            tagline: prof.tagline,
            phone: prof.phone,
            altPhone: prof.alt_phone || '',
            email: prof.email,
            address: prof.address,
            gstin: prof.gstin || '',
            upiId: prof.upi_id || '',
            bankName: prof.bank_name || '',
            accountNumber: prof.account_number || '',
            ifsc: prof.ifsc || '',
            termsConditions: prof.terms_conditions,
            defaultPrepDays: prof.default_prep_days || 0,
            returnBufferDays: prof.return_buffer_days || 1,
            cleaningStageEnabled: prof.cleaning_stage_enabled !== false,
            lateFeeMultiplier: prof.late_fee_multiplier || 1.0,
            minAdvancePercent: prof.min_advance_percent || 25,
          },
          update: {
            name: prof.name,
            tagline: prof.tagline,
            phone: prof.phone,
            altPhone: prof.alt_phone || '',
            email: prof.email,
            address: prof.address,
            gstin: prof.gstin || '',
            upiId: prof.upi_id || '',
            bankName: prof.bank_name || '',
            accountNumber: prof.account_number || '',
            ifsc: prof.ifsc || '',
            termsConditions: prof.terms_conditions,
            defaultPrepDays: prof.default_prep_days,
            returnBufferDays: prof.return_buffer_days,
            cleaningStageEnabled: prof.cleaning_stage_enabled,
            lateFeeMultiplier: prof.late_fee_multiplier,
            minAdvancePercent: prof.min_advance_percent,
          },
        });
        return NextResponse.json({ success: true, profile: formatProfile(saved) });
      }

      // 8. Bulk Sync / State Save
      case 'bulk_sync': {
        const { items, customers, bookings, invoices, payments, profile } = payload;

        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            await prisma.crockeryItem.upsert({
              where: { id: item.id },
              create: {
                id: item.id,
                businessId: BUSINESS_ID,
                name: item.name,
                category: item.category,
                packSize: item.pack_size || 1,
                rentPerDay: item.rent_per_day || 0,
                rentBasis: item.rent_basis || 'per_day',
                replacementCost: item.replacement_cost || 0,
                totalQuantity: item.total_quantity || 0,
                inGodown: item.in_godown ?? item.total_quantity ?? 0,
                outOnRent: item.out_on_rent || 0,
                inCleaning: item.in_cleaning || 0,
                writtenOff: item.written_off || 0,
                active: item.active !== false,
                image: item.image || null,
                lowStockThreshold: item.low_stock_threshold || 50,
              },
              update: {
                name: item.name,
                category: item.category,
                packSize: item.pack_size,
                rentPerDay: item.rent_per_day,
                rentBasis: item.rent_basis,
                replacementCost: item.replacement_cost,
                totalQuantity: item.total_quantity,
                inGodown: item.in_godown,
                outOnRent: item.out_on_rent,
                inCleaning: item.in_cleaning,
                writtenOff: item.written_off,
                active: item.active,
                image: item.image || null,
                lowStockThreshold: item.low_stock_threshold ?? null,
              },
            });
          }
        }

        if (Array.isArray(customers) && customers.length > 0) {
          for (const customer of customers) {
            await prisma.crockeryCustomer.upsert({
              where: { id: customer.id },
              create: {
                id: customer.id,
                businessId: BUSINESS_ID,
                name: customer.name,
                phone: customer.phone,
                altPhone: customer.alt_phone || null,
                address: customer.address,
                gstin: customer.gstin || null,
                tag: customer.tag || 'regular',
                notes: customer.notes || null,
              },
              update: {
                name: customer.name,
                phone: customer.phone,
                altPhone: customer.alt_phone || null,
                address: customer.address,
                gstin: customer.gstin || null,
                tag: customer.tag,
                notes: customer.notes || null,
              },
            });
          }
        }

        return NextResponse.json({ success: true, message: 'Bulk sync completed' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Error in POST /api/crockery-rental/sync:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Database write error' },
      { status: 500 }
    );
  }
}
