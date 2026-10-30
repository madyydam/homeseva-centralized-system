import React, { useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Booking, Item } from '../types';
import {
  Truck,
  RotateCcw,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  PhoneCall,
  Clock,
  ArrowRight,
  PlusCircle,
  CheckCircle,
  Droplets,
} from 'lucide-react';

interface DashboardViewProps {
  onDispatchClick: (booking: Booking) => void;
  onReturnClick: (booking: Booking) => void;
  onNewBookingClick: () => void;
  onNavigateTab: (tab: string) => void;
  onViewBooking: (booking: Booking) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onDispatchClick,
  onReturnClick,
  onNewBookingClick,
  onNavigateTab,
  onViewBooking,
}) => {
  const { items, bookings, invoices, payments, role } = useInventory();

  // Metric computations memoized
  const {
    totalOwnedPieces,
    outOnRentPieces,
    inGodownPieces,
    inCleaningPieces,
    writtenOffPieces,
    lowStockItems,
  } = useMemo(() => {
    let owned = 0;
    let rented = 0;
    let godown = 0;
    let clean = 0;
    let written = 0;
    const lowStock: Item[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) continue;
      owned += it.total_quantity;
      rented += it.out_on_rent;
      godown += it.in_godown;
      clean += it.in_cleaning;
      written += it.written_off;
      if (it.low_stock_threshold && it.in_godown <= it.low_stock_threshold) {
        lowStock.push(it);
      }
    }

    return {
      totalOwnedPieces: owned,
      outOnRentPieces: rented,
      inGodownPieces: godown,
      inCleaningPieces: clean,
      writtenOffPieces: written,
      lowStockItems: lowStock,
    };
  }, [items]);

  const { dispatchesPending, returnsPending, overdueBookings } = useMemo(() => {
    const dispatches: Booking[] = [];
    const returns: Booking[] = [];
    const overdue: Booking[] = [];

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (!b) continue;
      if (b.status === 'Confirmed') dispatches.push(b);
      else if (b.status === 'Dispatched') returns.push(b);
      else if (b.status === 'Overdue') overdue.push(b);
    }

    return {
      dispatchesPending: dispatches,
      returnsPending: returns,
      overdueBookings: overdue,
    };
  }, [bookings]);

  const { totalOutstanding, totalBilled } = useMemo(() => {
    let outstanding = 0;
    let billed = 0;
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      if (!inv) continue;
      outstanding += inv.balance_due;
      billed += inv.total_amount;
    }
    return { totalOutstanding: outstanding, totalBilled: billed };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header Bar with + New Booking Action */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-foreground">
            Rental Operations Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time godown inventory, active dispatches, returns inspection & billing.
          </p>
        </div>

        {role !== 'godown' && (
          <button
            onClick={onNewBookingClick}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ New Booking</span>
          </button>
        )}
      </div>

      {/* High-Priority Alerts */}
      {overdueBookings.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-800">
                {overdueBookings.length} Overdue Crockery Rental{overdueBookings.length > 1 ? 's' : ''} Detected!
              </h3>
              <p className="text-xs text-rose-700/90 mt-0.5">
                Expected return date has passed. Pieces are still in customer custody and accumulating daily late fees.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('bookings')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
          >
            <span>Review Overdue Bookings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 6 Key Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Pieces & Stock Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Pieces Owned
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-foreground mt-3">
            {totalOwnedPieces.toLocaleString('en-IN')}
          </div>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="text-emerald-600 font-bold">• In Godown (Clean):</span>
              <span className="font-mono font-bold text-foreground">{inGodownPieces}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600 font-bold">• Out on Rent:</span>
              <span className="font-mono font-bold text-foreground">{outOnRentPieces}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600 font-bold">• In Cleaning Wash:</span>
              <span className="font-mono font-bold text-foreground">{inCleaningPieces}</span>
            </div>
          </div>
        </div>

        {/* Today's Dispatches Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ready for Dispatch
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-blue-600 mt-3">
            {dispatchesPending.length}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Bookings confirmed and scheduled for vehicle loading today.
          </p>
          <div className="mt-4 pt-3 border-t border-border/60">
            <button
              onClick={() => onNavigateTab('bookings')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Loading Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Today's Returns Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Returns Due Today
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 mt-3">
            {returnsPending.length}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Rentals scheduled to arrive for count and breakage inspection.
          </p>
          <div className="mt-4 pt-3 border-t border-border/60">
            <button
              onClick={() => onNavigateTab('bookings')}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Returns</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Financial Outstanding Card (Hidden for Godown staff) */}
        {role !== 'godown' ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Outstanding Balance
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-700 mt-3">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Total uncollected invoices across regular and caterer accounts.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60">
              <button
                onClick={() => onNavigateTab('invoices')}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Unpaid Invoices</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* For Godown staff: Washing Queue Counter */
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                In Washing Queue
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                <Droplets className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600 mt-2">
              {inCleaningPieces} pcs
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Returned pieces waiting to be sanitized and restocked in godown.
            </p>
            <div className="mt-3 pt-2 border-t border-border/60">
              <button
                onClick={() => onNavigateTab('cleaning')}
                className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
              >
                <span>Open Wash Station</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Operational Queues + Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Action Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue: Dispatches Due */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">
                  Today's Dispatches ({dispatchesPending.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all
              </button>
            </div>

            {dispatchesPending.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                All scheduled dispatches for today are loaded and on the road!
              </div>
            ) : (
              <div className="space-y-3">
                {dispatchesPending.map((booking) => {
                  const totalPcs = booking.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-foreground">
                            {booking.booking_number}
                          </span>
                          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                            {booking.event_type}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            • {totalPcs} pieces total
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground mt-1">
                          {booking.customer_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Venue: <strong>{booking.venue_name}</strong> • Phone: {booking.customer_phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewBooking(booking)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onDispatchClick(booking)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Start Loading</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Queue: Returns Due */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-foreground">
                  Today's Returns & Breakage Inspection ({returnsPending.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all
              </button>
            </div>

            {returnsPending.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No customer returns currently scheduled for today.
              </div>
            ) : (
              <div className="space-y-3">
                {returnsPending.map((booking) => {
                  const sentPcs = booking.items.reduce(
                    (s, i) => s + (i.dispatched_quantity || i.quantity),
                    0
                  );
                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-foreground">
                            {booking.booking_number}
                          </span>
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            Dispatched
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            • Sent: {sentPcs} pieces
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground mt-1">
                          {booking.customer_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Expected Return: <strong>{booking.expected_return_date}</strong> • Driver: {booking.dispatched_by || 'Godown'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewBooking(booking)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onReturnClick(booking)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Count & Return</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions, Low Stock & Wash Alerts */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={onNewBookingClick}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted font-semibold text-foreground gap-1.5 transition text-center"
              >
                <PlusCircle className="h-4 w-4 text-amber-600" />
                <span>New Booking</span>
              </button>
              <button
                onClick={() => onNavigateTab('availability')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted font-semibold text-foreground gap-1.5 transition text-center"
              >
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Check Dates</span>
              </button>
              <button
                onClick={() => onNavigateTab('cleaning')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted font-semibold text-foreground gap-1.5 transition text-center"
              >
                <Droplets className="h-4 w-4 text-purple-600" />
                <span>Wash Station</span>
              </button>
              <button
                onClick={() => onNavigateTab('items')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted font-semibold text-foreground gap-1.5 transition text-center"
              >
                <Package className="h-4 w-4 text-emerald-600" />
                <span>Item Master</span>
              </button>
            </div>
          </div>

          {/* Low Stock Godown Alert */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Low Clean Stock Warning
              </h3>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                {lowStockItems.length} items
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                All inventory items currently have sufficient clean buffer in godown.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2 rounded-lg bg-muted/20"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{item.name}</span>
                      <p className="text-[10px] text-muted-foreground">
                        Threshold: {item.low_stock_threshold}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded">
                      {item.in_godown} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Business Profile Reference */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-amber-500/5 to-amber-600/10 p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Crockery Operations Note</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Count-based tracking active. Stacks and loose pieces are converted directly into inventory ledgers. No barcode labeling needed on plates or cutlery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
