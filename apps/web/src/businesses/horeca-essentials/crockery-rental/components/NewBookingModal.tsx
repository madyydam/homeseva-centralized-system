import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Booking, BookingItem, Item } from '../types';
import {
  CalendarPlus,
  X,
  Plus,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  Users,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface NewBookingModalProps {
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({ onClose, onSuccess }) => {
  const {
    customers,
    addCustomer,
    items: masterItems,
    packages,
    getAvailableStock,
    createBooking,
    role,
  } = useInventory();

  // Step 1: Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Step 2: Event Dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  const [eventType, setEventType] = useState<Booking['event_type']>('Wedding');
  const [eventDate, setEventDate] = useState(tomorrow);
  const [deliveryDate, setDeliveryDate] = useState(tomorrow);
  const [expectedReturnDate, setExpectedReturnDate] = useState(dayAfter);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Step 3: Package combo expander
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [guestCount, setGuestCount] = useState(250);

  // Step 4: Items lines
  const [selectedLines, setSelectedLines] = useState<
    {
      itemId: string;
      quantity: number;
    }[]
  >([]);

  // Step 5: Commercials
  const [transportCharge, setTransportCharge] = useState(500);
  const [discount, setDiscount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(1000);
  const [securityDeposit, setSecurityDeposit] = useState(1000);
  const [notes, setNotes] = useState('');

  // Overbooking override
  const [allowOverbooking, setAllowOverbooking] = useState(false);
  const [overbookingReason, setOverbookingReason] = useState('');

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const isBlacklisted = currentCustomer?.tag === 'blacklisted';

  // Calculate rental days
  const delTime = new Date(deliveryDate || '').getTime();
  const retTime = new Date(expectedReturnDate || '').getTime();
  const rentDays = Math.max(1, Math.round((retTime - delTime) / 86400000) + 1);

  // Apply combo package expansion
  const handleApplyPackage = () => {
    const pkg = packages.find((p) => p.id === selectedPackageId);
    if (!pkg) return;

    const newLines = pkg.items.map((pi) => {
      const bufferMultiplier = 1 + pi.buffer_percent / 100;
      const count = Math.ceil(guestCount * pi.ratio_per_guest * bufferMultiplier);
      return {
        itemId: pi.item_id,
        quantity: count,
      };
    });

    setSelectedLines(newLines);
  };

  const handleAddItemLine = (itemId: string) => {
    if (selectedLines.some((l) => l.itemId === itemId)) return;
    const item = masterItems.find((m) => m.id === itemId);
    const defaultQty = item ? item.pack_size * 4 : 50;
    setSelectedLines((prev) => [...prev, { itemId, quantity: defaultQty }]);
  };

  const handleUpdateLineQty = (itemId: string, qty: number) => {
    setSelectedLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, quantity: Math.max(1, qty) } : l))
    );
  };

  const handleRemoveLine = (itemId: string) => {
    setSelectedLines((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  // Precompute item availability map for date range
  const itemAvailabilityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < masterItems.length; i++) {
      const it = masterItems[i];
      if (!it) continue;
      map.set(it.id, getAvailableStock(it.id, deliveryDate || '', expectedReturnDate || ''));
    }
    return map;
  }, [masterItems, deliveryDate, expectedReturnDate, getAvailableStock]);

  // Pricing calculations memoized
  const { linesWithMeta, estimatedRent, hasOverbookedLine, grandTotal } = useMemo(() => {
    let rent = 0;
    let overbooked = false;

    const list = selectedLines
      .map((line) => {
        const item = masterItems.find((m) => m.id === line.itemId);
        if (!item) return null;

        const available = itemAvailabilityMap.get(line.itemId) ?? 0;
        const isOver = line.quantity > available;
        if (isOver) overbooked = true;

        const days = item.rent_basis === 'per_day' ? rentDays : 1;
        const lineTotal = line.quantity * item.rent_per_day * days;
        rent += lineTotal;

        return {
          ...line,
          item,
          available,
          isOver,
          lineTotal,
        };
      })
      .filter(Boolean) as {
        itemId: string;
        quantity: number;
        item: Item;
        available: number;
        isOver: boolean;
        lineTotal: number;
      }[];

    const sub = rent + transportCharge - discount;
    const total = Math.max(0, sub);

    return {
      linesWithMeta: list,
      estimatedRent: rent,
      hasOverbookedLine: overbooked,
      grandTotal: total,
    };
  }, [selectedLines, masterItems, itemAvailabilityMap, rentDays, transportCharge, discount]);

  const handleSaveBooking = (status: 'Quotation' | 'Confirmed') => {
    if (!currentCustomer) {
      alert('Please select or create a customer.');
      return;
    }

    if (selectedLines.length === 0) {
      alert('Please add at least one item to the booking.');
      return;
    }

    if (hasOverbookedLine && status === 'Confirmed' && !allowOverbooking) {
      alert('Cannot confirm booking: some items exceed available stock. Either reduce quantity, override as manager, or save as Quotation.');
      return;
    }

    const bookingItems: BookingItem[] = selectedLines.map((line) => {
      const item = masterItems.find((m) => m.id === line.itemId)!;
      return {
        id: `bi-${Date.now()}-${line.itemId}`,
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        pack_size: item.pack_size,
        quantity: line.quantity,
        dispatched_quantity: 0,
        returned_good: 0,
        returned_broken: 0,
        returned_missing: 0,
        rate_snapshot: item.rent_per_day,
        rent_basis: item.rent_basis,
        replacement_cost_snapshot: item.replacement_cost,
      };
    });

    const newBooking = createBooking({
      customer_id: currentCustomer.id,
      customer_name: currentCustomer.name,
      customer_phone: currentCustomer.phone,
      customer_address: currentCustomer.address,
      event_type: eventType,
      event_date: eventDate || '',
      delivery_date: deliveryDate || '',
      expected_return_date: expectedReturnDate || '',
      venue_name: venueName || 'Venue TBD',
      venue_address: venueAddress || currentCustomer.address,
      contact_person: contactPerson || currentCustomer.name,
      status,
      items: bookingItems,
      transport_charge: transportCharge,
      discount,
      advance_paid: status === 'Confirmed' ? advancePaid : 0,
      security_deposit: securityDeposit,
      damage_charge: 0,
      late_fee: 0,
      notes: allowOverbooking
        ? `${notes}\n[MANAGER OVERBOOKING OVERRIDE: ${overbookingReason}]`
        : notes,
    });

    onSuccess(newBooking);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Create New Booking or Quotation
              </h2>
              <p className="text-xs text-muted-foreground">
                Live availability check • Combo set expander • Advance recording
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto text-xs">
          {/* Section 1: Customer Selection */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                1. Customer Information
              </span>
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {showNewCustomerForm ? '← Pick Existing' : '+ Add New Customer'}
              </button>
            </div>

            {showNewCustomerForm ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Verma Caterers"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9811223344"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Civil Lines, Gurugram"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCustName || !newCustPhone) return;
                        const created = addCustomer({
                          name: newCustName,
                          phone: newCustPhone,
                          address: newCustAddress || 'Local',
                          tag: 'regular',
                        });
                        setSelectedCustomerId(created.id);
                        setShowNewCustomerForm(false);
                      }}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full sm:w-80 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) • {c.tag.toUpperCase()}
                    </option>
                  ))}
                </select>

                {currentCustomer && (
                  <div className="text-xs text-muted-foreground">
                    Address: <strong className="text-foreground">{currentCustomer.address}</strong>
                  </div>
                )}
              </div>
            )}

            {isBlacklisted && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 flex items-center gap-2.5 text-rose-700">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Blacklisted Customer Warning:</strong> Past damage dispute. Manager approval & full security deposit required.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Dates & Venue Details */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
              2. Event Dates & Venue
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Reception">Reception</option>
                  <option value="Birthday">Birthday Party</option>
                  <option value="Corporate">Corporate Gala</option>
                  <option value="Catering">Outdoor Catering</option>
                  <option value="Religious">Religious Feast</option>
                  <option value="Other">Other Event</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Return Date</label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Venue Name</label>
                <input
                  type="text"
                  placeholder="e.g. Oberoi Banquet & Lawns"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Venue Address & On-site Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Gate 2, Golf Course Road (Contact: Ramesh 9811223344)"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Package Combo Fast Expander */}
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Quick Combo Package Expander (Optional)
              </span>
              <span className="text-[11px] text-amber-700 font-medium">
                Auto-multiplies items per guest with 5% safety buffer
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full sm:w-72 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
              >
                <option value="">-- Choose Combo Package --</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.description.slice(0, 40)}...)
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-muted-foreground">Guests:</span>
                <input
                  type="number"
                  min="20"
                  step="25"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  className="w-24 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-bold font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyPackage}
                  disabled={!selectedPackageId}
                  className="rounded-md bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Expand into Items
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Item Lines with LIVE Availability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                3. Booked Items ({selectedLines.length} item types)
              </span>

              {/* Add item dropdown */}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItemLine(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="rounded-md border border-input bg-background px-2.5 py-1 text-xs"
                >
                  <option value="">+ Add Individual Item...</option>
                  {masterItems.map((item) => {
                    const avail = itemAvailabilityMap.get(item.id) ?? 0;
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name} (Free: {avail} pcs)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {selectedLines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
                No items added yet. Pick a Combo Package above or choose from "+ Add Individual Item".
              </div>
            ) : (
              <div className="space-y-2">
                {linesWithMeta.map((line: any) => (
                  <div
                    key={line.itemId}
                    className={`rounded-xl border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      line.isOver
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs">
                          {line.item.name}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Pack: {line.item.pack_size}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                        <span>Rate: ₹{line.item.rent_per_day}/{line.item.rent_basis === 'per_day' ? 'day' : 'event'}</span>
                        <span className={line.isOver ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
                          Free on these dates: {line.available} pcs
                        </span>
                        {line.isOver && (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overbooked by {line.quantity - line.available} pcs!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          step={line.item.pack_size || 25}
                          value={line.quantity}
                          onChange={(e) =>
                            handleUpdateLineQty(line.itemId, parseInt(e.target.value) || 0)
                          }
                          className="w-20 rounded-md border border-input bg-background px-2 py-1 text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="w-24 text-right font-mono font-bold text-xs text-foreground">
                        ₹{line.lineTotal.toLocaleString('en-IN')}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.itemId)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Overbooking Override Warning if needed */}
            {hasOverbookedLine && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Stock Collision Detected! Quantities exceed owned available pieces.</span>
                </div>
                <p className="text-[11px] text-rose-600">
                  You can save this booking as a <strong>Quotation</strong> (which does not hold stock), or if you are Manager/Owner, you can override with a logged reason.
                </p>

                {(role === 'owner' || role === 'manager') && (
                  <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800 text-xs">
                      <input
                        type="checkbox"
                        checked={allowOverbooking}
                        onChange={(e) => setAllowOverbooking(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      Override & Confirm Anyway
                    </label>
                    {allowOverbooking && (
                      <input
                        type="text"
                        placeholder="Mandatory reason (e.g. Sub-renting 100 plates from vendor or washing expedited)"
                        value={overbookingReason}
                        onChange={(e) => setOverbookingReason(e.target.value)}
                        className="flex-1 rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs text-slate-900"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Commercials & Advance Payment */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Estimated Rent</label>
              <div className="text-base font-bold font-mono text-foreground mt-1">
                ₹{estimatedRent.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Transport Charge (₹)</label>
              <input
                type="number"
                min="0"
                value={transportCharge}
                onChange={(e) => setTransportCharge(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono font-bold mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono font-bold mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Grand Total (₹)</label>
              <div className="text-lg font-black font-mono text-primary mt-0.5">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Advance Amount Collected (₹)
              </label>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono font-bold mt-1 text-emerald-600"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Recorded automatically to payments ledger upon confirmation.
              </span>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Booking / Event Special Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Needs delivery by 1:00 PM; Gold rim plates for VIP head table"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2.5">
              {/* Save as Quotation */}
              <button
                type="button"
                onClick={() => handleSaveBooking('Quotation')}
                className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Save as Quotation (Hold No Stock)
              </button>

              {/* Confirm Booking */}
              <button
                type="button"
                onClick={() => handleSaveBooking('Confirmed')}
                disabled={hasOverbookedLine && !allowOverbooking}
                className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 active:scale-95"
              >
                Confirm Booking & Reserve Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
