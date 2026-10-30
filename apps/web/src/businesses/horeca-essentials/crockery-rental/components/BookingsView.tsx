import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Booking, BookingStatus } from '../types';
import {
  Calendar,
  Search,
  Filter,
  Truck,
  RotateCcw,
  FileText,
  CreditCard,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Eye,
  PlusCircle,
} from 'lucide-react';

interface BookingsViewProps {
  onDispatch: (booking: Booking) => void;
  onReturn: (booking: Booking) => void;
  onInvoice: (booking: Booking) => void;
  onPayment: (booking: Booking) => void;
  onNewBooking: () => void;
  initialSelectedBooking?: Booking | null;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  onDispatch,
  onReturn,
  onInvoice,
  onPayment,
  onNewBooking,
  initialSelectedBooking,
}) => {
  const { bookings, role, profile, updateBooking } = useInventory();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [detailBooking, setDetailBooking] = useState<Booking | null>(initialSelectedBooking || null);

  const statuses = useMemo(() => {
    let conf = 0;
    let disp = 0;
    let over = 0;
    let ret = 0;
    let quot = 0;
    let clos = 0;

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (!b) continue;
      if (b.status === 'Confirmed') conf++;
      else if (b.status === 'Dispatched') disp++;
      else if (b.status === 'Overdue') over++;
      else if (b.status === 'Returned') ret++;
      else if (b.status === 'Quotation') quot++;
      else if (b.status === 'Closed') clos++;
    }

    return [
      { key: 'all', label: 'All', count: bookings.length },
      { key: 'Confirmed', label: 'Confirmed', count: conf },
      { key: 'Dispatched', label: 'Dispatched', count: disp },
      { key: 'Overdue', label: 'Overdue', count: over },
      { key: 'Returned', label: 'Returned', count: ret },
      { key: 'Quotation', label: 'Quotations', count: quot },
      { key: 'Closed', label: 'Closed', count: clos },
    ];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = selectedStatus === 'all' || b.status === selectedStatus;
      const matchSearch =
        !q ||
        b.booking_number.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        b.venue_name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [bookings, selectedStatus, search]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed':
        return <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-600 border border-blue-500/20">Confirmed</span>;
      case 'Dispatched':
        return <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-600 border border-indigo-500/20">Dispatched</span>;
      case 'Overdue':
        return <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 border border-rose-500/20 animate-pulse">Overdue</span>;
      case 'Returned':
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/20">Returned</span>;
      case 'Quotation':
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 border border-amber-500/20">Quotation</span>;
      case 'Closed':
        return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground border border-border">Closed</span>;
      default:
        return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{status}</span>;
    }
  };

  const handleShareBooking = (b: Booking) => {
    const phone = b.customer_phone.replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const text = encodeURIComponent(
      `Hello ${b.customer_name},\n\nYour crockery rental booking *#${b.booking_number}* is confirmed with *${profile.name}*:\n` +
        `• Event: ${b.event_type} on ${b.event_date}\n` +
        `• Delivery: ${b.delivery_date} at ${b.venue_name}\n` +
        `• Items: ${b.items.map((i) => `${i.quantity}x ${i.item_name}`).join(', ')}\n` +
        `• Advance Paid: ₹${b.advance_paid}\n\n` +
        `For queries, call us at ${profile.phone}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Bookings & Quotations Registry
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track lifecycle from enquiry, live delivery dispatch, breakage inspection to invoice settlement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search booking #, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {role !== 'godown' && (
              <button
                onClick={onNewBooking}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Booking</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-border">
          {statuses.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === tab.key
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedStatus === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / List */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No bookings found matching current filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredBookings.map((b) => {
              const totalItemsCount = b.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div
                  key={b.id}
                  className="p-5 hover:bg-muted/20 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Identifiers, Status & Customer */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {b.booking_number}
                      </span>
                      {getStatusBadge(b.status)}
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {b.event_type}
                      </span>
                    </div>

                    <h3 className="font-bold text-foreground text-sm">
                      {b.customer_name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Venue: <strong className="text-foreground">{b.venue_name}</strong></span>
                      <span>Delivery: <strong className="text-foreground">{b.delivery_date}</strong></span>
                      <span>Return: <strong className="text-foreground">{b.expected_return_date}</strong></span>
                      <span>Phone: <strong>{b.customer_phone}</strong></span>
                    </div>

                    {/* Items chips preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {b.items.slice(0, 4).map((i) => (
                        <span
                          key={i.id}
                          className="rounded bg-muted/60 border border-border/50 px-2 py-0.5 text-[10px] font-medium text-foreground"
                        >
                          {i.quantity}x {(i.item_name.split('(')[0] || i.item_name).trim()}
                        </span>
                      ))}
                      {b.items.length > 4 && (
                        <span className="text-[10px] text-muted-foreground py-0.5">
                          +{b.items.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Financials (Hidden for Godown staff as per PRD) */}
                  {role !== 'godown' && (
                    <div className="flex lg:flex-col lg:items-end justify-between border-t lg:border-t-0 pt-2 lg:pt-0 border-border/50 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Advance</span>
                        <div className="font-mono font-bold text-emerald-600">
                          ₹{b.advance_paid.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="lg:mt-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Security Deposit</span>
                        <div className="font-mono text-muted-foreground">
                          ₹{b.security_deposit.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right Column: Workflow Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    {/* Dispatch CTA */}
                    {b.status === 'Confirmed' && (
                      <button
                        onClick={() => onDispatch(b)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Dispatch</span>
                      </button>
                    )}

                    {/* Return CTA */}
                    {(b.status === 'Dispatched' || b.status === 'Overdue') && (
                      <button
                        onClick={() => onReturn(b)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Return & Count</span>
                      </button>
                    )}

                    {/* Invoice View */}
                    {b.status === 'Returned' && role !== 'godown' && (
                      <button
                        onClick={() => onInvoice(b)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Invoice</span>
                      </button>
                    )}

                    {/* Record Payment */}
                    {role !== 'godown' && (
                      <button
                        onClick={() => onPayment(b)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                        title="Record Payment"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* WhatsApp Share */}
                    <button
                      onClick={() => handleShareBooking(b)}
                      className="p-1.5 rounded-lg border border-border text-emerald-600 hover:bg-emerald-500/10 transition"
                      title="Share confirmation on WhatsApp"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>

                    {/* View Details Drawer */}
                    <button
                      onClick={() => setDetailBooking(b)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Detail Drawer / Modal */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-base text-foreground">
                  {detailBooking.booking_number}
                </span>
                {getStatusBadge(detailBooking.status)}
              </div>
              <button
                onClick={() => setDetailBooking(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Event & Customer info */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/20 border border-border p-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Customer</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{detailBooking.customer_name}</p>
                  <p className="text-muted-foreground mt-0.5">Phone: {detailBooking.customer_phone}</p>
                  <p className="text-muted-foreground text-[11px]">{detailBooking.customer_address}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Event & Venue</span>
                  <p className="font-bold text-foreground mt-0.5">{detailBooking.event_type} on {detailBooking.event_date}</p>
                  <p className="text-muted-foreground mt-0.5">Venue: {detailBooking.venue_name}</p>
                  <p className="text-muted-foreground text-[11px]">Contact: {detailBooking.contact_person || 'Self'}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Reserved Items ({detailBooking.items.length})
                </span>
                <table className="w-full text-left border border-border rounded-lg overflow-hidden">
                  <thead className="bg-muted/40 text-[11px] font-bold text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 text-center">Pack</th>
                      <th className="p-2.5 text-center">Booked</th>
                      <th className="p-2.5 text-center">Dispatched</th>
                      <th className="p-2.5 text-center">Returned</th>
                      {role !== 'godown' && <th className="p-2.5 text-right">Rent Rate</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-medium">
                    {detailBooking.items.map((i) => (
                      <tr key={i.id}>
                        <td className="p-2.5 font-semibold text-foreground">{i.item_name}</td>
                        <td className="p-2.5 text-center text-muted-foreground font-mono">{i.pack_size}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{i.quantity}</td>
                        <td className="p-2.5 text-center font-mono text-blue-600 font-bold">{i.dispatched_quantity || 0}</td>
                        <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">{i.returned_good || 0}</td>
                        {role !== 'godown' && (
                          <td className="p-2.5 text-right font-mono font-semibold">
                            ₹{i.rate_snapshot}/{i.rent_basis === 'per_day' ? 'day' : 'event'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {detailBooking.notes && (
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="font-bold text-[10px] text-muted-foreground uppercase">Special Notes:</span>
                  <p className="text-foreground mt-0.5">{detailBooking.notes}</p>
                </div>
              )}

              {/* Action Buttons in Drawer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                {detailBooking.status === 'Confirmed' && (
                  <button
                    onClick={() => {
                      const b = detailBooking;
                      setDetailBooking(null);
                      onDispatch(b);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    <span>Proceed to Dispatch</span>
                  </button>
                )}
                {(detailBooking.status === 'Dispatched' || detailBooking.status === 'Overdue') && (
                  <button
                    onClick={() => {
                      const b = detailBooking;
                      setDetailBooking(null);
                      onReturn(b);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Process Return & Counting</span>
                  </button>
                )}
                <button
                  onClick={() => setDetailBooking(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
