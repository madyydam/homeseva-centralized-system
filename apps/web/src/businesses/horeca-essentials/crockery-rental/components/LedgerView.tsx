import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { StockMovementType } from '../types';
import {
  FileSpreadsheet,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

const MOVEMENT_TYPES: { key: string; label: string }[] = [
  { key: 'all', label: 'All Movements' },
  { key: 'DISPATCH', label: 'Dispatches' },
  { key: 'RETURN_GOOD', label: 'Returns (Good)' },
  { key: 'RETURN_BROKEN', label: 'Returns (Broken)' },
  { key: 'RETURN_MISSING', label: 'Returns (Missing)' },
  { key: 'WASH_DONE', label: 'Washed / Restocked' },
  { key: 'PURCHASE', label: 'Purchases' },
  { key: 'ADJUSTMENT', label: 'Adjustments' },
];

export const LedgerView: React.FC = () => {
  const { ledger, items } = useInventory();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredLedger = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ledger.filter((entry) => {
      const matchType = selectedType === 'all' || entry.type === selectedType;
      if (!matchType) return false;
      const matchItem = selectedItemId === 'all' || entry.item_id === selectedItemId;
      if (!matchItem) return false;
      if (!q) return true;
      return (
        entry.item_name.toLowerCase().includes(q) ||
        (entry.booking_number && entry.booking_number.toLowerCase().includes(q)) ||
        entry.reason.toLowerCase().includes(q) ||
        entry.user.toLowerCase().includes(q)
      );
    });
  }, [ledger, selectedType, selectedItemId, search]);

  const getTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case 'DISPATCH':
        return <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">DISPATCH</span>;
      case 'RETURN_GOOD':
        return <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">RETURN (GOOD)</span>;
      case 'RETURN_BROKEN':
        return <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold">BREAKAGE</span>;
      case 'RETURN_MISSING':
        return <span className="bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">MISSING</span>;
      case 'WASH_DONE':
        return <span className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded text-[10px] font-bold">WASHED</span>;
      case 'PURCHASE':
        return <span className="bg-cyan-500/10 text-cyan-600 px-2 py-0.5 rounded text-[10px] font-bold">PURCHASE</span>;
      default:
        return <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-foreground">
                Immutable Stock Ledger (Audit Trail)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Append-only movement log. Every piece moving between Godown, Rented, Cleaning, and Written-off is permanently recorded with reason, booking, and author.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
            >
              <option value="all">-- Filter By Item --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search booking #, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Movement Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-border">
          {MOVEMENT_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedType === t.key
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Item Name</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5 text-center">Quantity</th>
              <th className="p-3.5">Bucket Flow</th>
              <th className="p-3.5">Booking Ref</th>
              <th className="p-3.5">User / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y border-border font-medium">
            {filteredLedger.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No stock ledger entries found.
                </td>
              </tr>
            ) : (
              filteredLedger.map((entry) => {
                const dateObj = new Date(entry.created_at);
                const formattedDate = isNaN(dateObj.getTime())
                  ? '—'
                  : dateObj.toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                return (
                  <tr key={entry.id} className="hover:bg-muted/20 transition">
                    <td className="p-3.5 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="p-3.5 font-bold text-foreground">
                      {entry.item_name}
                    </td>
                    <td className="p-3.5">{getTypeBadge(entry.type)}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-sm text-foreground">
                    {entry.quantity} pcs
                  </td>
                  <td className="p-3.5 text-xs">
                    {entry.bucket_from || entry.bucket_to ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {entry.bucket_from && <span className="font-semibold text-foreground">{entry.bucket_from}</span>}
                        {entry.bucket_from && entry.bucket_to && <ArrowRight className="h-3 w-3" />}
                        {entry.bucket_to && <span className="font-semibold text-emerald-600">{entry.bucket_to}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-xs font-semibold text-foreground">
                    {entry.booking_number || '—'}
                  </td>
                    <td className="p-3.5 text-xs">
                      <span className="font-semibold text-foreground">{entry.user}:</span>{' '}
                      <span className="text-muted-foreground">{entry.reason}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
