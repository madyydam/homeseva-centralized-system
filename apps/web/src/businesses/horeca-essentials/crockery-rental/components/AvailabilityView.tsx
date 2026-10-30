import React, { useState, useMemo, useCallback } from 'react';
import { useInventory } from '../InventoryContext';
import { ItemCategory } from '../types';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from 'lucide-react';

interface AvailabilityViewProps {
  onBookItem: (itemId: string) => void;
}

export const AvailabilityView: React.FC<AvailabilityViewProps> = ({ onBookItem }) => {
  const { items, bookings, getAvailableStock, profile } = useInventory();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(threeDaysLater);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Filter items memoized
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch = !q || item.name.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchSearch && matchCat && item.active;
    });
  }, [items, search, selectedCategory]);

  // Find colliding bookings for an item during the date range memoized
  const getCollidingBookings = useCallback((itemId: string) => {
    const reqStart = new Date(startDate || '').getTime();
    const reqEnd = new Date(endDate || '').getTime();
    if (isNaN(reqStart) || isNaN(reqEnd)) return [];
    const bufferMs = (profile.return_buffer_days || 1) * 86400000;

    return bookings.filter((b) => {
      if (!['Confirmed', 'Dispatched', 'Overdue'].includes(b.status)) return false;
      const bStart = new Date(b.delivery_date || '').getTime();
      const bEnd = new Date(b.expected_return_date || '').getTime() + bufferMs;

      if (bStart <= reqEnd && bEnd >= reqStart) {
        return b.items.some((i) => i.item_id === itemId);
      }
      return false;
    });
  }, [startDate, endDate, bookings, profile.return_buffer_days]);

  const categories: { key: ItemCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All Items' },
    { key: 'plates', label: 'Plates' },
    { key: 'bowls', label: 'Bowls' },
    { key: 'glassware', label: 'Glassware' },
    { key: 'cups', label: 'Cups & Mugs' },
    { key: 'cutlery', label: 'Cutlery' },
    { key: 'serving', label: 'Buffet & Serving' },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Selector Bar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              Stock Availability Calendar
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accurate live calculation across overlapping bookings, return buffers, and cleaning buckets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground font-mono"
              />
            </div>
          </div>
        </div>

        {/* Search & Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedCategory === c.key
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search crockery item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Item Availability Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const available = getAvailableStock(item.id, startDate || '', endDate || '');
          const reserved = item.total_quantity - available;
          const percentageFree = item.total_quantity > 0 ? Math.round((available / item.total_quantity) * 100) : 0;
          const isExpanded = expandedItemId === item.id;
          const collisions = isExpanded ? getCollidingBookings(item.id) : [];

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 transition-all shadow-xs ${
                available === 0
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : percentageFree < 25
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-foreground text-sm mt-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pack: {item.pack_size} pcs/stack • Rate: ₹{item.rent_per_day}/{item.rent_basis === 'per_day' ? 'day' : 'event'}
                  </p>
                </div>

                <div className="text-right">
                  <div className={`text-xl font-black font-mono ${
                    available === 0 ? 'text-rose-600' : percentageFree < 25 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {available}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Pieces Free
                  </span>
                </div>
              </div>

              {/* Availability Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Stock Commitment</span>
                  <span className="font-bold text-foreground">{100 - percentageFree}% Reserved</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      available === 0
                        ? 'bg-rose-600'
                        : percentageFree < 25
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, 100 - percentageFree)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span>Owned: <strong>{item.total_quantity}</strong></span>
                  <span>Committed: <strong>{reserved}</strong></span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
                >
                  <span>{reserved > 0 ? `${collisions.length || 'View'} Bookings` : 'No Reserves'}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => onBookItem(item.id)}
                  className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Book Item</span>
                </button>
              </div>

              {/* Collapsible Reserved Bookings Breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border text-xs space-y-2 bg-muted/30 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Overlapping Bookings on these dates:
                  </span>
                  {collisions.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      No active bookings hold this item between {startDate} and {endDate}.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {collisions.map((b) => {
                        const bi = b.items.find((i) => i.item_id === item.id);
                        return (
                          <div
                            key={b.id}
                            className="flex justify-between items-center text-[11px] bg-background p-1.5 rounded-lg border border-border"
                          >
                            <div>
                              <span className="font-semibold text-foreground">{b.customer_name}</span>
                              <p className="text-[10px] text-muted-foreground">
                                {b.delivery_date} to {b.expected_return_date} ({b.status})
                              </p>
                            </div>
                            <span className="font-mono font-bold text-amber-600">
                              {bi?.quantity || 0} pcs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
