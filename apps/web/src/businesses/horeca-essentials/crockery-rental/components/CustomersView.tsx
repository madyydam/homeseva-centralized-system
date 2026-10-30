import React, { useState, useMemo, useCallback } from 'react';
import { useInventory } from '../InventoryContext';
import { Customer } from '../types';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  MapPin,
  FileText,
  ShieldAlert,
  AlertTriangle,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, bookings, invoices, payments, addCustomer } = useInventory();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<'all' | 'regular' | 'caterer' | 'blacklisted'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New customer modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [tag, setTag] = useState<'regular' | 'caterer' | 'blacklisted'>('regular');
  const [notes, setNotes] = useState('');

  const blacklistedCount = useMemo(() => {
    return customers.filter((c) => c.tag === 'blacklisted').length;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchTag = tagFilter === 'all' || c.tag === tagFilter;
      if (!matchTag) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    });
  }, [customers, tagFilter, search]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    addCustomer({
      name,
      phone,
      alt_phone: altPhone,
      address,
      gstin,
      tag,
      notes,
    });

    setName('');
    setPhone('');
    setAddress('');
    setShowAddModal(false);
  };

  // Precompute metrics map for all customers to avoid linear scans on every render
  const customerMetricsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        custBookings: typeof bookings;
        totalBilled: number;
        totalPaid: number;
        totalOutstanding: number;
        totalBrokenOrMissing: number;
      }
    >();

    for (const c of customers) {
      const custBookings = bookings.filter(
        (b) => b.customer_id === c.id || b.customer_name === c.name
      );
      const custInvoices = invoices.filter((i) => i.customer_name === c.name);
      const totalBilled = custInvoices.reduce((sum, i) => sum + i.total_amount, 0);
      const totalOutstanding = custInvoices.reduce((sum, i) => sum + i.balance_due, 0);
      const totalPaid = totalBilled - totalOutstanding;

      let totalBrokenOrMissing = 0;
      for (const b of custBookings) {
        for (const i of b.items) {
          totalBrokenOrMissing += (i.returned_broken || 0) + (i.returned_missing || 0);
        }
      }

      map.set(c.id, {
        custBookings,
        totalBilled,
        totalPaid,
        totalOutstanding,
        totalBrokenOrMissing,
      });
    }

    return map;
  }, [customers, bookings, invoices]);

  // Compute metrics for selected customer
  const getCustomerMetrics = useCallback(
    (c: Customer) => {
      const cached = customerMetricsMap.get(c.id);
      if (cached) return cached;

      const custBookings = bookings.filter(
        (b) => b.customer_id === c.id || b.customer_name === c.name
      );
      const custInvoices = invoices.filter((i) => i.customer_name === c.name);
      const totalBilled = custInvoices.reduce((sum, i) => sum + i.total_amount, 0);
      const totalOutstanding = custInvoices.reduce((sum, i) => sum + i.balance_due, 0);
      const totalPaid = totalBilled - totalOutstanding;

      let totalBrokenOrMissing = 0;
      for (const b of custBookings) {
        for (const i of b.items) {
          totalBrokenOrMissing += (i.returned_broken || 0) + (i.returned_missing || 0);
        }
      }

      return {
        custBookings,
        totalBilled,
        totalPaid,
        totalOutstanding,
        totalBrokenOrMissing,
      };
    },
    [customerMetricsMap, bookings, invoices]
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Customer Directory & Profiles
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Caterers, event organizers, and banquet halls with booking history, outstanding ledger, and damage records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by customer name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <button
            onClick={() => setTagFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              tagFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            onClick={() => setTagFilter('caterer')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              tagFilter === 'caterer' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
          >
            Caterers
          </button>
          <button
            onClick={() => setTagFilter('regular')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              tagFilter === 'regular' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
          >
            Regular
          </button>
          <button
            onClick={() => setTagFilter('blacklisted')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              tagFilter === 'blacklisted' ? 'bg-rose-600 text-white' : 'bg-muted/40 text-rose-600 hover:bg-muted'
            }`}
          >
            Blacklisted ({blacklistedCount})
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const metrics = getCustomerMetrics(cust);

          return (
            <div
              key={cust.id}
              onClick={() => setSelectedCustomer(cust)}
              className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    cust.tag === 'caterer'
                      ? 'bg-blue-500/10 text-blue-600'
                      : cust.tag === 'blacklisted'
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {cust.tag}
                  </span>
                  <h3 className="font-bold text-foreground text-sm mt-1">
                    {cust.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Phone className="h-3 w-3" />
                    <span>{cust.phone}</span>
                  </div>
                </div>

                {metrics.totalOutstanding > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-rose-600 uppercase font-bold">Outstanding</span>
                    <div className="font-mono font-bold text-xs text-rose-600">
                      ₹{metrics.totalOutstanding.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground line-clamp-1">
                {cust.address}
              </p>

              {/* Stats Footer */}
              <div className="pt-2 border-t border-border/60 flex justify-between text-[11px] text-muted-foreground">
                <span>{metrics.custBookings.length} Bookings</span>
                <span>Billed: <strong className="text-foreground">₹{metrics.totalBilled.toLocaleString('en-IN')}</strong></span>
                {metrics.totalBrokenOrMissing > 0 && (
                  <span className="text-rose-600 font-semibold">{metrics.totalBrokenOrMissing} Lost/Broken</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5 my-6 text-xs">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{selectedCustomer.name}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">
                    {selectedCustomer.tag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Phone: {selectedCustomer.phone} {selectedCustomer.alt_phone ? `• Alt: ${selectedCustomer.alt_phone}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.address}</p>
                {selectedCustomer.gstin && (
                  <p className="text-[11px] font-mono text-muted-foreground">GSTIN: {selectedCustomer.gstin}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Row */}
            {(() => {
              const m = getCustomerMetrics(selectedCustomer);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Billed</span>
                      <div className="text-base font-bold font-mono text-foreground mt-0.5">
                        ₹{m.totalBilled.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Paid</span>
                      <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">
                        ₹{m.totalPaid.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                      <span className="text-[10px] text-rose-600 uppercase font-semibold">Outstanding Due</span>
                      <div className="text-base font-bold font-mono text-rose-600 mt-0.5">
                        ₹{m.totalOutstanding.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Booking History */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Booking History ({m.custBookings.length})
                    </span>
                    {m.custBookings.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No bookings recorded yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {m.custBookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex justify-between items-center p-2.5 rounded-lg border border-border bg-muted/20"
                          >
                            <div>
                              <span className="font-mono font-bold text-foreground">{b.booking_number}</span>
                              <span className="text-muted-foreground ml-2">({b.event_type} on {b.event_date})</span>
                            </div>
                            <span className="font-semibold text-primary">{b.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedCustomer.notes && (
                    <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                      <span className="font-bold text-[10px] text-muted-foreground uppercase">Notes:</span>
                      <p className="text-foreground mt-0.5">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 my-6 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Add New Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Agarwal Caterers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9811223344"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Alt Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 14, Main Market, Gurugram"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Customer Type</label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs mt-1"
                  >
                    <option value="regular">Regular Host</option>
                    <option value="caterer">Caterer / Decorator</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Notes / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Always pays by cheque on 7th of month"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
