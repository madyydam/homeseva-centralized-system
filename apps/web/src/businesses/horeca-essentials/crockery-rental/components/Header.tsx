import React, { useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { UtensilsCrossed } from 'lucide-react';

interface HeaderProps {
  onNewBooking?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ setActiveTab }) => {
  const { bookings } = useInventory();

  const { overdueCount, todayDispatches, todayReturns } = useMemo(() => {
    let overdue = 0;
    let dispatches = 0;
    let returns = 0;
    for (const b of bookings) {
      if (b.status === 'Overdue') overdue++;
      else if (b.status === 'Confirmed') dispatches++;
      else if (b.status === 'Dispatched') returns++;
    }
    return { overdueCount: overdue, todayDispatches: dispatches, todayReturns: returns };
  }, [bookings]);

  return (
    <header className="no-print print:hidden sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-[1600px] h-13 items-center justify-between px-4 sm:px-6">
        {/* Left: Minimal Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900">
              Crockery Rentals
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold leading-tight">
              Banquet Tableware & Buffet Hire Operations
            </p>
          </div>
        </div>

        {/* Right: Live Status Indicators Only */}
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            {todayDispatches} To Dispatch
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {todayReturns} To Return
          </span>
          {overdueCount > 0 && (
            <span
              onClick={() => setActiveTab('bookings')}
              className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-rose-100 transition shadow-2xs"
              title="Click to view overdue bookings"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
              {overdueCount} Overdue!
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
