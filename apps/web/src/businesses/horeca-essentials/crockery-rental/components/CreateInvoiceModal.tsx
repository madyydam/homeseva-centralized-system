import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Invoice, InvoiceLine, InvoiceFirm } from '../types';
import { INVOICE_FIRMS } from '../firms';
import {
  FileText,
  Building2,
  Calendar,
  User,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Layers,
  Truck,
  ShieldAlert,
  Percent,
  Hash,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onInvoiceCreated: (invoice: Invoice) => void;
  initialBookingId?: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  onClose,
  onInvoiceCreated,
  initialBookingId,
}) => {
  const { bookings, items, invoices, customers, createInvoice } = useInventory();

  // Step state: 1 = Firm Selection, 2 = Form Details
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFirm, setSelectedFirm] = useState<InvoiceFirm>('someshwar');
  const [creationMode, setCreationMode] = useState<'booking' | 'direct'>(
    initialBookingId || bookings.length > 0 ? 'booking' : 'direct'
  );

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    initialBookingId || (bookings[0]?.id || '')
  );

  // Form Fields
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [rentDays, setRentDays] = useState<number>(1);

  // Customer / Buyer
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerGstin, setCustomerGstin] = useState<string>('');

  // Consignee (Ship To)
  const [sameAsBuyer, setSameAsBuyer] = useState<boolean>(true);
  const [consigneeName, setConsigneeName] = useState<string>('');
  const [consigneeAddress, setConsigneeAddress] = useState<string>('');
  const [consigneeGstin, setConsigneeGstin] = useState<string>('');

  // Logistics
  const [dispatchDocNo, setDispatchDocNo] = useState<string>(`DC NO-${invoices.length + 352}`);
  const [deliveryNote, setDeliveryNote] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Charges
  const [transportCharge, setTransportCharge] = useState<number>(0);
  const [lateFee, setLateFee] = useState<number>(0);
  const [damageAmount, setDamageAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [advancePaid, setAdvancePaid] = useState<number>(0);

  // Line items
  const [lineItems, setLineItems] = useState<
    Array<{
      id: string;
      description: string;
      particulars?: string;
      hsn_sac: string;
      quantity: number;
      rate: number;
      per: string;
      days: number;
      amount: number;
      type: 'rent' | 'transport' | 'damage' | 'late_fee' | 'discount';
    }>
  >([
    {
      id: `item-${Date.now()}-1`,
      description: 'Bone China Dinner Plates',
      particulars: 'Bone China Dinner Plates 100nos @10per Nos X1day',
      hsn_sac: '997319',
      quantity: 100,
      rate: 10,
      per: 'Nos',
      days: 1,
      amount: 1000,
      type: 'rent',
    },
  ]);

  // When firm is selected, initialize invoice numbering pattern
  const handleSelectFirm = (firm: InvoiceFirm) => {
    setSelectedFirm(firm);
    const firmCount = invoices.filter((i) => i.firm === firm).length;
    if (firm === 'someshwar') {
      setInvoiceNumber(String(firmCount + 28));
    } else {
      setInvoiceNumber(`26-27/CCG/${String(firmCount + 377)}`);
    }
    setStep(2);
  };

  // Populate from booking if chosen
  const handleLoadBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    const b = bookings.find((bk) => bk.id === bookingId);
    if (!b) return;

    setCustomerName(b.customer_name);
    setCustomerPhone(b.customer_phone);
    setCustomerAddress(b.customer_address || '');
    const matchedCustomer = customers.find((c) => c.id === b.customer_id);
    setCustomerGstin(matchedCustomer?.gstin || '');
    setDeliveryDate(b.delivery_date);
    setReturnDate(b.actual_return_date || b.expected_return_date);
    setEventDate(b.delivery_date);
    setTransportCharge(b.transport_charge || 0);
    setLateFee(b.late_fee || 0);
    setDamageAmount(b.damage_charge || 0);
    setDiscountAmount(b.discount || 0);
    setAdvancePaid(b.advance_paid || 0);

    const d1 = new Date(b.delivery_date);
    const d2 = new Date(b.actual_return_date || b.expected_return_date);
    const diff = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
    setRentDays(diff);

    if (b.items && b.items.length > 0) {
      const generated = b.items.map((it, idx) => {
        const count = it.dispatched_quantity || it.quantity;
        const days = it.rent_basis === 'per_day' ? diff : 1;
        const total = count * it.rate_snapshot * days;
        return {
          id: `item-${Date.now()}-${idx}`,
          description: it.item_name,
          particulars: `${it.item_name} ${count}nos @${it.rate_snapshot}per Nos X${days}day`,
          hsn_sac: '997319',
          quantity: count,
          rate: it.rate_snapshot,
          per: 'Nos',
          days,
          amount: total,
          type: 'rent' as const,
        };
      });
      setLineItems(generated);
    }
  };

  // Add Item Row
  const handleAddItemRow = (presetItem?: (typeof items)[0]) => {
    const defaultRate = presetItem ? presetItem.rent_per_day : 15;
    const defaultName = presetItem ? presetItem.name : 'Portion Bowl';
    const total = 100 * defaultRate * rentDays;
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length}`,
        description: defaultName,
        particulars: `${defaultName} 100nos @${defaultRate}per Nos X${rentDays}day`,
        hsn_sac: '997319',
        quantity: 100,
        rate: defaultRate,
        per: 'Nos',
        days: rentDays,
        amount: total,
        type: 'rent',
      },
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemRow = (id: string, updates: Partial<(typeof lineItems)[0]>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        const q = Number(next.quantity) || 0;
        const r = Number(next.rate) || 0;
        const d = Number(next.days) || 1;
        next.amount = Math.round(q * r * d * 100) / 100;
        next.particulars = next.description;
        return next;
      })
    );
  };

  // Financial Summary
  const { subtotal, gstAmount, roundOff, grandTotal, balanceDue } = useMemo(() => {
    const itemsTotal = lineItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const sub = itemsTotal + Number(transportCharge) + Number(lateFee) + Number(damageAmount) - Number(discountAmount);
    const gst = taxRate > 0 ? Math.round((sub * taxRate) / 100 * 100) / 100 : 0;
    const rawTotal = sub + gst;
    const rounded = Math.round(rawTotal);
    const ro = Math.round((rounded - rawTotal) * 100) / 100;
    const due = Math.max(0, rounded - Number(advancePaid));
    return {
      subtotal: sub,
      gstAmount: gst,
      roundOff: ro,
      grandTotal: rounded,
      balanceDue: due,
    };
  }, [lineItems, transportCharge, lateFee, damageAmount, discountAmount, taxRate, advancePaid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter customer / buyer name');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Please enter invoice number');
      return;
    }

    const finalLines: InvoiceLine[] = [
      ...lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        particulars: li.particulars,
        hsn_sac: li.hsn_sac,
        quantity: li.quantity,
        rate: li.rate,
        per: li.per,
        days: li.days,
        amount: li.amount,
        type: li.type,
      })),
    ];

    if (transportCharge > 0) {
      finalLines.push({
        id: `il-${Date.now()}-transport`,
        description: 'Transport & Logistics Delivery Charges',
        particulars: 'Transport & Logistics Delivery Charges',
        hsn_sac: '997319',
        quantity: 1,
        rate: transportCharge,
        per: 'Trip',
        days: 1,
        amount: transportCharge,
        type: 'transport',
      });
    }

    if (lateFee > 0) {
      finalLines.push({
        id: `il-${Date.now()}-late`,
        description: 'Overdue / Late Return Fee',
        particulars: 'Overdue / Late Return Fee',
        hsn_sac: '997319',
        quantity: 1,
        rate: lateFee,
        per: 'Day',
        days: 1,
        amount: lateFee,
        type: 'late_fee',
      });
    }

    if (damageAmount > 0) {
      finalLines.push({
        id: `il-${Date.now()}-damage`,
        description: 'Breakage / Missing Items Replacement Charges',
        particulars: 'Breakage / Missing Items Replacement Charges',
        hsn_sac: '997319',
        quantity: 1,
        rate: damageAmount,
        per: 'Nos',
        days: 1,
        amount: damageAmount,
        type: 'damage',
      });
    }

    if (discountAmount > 0) {
      finalLines.push({
        id: `il-${Date.now()}-discount`,
        description: 'Customer Discount Allowance',
        particulars: 'Customer Discount Allowance',
        hsn_sac: '997319',
        quantity: 1,
        rate: -discountAmount,
        per: 'Ls',
        days: 1,
        amount: -discountAmount,
        type: 'discount',
      });
    }

    const created: Invoice = {
      id: `inv-${Date.now()}`,
      firm: selectedFirm,
      invoice_number: invoiceNumber.trim(),
      financial_year: '2026-2027',
      booking_id: creationMode === 'booking' ? selectedBookingId : `direct-${Date.now()}`,
      booking_number: creationMode === 'booking' ? (bookings.find((b) => b.id === selectedBookingId)?.booking_number || 'DIR-001') : 'DIRECT',
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_address: customerAddress.trim(),
      customer_gstin: customerGstin.trim(),
      consignee_name: sameAsBuyer ? customerName.trim() : consigneeName.trim(),
      consignee_address: sameAsBuyer ? customerAddress.trim() : consigneeAddress.trim(),
      consignee_gstin: sameAsBuyer ? customerGstin.trim() : consigneeGstin.trim(),
      delivery_note: deliveryNote.trim(),
      dispatch_doc_no: dispatchDocNo.trim(),
      delivery_date: deliveryDate,
      return_date: returnDate,
      event_date: eventDate,
      rent_days: rentDays,
      rent_amount: lineItems.reduce((acc, curr) => acc + curr.amount, 0),
      transport_charge: transportCharge,
      damage_amount: damageAmount,
      late_fee: lateFee,
      discount: discountAmount,
      round_off: roundOff,
      tax_amount: gstAmount,
      tax_rate: taxRate,
      total_amount: grandTotal,
      advance_paid: advancePaid,
      balance_due: balanceDue,
      status: balanceDue <= 0 ? 'paid' : 'final',
      issued_at: new Date(invoiceDate).toISOString(),
      issued_by: 'Staff',
      remarks: remarks.trim() || `${invoiceNumber} / ${new Date(invoiceDate).toLocaleDateString('en-IN')}`,
      lines: finalLines,
    };

    createInvoice(created);
    onInvoiceCreated(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">
                {step === 1 ? 'Step 1: Select Billing Firm' : 'Step 2: Generate Tax Invoice'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 1
                  ? 'Choose the company entity and template for this commercial invoice'
                  : `Drafting invoice for ${INVOICE_FIRMS[selectedFirm].name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: FIRM SELECTION */}
        {step === 1 && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="text-center max-w-md mx-auto space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Dual-Entity Multi-Firm Billing
              </span>
              <h3 className="text-xl font-black text-foreground">Select Company / Firm</h3>
              <p className="text-xs text-muted-foreground">
                Items and rate calculations remain unified; only header branding, tax layout, bank accounts and numbering change.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Option 1: Someshwar Enterprises */}
              <div
                onClick={() => handleSelectFirm('someshwar')}
                className={`group relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedFirm === 'someshwar'
                    ? 'border-lime-500 bg-lime-500/5 ring-4 ring-lime-500/10'
                    : 'border-border hover:border-lime-400 bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-lime-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                      SE
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground group-hover:text-lime-600 transition">
                        Someshwar Enterprises
                      </h4>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Modern Angular Lime-Green Format
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
                    Proprietor Firm
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Baramati, Pune-412306</p>
                  <p>GSTIN: <span className="font-mono font-bold text-foreground">27CFMPK7012M1Z2</span></p>
                  <p>Bank: <span className="font-medium text-foreground">Union Bank of India-0022</span></p>
                  <p>Account No: <span className="font-mono font-bold text-foreground">324921010000022</span></p>
                  <p className="text-[11px] pt-1 text-slate-500 italic">
                    Includes clean From/To box, rate/day calculation & signature stamp.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold text-lime-600 group-hover:translate-x-1 transition-transform">
                  <span>Select Someshwar Format</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Option 2: Homeseva 2024-2025 */}
              <div
                onClick={() => handleSelectFirm('homeseva')}
                className={`group relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedFirm === 'homeseva'
                    ? 'border-blue-600 bg-blue-600/5 ring-4 ring-blue-600/10'
                    : 'border-border hover:border-blue-500 bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                      HS
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground group-hover:text-blue-600 transition">
                        Homeseva 2024-2025
                      </h4>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Corporate Tally Grid & GST HSN Format
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Corporate Entity
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Kothrud, Pune 411038</p>
                  <p>GSTIN: <span className="font-mono font-bold text-foreground">27AAJFH4134K1Z8</span></p>
                  <p>Bank: <span className="font-medium text-foreground">Yes Bank Ltd - 0893</span></p>
                  <p>Account No: <span className="font-mono font-bold text-foreground">000861900000893</span></p>
                  <p className="text-[11px] pt-1 text-slate-500 italic">
                    Includes Consignee, Delivery Note, DC No, CCG breakdown & HSN 997319 table.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Select HomeSeva Format</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: INVOICE DETAILS FORM */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Active Firm Banner & Switcher */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-xs ${
                    selectedFirm === 'someshwar' ? 'bg-lime-600' : 'bg-blue-600'
                  }`}
                >
                  {selectedFirm === 'someshwar' ? 'SE' : 'HS'}
                </div>
                <div>
                  <h4 className="font-black text-xs text-foreground">
                    Selected Entity: {INVOICE_FIRMS[selectedFirm].name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    GSTIN: {INVOICE_FIRMS[selectedFirm].gstin} • Bank: {INVOICE_FIRMS[selectedFirm].bank.bankName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1 rounded-lg text-xs font-bold border border-border hover:bg-muted text-muted-foreground cursor-pointer transition"
                >
                  Change Firm
                </button>
              </div>
            </div>

            {/* Source Selection: From Booking vs Direct */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Invoice Source
                </span>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCreationMode('booking')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      creationMode === 'booking'
                        ? 'bg-card text-foreground shadow-xs font-extrabold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    From Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('direct')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      creationMode === 'direct'
                        ? 'bg-card text-foreground shadow-xs font-extrabold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Direct Invoice
                  </button>
                </div>
              </div>

              {creationMode === 'booking' && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Select Event Booking to Auto-Fill Items & Rates
                  </label>
                  {bookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No active bookings found. Switch to "Direct Invoice" to create a fresh invoice manually.
                    </p>
                  ) : (
                    <select
                      value={selectedBookingId}
                      onChange={(e) => handleLoadBooking(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="">-- Choose Booking --</option>
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          #{b.booking_number} • {b.customer_name} • {b.event_type || 'Event'} ({b.items?.length || 0} items)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Row 1: Invoice Meta & Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Invoice No. *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. 28 or 26-27/CCG/377"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold text-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Delivery / Event Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => {
                    setDeliveryDate(e.target.value);
                    if (!eventDate) setEventDate(e.target.value);
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Rent Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={rentDays}
                  onChange={(e) => setRentDays(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold text-foreground"
                />
              </div>
            </div>

            {/* Row 2: Customer / Buyer Details */}
            <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                Buyer (Bill To)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Customer / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. CLASSIC CITI INVESTMENTS PVT LTD"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    GSTIN / UIN
                  </label>
                  <input
                    type="text"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AABCC7550P1Z7"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold text-foreground"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Full Billing Address
                  </label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Street, Area, City, Pin Code"
                    className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
                  />
                </div>
              </div>

              {/* Consignee Toggle (especially for HomeSeva format) */}
              <div className="pt-2 border-t border-border space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={sameAsBuyer}
                    onChange={(e) => setSameAsBuyer(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Consignee (Ship To) is same as Buyer</span>
                </label>

                {!sameAsBuyer && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                        Consignee Name
                      </label>
                      <input
                        type="text"
                        value={consigneeName}
                        onChange={(e) => setConsigneeName(e.target.value)}
                        placeholder="Venue / Hotel Name"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                        Consignee GSTIN
                      </label>
                      <input
                        type="text"
                        value={consigneeGstin}
                        onChange={(e) => setConsigneeGstin(e.target.value.toUpperCase())}
                        placeholder="GSTIN"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                        Shipping Address
                      </label>
                      <input
                        type="text"
                        value={consigneeAddress}
                        onChange={(e) => setConsigneeAddress(e.target.value)}
                        placeholder="Venue address"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Dispatch & Logistics Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Dispatch Doc No.
                </label>
                <input
                  type="text"
                  value={dispatchDocNo}
                  onChange={(e) => setDispatchDocNo(e.target.value)}
                  placeholder="DC NO-352"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono text-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Delivery Note
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Optional delivery note ref"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Wedding Banquet / Corporate Event"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                />
              </div>
            </div>

            {/* Row 4: Line Items Table */}
            <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Crockery & Hire Items ({lineItems.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Items are priced per day. Line total = Qty × Rate × Days.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddItemRow()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-muted/40 border border-border text-xs"
                  >
                    <div className="col-span-12 sm:col-span-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItemRow(item.id, { description: e.target.value })}
                        placeholder="Item Description"
                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold text-foreground"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemRow(item.id, { quantity: Number(e.target.value) || 0 })}
                        placeholder="Qty"
                        title="Quantity"
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-center font-bold text-foreground"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.rate}
                        onChange={(e) => handleUpdateItemRow(item.id, { rate: Number(e.target.value) || 0 })}
                        placeholder="Rate"
                        title="Rate per day"
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-center font-bold text-foreground"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={item.days}
                        onChange={(e) => handleUpdateItemRow(item.id, { days: Number(e.target.value) || 1 })}
                        placeholder="Days"
                        title="Rental Days"
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-center font-bold text-foreground"
                      />
                    </div>
                    <div className="col-span-8 sm:col-span-2 text-right font-mono font-bold text-foreground pr-2">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="col-span-4 sm:col-span-1 text-right">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 5: Charges, Discounts & Tax Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Other Surcharges Left */}
              <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                  Other Logistics & Charges
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Transport / Logistics (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={transportCharge}
                      onChange={(e) => setTransportCharge(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Breakage / Damage (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={damageAmount}
                      onChange={(e) => setDamageAmount(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Discount / Promo (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground font-semibold text-rose-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Advance Paid (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground font-semibold text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Final Totals Box Right */}
              <div className="rounded-xl border border-border p-4 space-y-2.5 bg-muted/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Sub-total:</span>
                  <span className="font-mono font-bold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">GST Tax:</span>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                      className="rounded border border-input bg-background px-1.5 py-0.5 text-[11px] font-bold text-foreground"
                    >
                      <option value={18}>18% (CGST 9% + SGST 9%)</option>
                      <option value={12}>12%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0% (Tax Exempt)</option>
                    </select>
                  </div>
                  <span className="font-mono font-bold text-foreground">₹{gstAmount.toFixed(1)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Round Off:</span>
                  <span className="font-mono font-bold text-foreground">
                    {roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                  <span className="font-black text-foreground uppercase tracking-wide">Grand Total:</span>
                  <span className="font-mono font-black text-base text-foreground">
                    ₹{grandTotal.toLocaleString('en-IN')}/-
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-dashed border-border">
                  <span className="text-muted-foreground">Net Balance Due:</span>
                  <span className={`font-mono font-black ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar Bottom */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted text-muted-foreground cursor-pointer transition"
              >
                Back to Firm Selection
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/25 transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save & Preview Invoice</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
