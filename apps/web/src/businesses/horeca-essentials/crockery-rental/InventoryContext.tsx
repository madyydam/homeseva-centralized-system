import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
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
  UserRole,
  StockMovementType,
} from './types';
import {
  initialBusinessProfile,
  initialItems,
  initialCustomers,
  initialBookings,
  initialLedger,
  initialInvoices,
  initialPayments,
  initialPackages,
} from './mockData';

interface InventoryContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  profile: BusinessProfile;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  items: Item[];
  customers: Customer[];
  bookings: Booking[];
  ledger: StockMovement[];
  invoices: Invoice[];
  payments: Payment[];
  packages: PackageCombo[];
  getAvailableStock: (itemId: string, startDate: string, endDate: string, excludeBookingId?: string) => number;
  createBooking: (booking: Omit<Booking, 'id' | 'booking_number' | 'created_at' | 'status'> & { status?: Booking['status'] }) => Booking;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  dispatchBooking: (
    bookingId: string,
    dispatches: { itemId: string; quantity: number }[],
    vehicleDetails: string,
    signature: string,
    driverName: string
  ) => void;
  returnBooking: (
    bookingId: string,
    returns: {
      itemId: string;
      returnedGood: number;
      returnedBroken: number;
      damageGrade?: 'broken' | 'chipped' | 'none';
    }[],
    signature: string,
    photosNote?: string
  ) => Invoice;
  generateInvoice: (
    bookingId: string,
    taxRate?: number,
    damageWaiverAmount?: number,
    discountAmount?: number
  ) => Invoice;
  recordPayment: (payment: Omit<Payment, 'id'>) => void;
  addItem: (item: Omit<Item, 'id' | 'in_godown' | 'out_on_rent' | 'in_cleaning' | 'written_off'>) => void;
  updateItem: (item: Item) => void;
  addStockAdjustment: (itemId: string, type: StockMovementType, quantity: number, reason: string) => void;
  markWashed: (itemId: string, quantity: number) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at'>) => Customer;
  resetAllData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// v2 storage keys ensure any legacy mock data in browser localStorage is discarded
const STORAGE_KEYS = {
  ROLE: 'crockery_role_v2',
  PROFILE: 'crockery_profile_v2',
  ITEMS: 'crockery_items_v2',
  CUSTOMERS: 'crockery_customers_v2',
  BOOKINGS: 'crockery_bookings_v2',
  LEDGER: 'crockery_ledger_v2',
  INVOICES: 'crockery_invoices_v2',
  PAYMENTS: 'crockery_payments_v2',
  PACKAGES: 'crockery_packages_v2',
};

// Asynchronous helper to sync changes with PostgreSQL backend
const syncToPostgres = (action: string, payload: any) => {
  if (typeof window === 'undefined') return;
  fetch('/api/crockery-rental/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  }).catch((err) => {
    console.error(`[PostgreSQL Sync Error] Action ${action}:`, err);
  });
};

export const InventoryProvider: React.FC<{ children: ReactNode; initialRole?: UserRole }> = ({ children, initialRole }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    // Authoritative session role strictly takes priority
    if (initialRole) return initialRole;
    return 'owner';
  });

  useEffect(() => {
    if (initialRole) {
      setRoleState(initialRole);
    }
  }, [initialRole]);

  const [profile, setProfileState] = useState<BusinessProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return initialBusinessProfile;
  });

  const [items, setItemsState] = useState<Item[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return initialItems;
  });

  const [customers, setCustomersState] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return initialCustomers;
  });

  const [bookings, setBookingsState] = useState<Booking[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return initialBookings;
  });

  const [ledger, setLedgerState] = useState<StockMovement[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return initialLedger;
  });

  const [invoices, setInvoicesState] = useState<Invoice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return initialInvoices;
  });

  const [payments, setPaymentsState] = useState<Payment[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return initialPayments;
  });

  const [packages, setPackagesState] = useState<PackageCombo[]>(initialPackages);

  // Authoritative PostgreSQL initial synchronization
  useEffect(() => {
    // 1. Wipe legacy mock localStorage entries from v1
    if (typeof window !== 'undefined') {
      try {
        const legacyKeys = [
          'crockery_role_v1',
          'crockery_profile_v1',
          'crockery_items_v1',
          'crockery_customers_v1',
          'crockery_bookings_v1',
          'crockery_ledger_v1',
          'crockery_invoices_v1',
          'crockery_payments_v1',
          'crockery_packages_v1',
        ];
        legacyKeys.forEach((k) => localStorage.removeItem(k));
      } catch (_) {}
    }

    // 2. Fetch live data from PostgreSQL
    fetch('/api/crockery-rental/sync')
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.success && res.data) {
          const d = res.data;
          if (Array.isArray(d.items)) {
            setItemsState(d.items);
            try {
              localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(d.items));
            } catch (_) {}
          }
          if (Array.isArray(d.customers)) {
            setCustomersState(d.customers);
            try {
              localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(d.customers));
            } catch (_) {}
          }
          if (Array.isArray(d.bookings)) {
            setBookingsState(d.bookings);
            try {
              localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(d.bookings));
            } catch (_) {}
          }
          if (Array.isArray(d.ledger)) {
            setLedgerState(d.ledger);
            try {
              localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(d.ledger));
            } catch (_) {}
          }
          if (Array.isArray(d.invoices)) {
            setInvoicesState(d.invoices);
            try {
              localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(d.invoices));
            } catch (_) {}
          }
          if (Array.isArray(d.payments)) {
            setPaymentsState(d.payments);
            try {
              localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(d.payments));
            } catch (_) {}
          }
          if (Array.isArray(d.packages) && d.packages.length > 0) {
            setPackagesState(d.packages);
          }
          if (d.profile) {
            setProfileState(d.profile);
            try {
              localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(d.profile));
            } catch (_) {}
          }
        }
      })
      .catch((err) => {
        console.warn('Could not connect to PostgreSQL backend API, running with local state:', err);
      });
  }, []);

  // Role is authoritative and locked to authenticated user session
  const setRole = (_newRole: UserRole) => {
    console.warn('Role changes are locked to authenticated user session.');
  };

  const updateProfile = (updates: Partial<BusinessProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
      } catch (_) {}
      syncToPostgres('update_profile', next);
      return next;
    });
  };

  const saveItems = (newItems: Item[]) => {
    setItemsState(newItems);
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(newItems));
    } catch (_) {}
  };

  const saveCustomers = (newCustomers: Customer[]) => {
    setCustomersState(newCustomers);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
    } catch (_) {}
  };

  const saveBookings = (newBookings: Booking[]) => {
    setBookingsState(newBookings);
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(newBookings));
    } catch (_) {}
  };

  const saveLedger = (newLedger: StockMovement[]) => {
    setLedgerState(newLedger);
    try {
      localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(newLedger));
    } catch (_) {}
  };

  const saveInvoices = (newInvoices: Invoice[]) => {
    setInvoicesState(newInvoices);
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(newInvoices));
    } catch (_) {}
  };

  const savePayments = (newPayments: Payment[]) => {
    setPaymentsState(newPayments);
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(newPayments));
    } catch (_) {}
  };

  // Availability calculation
  const getAvailableStock = useCallback(
    (
      itemId: string,
      startDate: string,
      endDate: string,
      excludeBookingId?: string
    ): number => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return 0;

      const reqStart = new Date(startDate || '').getTime();
      const reqEnd = new Date(endDate || '').getTime();
      if (isNaN(reqStart) || isNaN(reqEnd)) return item.total_quantity;

      let reservedCount = 0;
      const bufferMs = (profile.return_buffer_days || 1) * 86400000;

      bookings.forEach((b) => {
        if (excludeBookingId && b.id === excludeBookingId) return;
        if (['Confirmed', 'Dispatched', 'Overdue'].includes(b.status)) {
          const bStart = new Date(b.delivery_date).getTime();
          const bEnd = new Date(b.expected_return_date).getTime() + bufferMs;

          if (bStart <= reqEnd && bEnd >= reqStart) {
            const bookedItem = b.items.find((bi) => bi.item_id === itemId);
            if (bookedItem) {
              reservedCount += bookedItem.quantity;
            }
          }
        }
      });

      const owned = item.total_quantity;
      return Math.max(0, owned - reservedCount);
    },
    [items, bookings, profile.return_buffer_days]
  );

  // Create booking
  const createBooking = (
    data: Omit<Booking, 'id' | 'booking_number' | 'created_at' | 'status'> & { status?: Booking['status'] }
  ): Booking => {
    const num = String(bookings.length + 101).padStart(4, '0');
    const bookingNumber = `BKG-26-${num}`;
    const newBooking: Booking = {
      ...data,
      id: `bkg-${Date.now()}`,
      booking_number: bookingNumber,
      status: data.status || 'Confirmed',
      created_at: new Date().toISOString(),
    };

    const nextBookings = [newBooking, ...bookings];
    saveBookings(nextBookings);
    syncToPostgres('upsert_booking', newBooking);

    // If advance paid > 0, record payment
    if (newBooking.advance_paid > 0) {
      recordPayment({
        booking_id: newBooking.id,
        booking_number: newBooking.booking_number,
        customer_id: newBooking.customer_id,
        customer_name: newBooking.customer_name,
        amount: newBooking.advance_paid,
        method: 'UPI',
        reference: `ADV-${newBooking.booking_number}`,
        notes: 'Initial booking advance deposit',
        date: new Date().toISOString(),
        received_by: role === 'owner' ? 'Owner' : 'Counter Staff',
        direction: 'received',
      });
    }

    return newBooking;
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    const nextBookings = bookings.map((b) => (b.id === id ? { ...b, ...updates } : b));
    saveBookings(nextBookings);
    const updated = nextBookings.find((b) => b.id === id);
    if (updated) {
      syncToPostgres('upsert_booking', updated);
    }
  };

  // Dispatch booking: moves stock In godown -> Out on rent
  const dispatchBooking = (
    bookingId: string,
    dispatches: { itemId: string; quantity: number }[],
    vehicleDetails: string,
    signature: string,
    driverName: string
  ) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    const nowIso = new Date().toISOString();
    const newLedgerEntries: StockMovement[] = [];

    // Update item stock counts
    const nextItems = items.map((item) => {
      const match = dispatches.find((d) => d.itemId === item.id);
      if (match && match.quantity > 0) {
        const movement: StockMovement = {
          id: `mov-${Date.now()}-${item.id}`,
          item_id: item.id,
          item_name: item.name,
          type: 'DISPATCH',
          quantity: match.quantity,
          bucket_from: 'In godown',
          bucket_to: 'Out on rent',
          booking_id: targetBooking.id,
          booking_number: targetBooking.booking_number,
          user: `${role.toUpperCase()} (${driverName || 'Godown'})`,
          reason: `Dispatched to ${targetBooking.customer_name} via ${vehicleDetails}`,
          created_at: nowIso,
        };
        newLedgerEntries.push(movement);
        syncToPostgres('add_stock_movement', movement);

        const newGodown = Math.max(0, item.in_godown - match.quantity);
        const newRented = item.out_on_rent + match.quantity;
        const updatedItem = {
          ...item,
          in_godown: newGodown,
          out_on_rent: newRented,
        };
        syncToPostgres('upsert_item', updatedItem);
        return updatedItem;
      }
      return item;
    });

    saveItems(nextItems);
    saveLedger([...newLedgerEntries, ...ledger]);

    // Update booking items and status
    const updatedItems = targetBooking.items.map((bi) => {
      const d = dispatches.find((dispatch) => dispatch.itemId === bi.item_id);
      return {
        ...bi,
        dispatched_quantity: d ? d.quantity : bi.quantity,
      };
    });

    const updatedBooking: Booking = {
      ...targetBooking,
      status: 'Dispatched',
      items: updatedItems,
      dispatched_at: nowIso,
      dispatched_by: driverName || 'Godown Incharge',
      vehicle_details: vehicleDetails,
      signature_dispatch: signature,
    };

    updateBooking(bookingId, updatedBooking);
  };

  // Return booking: counts good, broken, missing
  const returnBooking = (
    bookingId: string,
    returns: {
      itemId: string;
      returnedGood: number;
      returnedBroken: number;
      damageGrade?: 'broken' | 'chipped' | 'none';
    }[],
    signature: string,
    photosNote?: string
  ): Invoice => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) throw new Error('Booking not found');

    const nowIso = new Date().toISOString();
    const newLedgerEntries: StockMovement[] = [];
    let calculatedDamageTotal = 0;

    const nextBookingItems = targetBooking.items.map((bi) => {
      const ret = returns.find((r) => r.itemId === bi.item_id);
      const dispatched = bi.dispatched_quantity || bi.quantity;
      const good = ret ? ret.returnedGood : dispatched;
      const broken = ret ? ret.returnedBroken : 0;
      const missing = Math.max(0, dispatched - good - broken);
      const damageGrade = ret?.damageGrade || (broken > 0 ? 'broken' : 'none');

      const unitCost = bi.replacement_cost_snapshot;
      const brokenMultiplier = damageGrade === 'chipped' ? 0.5 : 1.0;
      const itemDamageCost = broken * (unitCost * brokenMultiplier) + missing * unitCost;
      calculatedDamageTotal += itemDamageCost;

      return {
        ...bi,
        returned_good: good,
        returned_broken: broken,
        returned_missing: missing,
        damage_grade: damageGrade,
      };
    });

    // Update stock levels
    const nextItems = items.map((item) => {
      const ret = returns.find((r) => r.itemId === item.id);
      if (!ret) return item;

      const bi = targetBooking.items.find((i) => i.item_id === item.id);
      const dispatched = bi ? bi.dispatched_quantity || bi.quantity : 0;
      const good = ret.returnedGood;
      const broken = ret.returnedBroken;
      const missing = Math.max(0, dispatched - good - broken);

      const targetBucket = profile.cleaning_stage_enabled ? 'In cleaning' : 'In godown';
      if (good > 0) {
        const mGood: StockMovement = {
          id: `mov-${Date.now()}-${item.id}-good`,
          item_id: item.id,
          item_name: item.name,
          type: 'RETURN_GOOD',
          quantity: good,
          bucket_from: 'Out on rent',
          bucket_to: targetBucket,
          booking_id: targetBooking.id,
          booking_number: targetBooking.booking_number,
          user: role.toUpperCase(),
          reason: `Returned good pieces from ${targetBooking.customer_name}`,
          created_at: nowIso,
        };
        newLedgerEntries.push(mGood);
        syncToPostgres('add_stock_movement', mGood);
      }

      if (broken > 0) {
        const mBroken: StockMovement = {
          id: `mov-${Date.now()}-${item.id}-broken`,
          item_id: item.id,
          item_name: item.name,
          type: 'RETURN_BROKEN',
          quantity: broken,
          bucket_from: 'Out on rent',
          bucket_to: 'Written off',
          booking_id: targetBooking.id,
          booking_number: targetBooking.booking_number,
          user: role.toUpperCase(),
          reason: `Damage (${ret.damageGrade || 'broken'}) returned from ${targetBooking.customer_name}`,
          created_at: nowIso,
        };
        newLedgerEntries.push(mBroken);
        syncToPostgres('add_stock_movement', mBroken);
      }

      if (missing > 0) {
        const mMissing: StockMovement = {
          id: `mov-${Date.now()}-${item.id}-missing`,
          item_id: item.id,
          item_name: item.name,
          type: 'RETURN_MISSING',
          quantity: missing,
          bucket_from: 'Out on rent',
          bucket_to: 'Written off',
          booking_id: targetBooking.id,
          booking_number: targetBooking.booking_number,
          user: role.toUpperCase(),
          reason: `Missing pieces on return from ${targetBooking.customer_name}`,
          created_at: nowIso,
        };
        newLedgerEntries.push(mMissing);
        syncToPostgres('add_stock_movement', mMissing);
      }

      const newOutOnRent = Math.max(0, item.out_on_rent - dispatched);
      const newInCleaning = profile.cleaning_stage_enabled ? item.in_cleaning + good : item.in_cleaning;
      const newInGodown = !profile.cleaning_stage_enabled ? item.in_godown + good : item.in_godown;
      const newWrittenOff = item.written_off + broken + missing;
      const newTotal = item.total_quantity - (broken + missing);

      const updatedItem = {
        ...item,
        out_on_rent: newOutOnRent,
        in_cleaning: newInCleaning,
        in_godown: newInGodown,
        written_off: newWrittenOff,
        total_quantity: Math.max(0, newTotal),
      };
      syncToPostgres('upsert_item', updatedItem);
      return updatedItem;
    });

    saveItems(nextItems);
    saveLedger([...newLedgerEntries, ...ledger]);

    let lateFee = 0;
    const expectedReturnMs = new Date(targetBooking.expected_return_date).getTime();
    const actualReturnMs = new Date(nowIso.split('T')[0] ?? '').getTime();
    if (actualReturnMs > expectedReturnMs) {
      const extraDays = Math.ceil((actualReturnMs - expectedReturnMs) / 86400000);
      const dailyRentSum = targetBooking.items.reduce((sum, i) => {
        return sum + (i.rent_basis === 'per_day' ? i.quantity * i.rate_snapshot : 0);
      }, 0);
      lateFee = Math.round(extraDays * dailyRentSum * (profile.late_fee_multiplier || 1.0));
    }

    const updatedBooking: Booking = {
      ...targetBooking,
      status: 'Returned',
      items: nextBookingItems,
      returned_at: nowIso,
      actual_return_date: nowIso.split('T')[0],
      signature_return: signature,
      damage_charge: calculatedDamageTotal,
      late_fee: lateFee,
      notes: photosNote ? `${targetBooking.notes || ''}\nReturn Note: ${photosNote}` : targetBooking.notes,
    };

    updateBooking(bookingId, updatedBooking);

    // Auto-generate invoice
    return generateInvoice(bookingId, 18, 0, targetBooking.discount);
  };

  // Generate sequential FY invoice
  const generateInvoice = (
    bookingId: string,
    taxRate: number = 18,
    damageWaiverAmount: number = 0,
    discountAmount?: number
  ): Invoice => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const delDate = new Date(booking.delivery_date);
    const retDate = new Date(booking.actual_return_date || booking.expected_return_date);
    const diffDays = Math.max(1, Math.round((retDate.getTime() - delDate.getTime()) / 86400000) + 1);

    const invoiceLines: InvoiceLine[] = [];
    let rentTotal = 0;

    booking.items.forEach((item) => {
      const count = item.dispatched_quantity || item.quantity;
      const days = item.rent_basis === 'per_day' ? diffDays : 1;
      const lineAmount = count * item.rate_snapshot * days;
      rentTotal += lineAmount;

      invoiceLines.push({
        id: `il-${Date.now()}-${item.id}`,
        description: `${item.item_name} (${count} pcs ${item.rent_basis === 'per_day' ? `x ${days} days` : 'event rate'})`,
        quantity: count,
        rate: item.rate_snapshot * days,
        amount: lineAmount,
        type: 'rent',
      });
    });

    if (booking.transport_charge > 0) {
      invoiceLines.push({
        id: `il-${Date.now()}-transport`,
        description: 'Transport & Delivery Logistics Charge',
        quantity: 1,
        rate: booking.transport_charge,
        amount: booking.transport_charge,
        type: 'transport',
      });
    }

    if (booking.late_fee > 0) {
      invoiceLines.push({
        id: `il-${Date.now()}-late`,
        description: 'Overdue / Late Return Surcharge Fee',
        quantity: 1,
        rate: booking.late_fee,
        amount: booking.late_fee,
        type: 'late_fee',
      });
    }

    const netDamage = Math.max(0, (booking.damage_charge || 0) - (damageWaiverAmount || 0));
    if (netDamage > 0) {
      invoiceLines.push({
        id: `il-${Date.now()}-damage`,
        description: `Breakage & Missing Items Replacement${damageWaiverAmount > 0 ? ` (after waiver ₹${damageWaiverAmount})` : ''}`,
        quantity: 1,
        rate: netDamage,
        amount: netDamage,
        type: 'damage',
      });
    }

    const disc = discountAmount !== undefined ? discountAmount : booking.discount || 0;
    if (disc > 0) {
      invoiceLines.push({
        id: `il-${Date.now()}-discount`,
        description: 'Customer Discount / Promotional Allowance',
        quantity: 1,
        rate: -disc,
        amount: -disc,
        type: 'discount',
      });
    }

    const subtotal = rentTotal + booking.transport_charge + booking.late_fee + netDamage - disc;
    const taxAmount = taxRate > 0 ? Math.round((subtotal * taxRate) / 100 * 100) / 100 : 0;
    if (taxAmount > 0) {
      invoiceLines.push({
        id: `il-${Date.now()}-tax`,
        description: `GST @ ${taxRate}% (CGST ${taxRate / 2}% + SGST ${taxRate / 2}%)`,
        quantity: 1,
        rate: taxAmount,
        amount: taxAmount,
        type: 'tax',
      });
    }

    const totalAmount = Math.max(0, subtotal + taxAmount);
    const balanceDue = Math.max(0, totalAmount - (booking.advance_paid || 0));

    const invNum = `26-27/${String(invoices.length + 86).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoice_number: invNum,
      financial_year: '2026-2027',
      booking_id: booking.id,
      booking_number: booking.booking_number,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_address: booking.customer_address,
      delivery_date: booking.delivery_date,
      return_date: booking.actual_return_date || booking.expected_return_date,
      rent_days: diffDays,
      rent_amount: rentTotal,
      transport_charge: booking.transport_charge,
      damage_amount: netDamage,
      late_fee: booking.late_fee,
      discount: disc,
      tax_amount: taxAmount,
      tax_rate: taxRate,
      total_amount: totalAmount,
      advance_paid: booking.advance_paid || 0,
      balance_due: balanceDue,
      status: balanceDue === 0 ? 'paid' : 'final',
      issued_at: new Date().toISOString(),
      issued_by: role === 'owner' ? 'Owner' : 'Manager',
      lines: invoiceLines,
    };

    saveInvoices([newInvoice, ...invoices]);
    syncToPostgres('upsert_invoice', newInvoice);
    return newInvoice;
  };

  // Record payment
  const recordPayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
    };

    const nextPayments = [newPayment, ...payments];
    savePayments(nextPayments);
    syncToPostgres('record_payment', newPayment);

    // Update booking advance_paid or balance
    if (newPayment.direction === 'received') {
      const b = bookings.find((bk) => bk.id === newPayment.booking_id);
      if (b) {
        updateBooking(b.id, {
          advance_paid: (b.advance_paid || 0) + newPayment.amount,
        });
      }

      // Update invoice balance_due
      const inv = invoices.find((i) => i.booking_id === newPayment.booking_id);
      if (inv) {
        const nextBalance = Math.max(0, inv.balance_due - newPayment.amount);
        const nextInvoices = invoices.map((i) =>
          i.id === inv.id ? { ...i, balance_due: nextBalance, status: (nextBalance === 0 ? 'paid' : 'final') as 'paid' | 'final' } : i
        );
        saveInvoices(nextInvoices);
        const updatedInvoice = nextInvoices.find((i) => i.id === inv.id);
        if (updatedInvoice) {
          syncToPostgres('upsert_invoice', updatedInvoice);
        }
      }
    }
  };

  // Add Item
  const addItem = (itemData: Omit<Item, 'id' | 'in_godown' | 'out_on_rent' | 'in_cleaning' | 'written_off'>) => {
    const newItem: Item = {
      ...itemData,
      id: `item-${Date.now()}`,
      in_godown: itemData.total_quantity,
      out_on_rent: 0,
      in_cleaning: 0,
      written_off: 0,
    };

    saveItems([...items, newItem]);
    syncToPostgres('upsert_item', newItem);

    // Ledger opening entry
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      item_id: newItem.id,
      item_name: newItem.name,
      type: 'PURCHASE',
      quantity: newItem.total_quantity,
      bucket_to: 'In godown',
      user: role.toUpperCase(),
      reason: 'New stock added to inventory master',
      created_at: new Date().toISOString(),
    };

    saveLedger([movement, ...ledger]);
    syncToPostgres('add_stock_movement', movement);
  };

  const updateItem = (item: Item) => {
    const nextItems = items.map((i) => (i.id === item.id ? item : i));
    saveItems(nextItems);
    syncToPostgres('upsert_item', item);
  };

  // Stock Adjustment (Audit / Correction)
  const addStockAdjustment = (
    itemId: string,
    type: StockMovementType,
    quantity: number,
    reason: string
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    let nextGodown = item.in_godown;
    let nextTotal = item.total_quantity;

    if (type === 'PURCHASE' || type === 'AUDIT_CORRECTION') {
      nextGodown += quantity;
      nextTotal += quantity;
    } else if (type === 'ADJUSTMENT') {
      nextGodown = Math.max(0, nextGodown + quantity);
      nextTotal = Math.max(0, nextTotal + quantity);
    }

    const nextItems = items.map((i) =>
      i.id === itemId ? { ...i, in_godown: nextGodown, total_quantity: nextTotal } : i
    );
    saveItems(nextItems);
    const updated = nextItems.find((i) => i.id === itemId);
    if (updated) {
      syncToPostgres('upsert_item', updated);
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      item_id: item.id,
      item_name: item.name,
      type,
      quantity: Math.abs(quantity),
      bucket_to: 'In godown',
      user: role.toUpperCase(),
      reason,
      created_at: new Date().toISOString(),
    };

    saveLedger([movement, ...ledger]);
    syncToPostgres('add_stock_movement', movement);
  };

  // Wash done: moves from In Cleaning to In Godown
  const markWashed = (itemId: string, quantity: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.in_cleaning <= 0) return;

    const actualQty = Math.min(item.in_cleaning, quantity);
    const nextItems = items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            in_cleaning: i.in_cleaning - actualQty,
            in_godown: i.in_godown + actualQty,
          }
        : i
    );
    saveItems(nextItems);
    const updated = nextItems.find((i) => i.id === itemId);
    if (updated) {
      syncToPostgres('upsert_item', updated);
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      item_id: item.id,
      item_name: item.name,
      type: 'WASH_DONE',
      quantity: actualQty,
      bucket_from: 'In cleaning',
      bucket_to: 'In godown',
      user: role.toUpperCase(),
      reason: 'Cleaned, sanitized and restacked in warehouse',
      created_at: new Date().toISOString(),
    };

    saveLedger([movement, ...ledger]);
    syncToPostgres('add_stock_movement', movement);
  };

  // Add Customer
  const addCustomer = (customerData: Omit<Customer, 'id' | 'created_at'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    saveCustomers([newCustomer, ...customers]);
    syncToPostgres('upsert_customer', newCustomer);
    return newCustomer;
  };

  const resetAllData = () => {
    setRoleState(initialRole ?? 'owner');
    setProfileState(initialBusinessProfile);
    setItemsState(initialItems);
    setCustomersState(initialCustomers);
    setBookingsState(initialBookings);
    setLedgerState(initialLedger);
    setInvoicesState(initialInvoices);
    setPaymentsState(initialPayments);

    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
      } catch (_) {}
    }
  };

  const contextValue = useMemo<InventoryContextType>(
    () => ({
      role,
      setRole,
      profile,
      updateProfile,
      items,
      customers,
      bookings,
      ledger,
      invoices,
      payments,
      packages,
      getAvailableStock,
      createBooking,
      updateBooking,
      dispatchBooking,
      returnBooking,
      generateInvoice,
      recordPayment,
      addItem,
      updateItem,
      addStockAdjustment,
      markWashed,
      addCustomer,
      resetAllData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      role,
      profile,
      items,
      customers,
      bookings,
      ledger,
      invoices,
      payments,
      packages,
      getAvailableStock,
    ]
  );

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
