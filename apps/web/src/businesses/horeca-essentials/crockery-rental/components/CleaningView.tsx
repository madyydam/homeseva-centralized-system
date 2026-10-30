import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Droplets, CheckCircle2, Layers, ArrowRight, Sparkles } from 'lucide-react';

export const CleaningView: React.FC = () => {
  const { items, markWashed, role } = useInventory();
  const [washQty, setWashQty] = useState<Record<string, number>>({});

  const { itemsInCleaning, totalInCleaning } = useMemo(() => {
    let total = 0;
    const cleaningList = items.filter((i) => {
      if (i.in_cleaning > 0) {
        total += i.in_cleaning;
        return true;
      }
      return false;
    });
    return { itemsInCleaning: cleaningList, totalInCleaning: total };
  }, [items]);

  const handleWash = (itemId: string, maxQty: number) => {
    const qty = washQty[itemId] || maxQty;
    markWashed(itemId, qty);
    setWashQty((prev) => ({ ...prev, [itemId]: 0 }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-purple-600" />
          <h2 className="text-base font-bold text-foreground">
            Washing, Sanitization & Restocking Station
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Returned items are held in the cleaning queue before being made available for new bookings. Once washed, click to move them back into <strong>In Godown</strong>.
        </p>
      </div>

      {/* Summary KPI */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-purple-700">
            Current Washing Queue
          </span>
          <div className="text-2xl font-black font-mono text-purple-800 mt-1">
            {totalInCleaning} pieces waiting to be cleaned
          </div>
          <p className="text-xs text-purple-600/90 mt-0.5">
            Across {itemsInCleaning.length} different crockery items.
          </p>
        </div>

        {itemsInCleaning.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Mark ALL dirty items as washed and restocked?')) {
                itemsInCleaning.forEach((item) => markWashed(item.id, item.in_cleaning));
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Mark All Cleaned ({totalInCleaning} pcs)</span>
          </button>
        )}
      </div>

      {/* Items in Cleaning List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemsInCleaning.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
            All returned crockery pieces have been washed, dried, and restocked in the warehouse racks!
          </div>
        ) : (
          itemsInCleaning.map((item) => {
            const currentQty: number = washQty[item.id] !== undefined ? (washQty[item.id] ?? item.in_cleaning) : item.in_cleaning;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 hover:border-purple-500/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-foreground text-sm mt-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pack Size: {item.pack_size} pcs/stack • Godown: {item.in_godown}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-purple-600">
                      {item.in_cleaning}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      To Wash
                    </span>
                  </div>
                </div>

                {/* Wash Input & Fast Action Buttons */}
                <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Washed Quantity:</span>
                    <input
                      type="number"
                      min="1"
                      max={item.in_cleaning}
                      value={currentQty}
                      onChange={(e) =>
                        setWashQty({
                          ...washQty,
                          [item.id]: Math.min(item.in_cleaning, Math.max(1, parseInt(e.target.value) || 0)),
                        })
                      }
                      className="w-20 rounded-md border border-input bg-background px-2 py-1 text-xs font-mono font-bold text-right"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleWash(item.id, currentQty)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Restock to Godown</span>
                    </button>
                    <button
                      onClick={() => handleWash(item.id, item.in_cleaning)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                      title="Wash entire batch"
                    >
                      All
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
