import React, { useState, useMemo, useCallback } from 'react';
import { useInventory } from '../InventoryContext';
import { Item, ItemCategory, RentBasis, StockMovementType, StockMovement } from '../types';
import {
  Package,
  PlusCircle,
  Search,
  Layers,
  Wrench,
  AlertCircle,
  X,
  Plus,
  Minus,
  Edit2,
  History,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Truck,
  ShieldCheck,
  Power,
  ArrowUpDown,
  TrendingDown,
} from 'lucide-react';

export const ItemsView: React.FC = () => {
  const { items, addItem, updateItem, addStockAdjustment, role, ledger } = useInventory();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'rented' | 'cleaning' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'available' | 'owned' | 'rate'>('available');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [adjustType, setAdjustType] = useState<StockMovementType>('PURCHASE');
  const [adjustQty, setAdjustQty] = useState(25);
  const [adjustReason, setAdjustReason] = useState('');
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

  // Add Item form state
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<ItemCategory>('plates');
  const [newPack, setNewPack] = useState(25);
  const [newRent, setNewRent] = useState(3.5);
  const [newBasis, setNewBasis] = useState<RentBasis>('per_day');
  const [newCost, setNewCost] = useState(85);
  const [newQty, setNewQty] = useState(250);

  const categories: { key: ItemCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All Categories' },
    { key: 'plates', label: 'Plates' },
    { key: 'bowls', label: 'Bowls' },
    { key: 'glassware', label: 'Glassware' },
    { key: 'cups', label: 'Cups & Mugs' },
    { key: 'cutlery', label: 'Cutlery' },
    { key: 'serving', label: 'Serving Ware' },
  ];

  // Aggregate Metrics Memoized
  const { totalOwned, totalInGodown, totalOutOnRent, totalInCleaning, totalWrittenOff, totalLossValue, lowStockCount } = useMemo(() => {
    let owned = 0;
    let godown = 0;
    let rented = 0;
    let cleaning = 0;
    let writtenOff = 0;
    let lossVal = 0;
    let lowStock = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      owned += item.total_quantity;
      godown += item.in_godown;
      rented += item.out_on_rent;
      cleaning += item.in_cleaning;
      writtenOff += item.written_off;
      lossVal += item.written_off * item.replacement_cost;
      if (item.in_godown <= (item.low_stock_threshold || 50)) {
        lowStock++;
      }
    }

    return {
      totalOwned: owned,
      totalInGodown: godown,
      totalOutOnRent: rented,
      totalInCleaning: cleaning,
      totalWrittenOff: writtenOff,
      totalLossValue: lossVal,
      lowStockCount: lowStock,
    };
  }, [items]);

  // Filter & Sort Logic Memoized
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
        const matchSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);

        let matchStatus = true;
        if (statusFilter === 'low_stock') {
          matchStatus = item.in_godown <= (item.low_stock_threshold || 50);
        } else if (statusFilter === 'rented') {
          matchStatus = item.out_on_rent > 0;
        } else if (statusFilter === 'cleaning') {
          matchStatus = item.in_cleaning > 0;
        } else if (statusFilter === 'inactive') {
          matchStatus = !item.active;
        }

        return matchCat && matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'available') return b.in_godown - a.in_godown;
        if (sortBy === 'owned') return b.total_quantity - a.total_quantity;
        if (sortBy === 'rate') return b.rent_per_day - a.rent_per_day;
        return 0;
      });
  }, [items, selectedCategory, search, statusFilter, sortBy]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addItem({
      name: newName.trim(),
      category: newCat,
      pack_size: newPack,
      rent_per_day: newRent,
      rent_basis: newBasis,
      replacement_cost: newCost,
      total_quantity: newQty,
      active: true,
      low_stock_threshold: Math.max(10, Math.round(newQty * 0.2)),
    });

    setNewName('');
    setShowAddModal(false);
  };

  const handleApplyAdjustment = () => {
    if (!adjustingItem || adjustQty <= 0 || !adjustReason.trim()) return;

    addStockAdjustment(adjustingItem.id, adjustType, adjustQty, adjustReason.trim());
    setAdjustingItem(null);
    setAdjustReason('');
  };

  const handleToggleActive = (item: Item) => {
    const nextActive = !item.active;
    updateItem({ ...item, active: nextActive });
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Intelligence & Fleet Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total Fleet Owned</span>
            <Layers className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-foreground mt-2">
            {totalOwned.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Across {items.length} crockery SKU lines
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <span>In Godown (Clean)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-2">
            {totalInGodown.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-600/90 mt-0.5 font-medium">
            {Math.round((totalInGodown / (totalOwned || 1)) * 100)}% available for new bookings
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>Out On Rent</span>
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-700 mt-2">
            {totalOutOnRent.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-blue-600/90 mt-0.5 font-medium">
            {Math.round((totalOutOnRent / (totalOwned || 1)) * 100)}% active utilization
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold uppercase tracking-wider">
            <span>Wash Station Queue</span>
            <Droplets className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-700 mt-2">
            {totalInCleaning.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-purple-600/90 mt-0.5 font-medium">
            Awaiting washing & restock
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold uppercase tracking-wider">
            <span>Written Off / Loss</span>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700 mt-2">
            {totalWrittenOff.toLocaleString('en-IN')} pcs
          </div>
          <p className="text-[11px] text-rose-600/90 mt-0.5 font-medium">
            Loss Value: ₹{totalLossValue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              <span>Item Master & Stock Buckets</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Strict quantity tracking: In Godown + Out on Rent + In Cleaning = Total Owned.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search crockery item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl px-2.5 py-1.5 border border-border text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value="available">Available in Godown</option>
                <option value="owned">Total Owned (High to Low)</option>
                <option value="name">Name (A to Z)</option>
                <option value="rate">Rent Rate (High to Low)</option>
              </select>
            </div>

            {/* Add New Item Button */}
            {(role === 'owner' || role === 'manager') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Add Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters: Categories & Stock Status Chips */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-border">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === c.key
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Status Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('low_stock')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'low_stock'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Low Stock ({lowStockCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('rented')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'rented'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20'
              }`}
            >
              On Rent
            </button>
            <button
              onClick={() => setStatusFilter('cleaning')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'cleaning'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20'
              }`}
            >
              In Wash
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
            No crockery items found matching the selected filters.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLowStock = item.in_godown <= (item.low_stock_threshold || 50);
            const godownStacks = Math.floor(item.in_godown / item.pack_size);
            const godownLoose = item.in_godown % item.pack_size;

            // Visual percentage distribution bar
            const total = item.total_quantity || 1;
            const pctGodown = Math.min(100, Math.round((item.in_godown / total) * 100));
            const pctRented = Math.min(100 - pctGodown, Math.round((item.out_on_rent / total) * 100));
            const pctClean = Math.min(100 - pctGodown - pctRented, Math.round((item.in_cleaning / total) * 100));
            const pctLost = Math.max(0, 100 - pctGodown - pctRented - pctClean);

            return (
              <div
                key={item.id}
                className={`group rounded-2xl border bg-card p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between ${
                  !item.active ? 'opacity-65 border-dashed border-border' : 'border-border'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.category}
                        </span>
                        {!item.active && (
                          <span className="rounded-md bg-rose-500/10 text-rose-600 px-1.5 py-0.5 text-[10px] font-bold">
                            Deactivated
                          </span>
                        )}
                        {isLowStock && item.active && (
                          <span className="rounded-md bg-amber-500/10 text-amber-700 px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Low Stock
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-foreground text-sm mt-1.5 leading-snug">
                        {item.name}
                      </h3>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pack Unit: <strong className="text-foreground">{item.pack_size} pcs / stack or crate</strong>
                      </p>
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Movement History / Audit Log */}
                      <button
                        onClick={() => setHistoryItem(item)}
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition"
                        title="View Stock Movement Audit History"
                      >
                        <History className="h-3.5 w-3.5" />
                      </button>

                      {(role === 'owner' || role === 'manager') && (
                        <>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition"
                            title="Edit Item Details & Rates"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustType('PURCHASE');
                              setAdjustQty(item.pack_size * 2);
                            }}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition"
                            title="Stock Adjustment / Purchase"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`rounded-lg border border-border p-1.5 cursor-pointer transition ${
                              item.active ? 'text-slate-400 hover:text-rose-600' : 'text-rose-600 hover:text-emerald-600'
                            }`}
                            title={item.active ? 'Deactivate Item' : 'Reactivate Item'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rates & Replacement Cost (Hidden for Godown staff as per PRD 11) */}
                  {role !== 'godown' && (
                    <div className="flex justify-between items-center rounded-xl bg-muted/30 p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Rent Rate</span>
                        <div className="font-mono font-bold text-foreground">
                          ₹{item.rent_per_day}/{item.rent_basis === 'per_day' ? 'day' : 'event'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Replacement Cost</span>
                        <div className="font-mono font-semibold text-rose-600">
                          ₹{item.replacement_cost}/pc
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4 Stock Buckets */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">In Godown</span>
                        <span className="text-[10px] text-emerald-600 font-mono">
                          {godownStacks}s {godownLoose > 0 ? `+${godownLoose}` : ''}
                        </span>
                      </div>
                      <div className="text-xl font-black font-mono text-emerald-700 mt-1">
                        {item.in_godown}
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-2.5">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">Out On Rent</span>
                      <div className="text-xl font-black font-mono text-blue-700 mt-1">
                        {item.out_on_rent}
                      </div>
                    </div>

                    <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-2.5">
                      <span className="text-[10px] font-bold text-purple-700 uppercase">In Cleaning</span>
                      <div className="text-xl font-black font-mono text-purple-700 mt-1">
                        {item.in_cleaning}
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-2.5">
                      <span className="text-[10px] font-bold text-rose-700 uppercase">Written Off</span>
                      <div className="text-xl font-black font-mono text-rose-700 mt-1">
                        {item.written_off}
                      </div>
                    </div>
                  </div>

                  {/* Stock Distribution Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>Stock Distribution</span>
                      <span>Total Owned: <strong>{item.total_quantity} pcs</strong></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${pctGodown}%` }} className="bg-emerald-500 h-full" title={`In Godown: ${item.in_godown} pcs`} />
                      <div style={{ width: `${pctRented}%` }} className="bg-blue-500 h-full" title={`Out on Rent: ${item.out_on_rent} pcs`} />
                      <div style={{ width: `${pctClean}%` }} className="bg-purple-500 h-full" title={`In Cleaning: ${item.in_cleaning} pcs`} />
                      <div style={{ width: `${pctLost}%` }} className="bg-rose-500 h-full" title={`Written Off: ${item.written_off} pcs`} />
                    </div>
                  </div>
                </div>

                {/* Card Footer Stack Readout */}
                <div className="pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Threshold: <strong className="font-mono text-foreground">{item.low_stock_threshold || 50} pcs</strong>
                  </span>
                  <button
                    onClick={() => setHistoryItem(item)}
                    className="text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    View Movements →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 my-6 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Add New Crockery SKU</h3>
                <p className="text-xs text-muted-foreground">Initialize piece master with pack size and standard rates</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Item Name & Description</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Bone China Gold Rim Dinner Plate (11 inch)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as ItemCategory)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground cursor-pointer"
                  >
                    <option value="plates">Plates</option>
                    <option value="bowls">Bowls</option>
                    <option value="glassware">Glassware</option>
                    <option value="cups">Cups & Mugs</option>
                    <option value="cutlery">Cutlery</option>
                    <option value="serving">Serving Ware</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Pack Size (Per Stack/Crate)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPack}
                    onChange={(e) => setNewPack(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                    required
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-1.5 mt-1.5">
                    {[12, 24, 25, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewPack(preset)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                          newPack === preset ? 'bg-amber-600 text-white font-bold' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Rental Rate (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newRent}
                    onChange={(e) => setNewRent(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Rental Basis</label>
                  <select
                    value={newBasis}
                    onChange={(e) => setNewBasis(e.target.value as RentBasis)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground cursor-pointer"
                  >
                    <option value="per_day">Per Piece Per Day</option>
                    <option value="per_event">Per Piece Per Event (Flat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Replacement Cost (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={newCost}
                    onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Charged if broken or lost</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Initial Owned Stock Pieces</label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Will be added into In Godown</p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition cursor-pointer"
                >
                  Save & Open Stock Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment & Purchase Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 my-6 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Stock Adjustment / Purchase</h3>
                <p className="text-xs text-muted-foreground font-semibold">{adjustingItem.name}</p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Adjustment Movement Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground cursor-pointer"
                >
                  <option value="PURCHASE">+ New Stock Purchase (Adds to Godown)</option>
                  <option value="AUDIT_CORRECTION">Stock Audit Count Correction</option>
                  <option value="ADJUSTMENT">Manual Adjustment (Found / Donated)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Quantity Pieces</label>
                  <span className="text-[11px] text-muted-foreground">
                    Pack: {adjustingItem.pack_size} pcs/stack
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                />

                {/* Quick Stack Multiplier Helpers */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-muted-foreground font-semibold">Quick Stacks:</span>
                  {[1, 2, 4, 10].map((multiplier) => {
                    const count = adjustingItem.pack_size * multiplier;
                    return (
                      <button
                        key={multiplier}
                        type="button"
                        onClick={() => setAdjustQty(count)}
                        className="px-2 py-0.5 rounded-md bg-muted hover:bg-amber-500/10 hover:text-amber-600 text-muted-foreground font-mono text-[10px] font-bold cursor-pointer transition"
                      >
                        +{multiplier} st ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Mandatory Audit Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased 50 extra plates for festival season from manufacturer"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground"
                  required
                />
              </div>

              {/* Projected Balance Preview */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Current In Godown:</span>
                  <span className="font-mono font-bold text-foreground">{adjustingItem.in_godown} pcs</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Adjustment:</span>
                  <span className="font-mono font-bold text-emerald-600">+{adjustQty} pcs</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-bold text-foreground">
                  <span>Projected In Godown:</span>
                  <span className="font-mono text-emerald-600">{adjustingItem.in_godown + adjustQty} pcs</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyAdjustment}
                  disabled={!adjustReason.trim() || adjustQty <= 0}
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  Write to Immutable Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 my-6 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Edit Item Master</h3>
                <p className="text-xs text-muted-foreground font-semibold">{editingItem.name}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateItem(editingItem);
                setEditingItem(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as ItemCategory })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground cursor-pointer"
                  >
                    <option value="plates">Plates</option>
                    <option value="bowls">Bowls</option>
                    <option value="glassware">Glassware</option>
                    <option value="cups">Cups & Mugs</option>
                    <option value="cutlery">Cutlery</option>
                    <option value="serving">Serving Ware</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Pack Size (Per Stack/Crate)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.pack_size}
                    onChange={(e) => setEditingItem({ ...editingItem, pack_size: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Rental Rate (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingItem.rent_per_day}
                    onChange={(e) => setEditingItem({ ...editingItem, rent_per_day: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Rent Basis</label>
                  <select
                    value={editingItem.rent_basis}
                    onChange={(e) => setEditingItem({ ...editingItem, rent_basis: e.target.value as RentBasis })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs mt-1 text-foreground cursor-pointer"
                  >
                    <option value="per_day">Per Piece Per Day</option>
                    <option value="per_event">Per Piece Per Event (Flat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Replacement Cost (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.replacement_cost}
                    onChange={(e) => setEditingItem({ ...editingItem, replacement_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.low_stock_threshold || 50}
                    onChange={(e) => setEditingItem({ ...editingItem, low_stock_threshold: parseInt(e.target.value) || 10 })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold mt-1 text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Stock Movement History Modal (Audit Trail) */}
      {historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 my-6 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-foreground">Stock Ledger Audit Trail</h3>
                  <p className="text-xs text-muted-foreground font-semibold">{historyItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Buckets Summary */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Godown</span>
                <div className="font-mono font-bold text-emerald-800 text-base">{historyItem.in_godown}</div>
              </div>
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2 text-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase">On Rent</span>
                <div className="font-mono font-bold text-blue-800 text-base">{historyItem.out_on_rent}</div>
              </div>
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-2 text-center">
                <span className="text-[10px] font-bold text-purple-700 uppercase">Cleaning</span>
                <div className="font-mono font-bold text-purple-800 text-base">{historyItem.in_cleaning}</div>
              </div>
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Written Off</span>
                <div className="font-mono font-bold text-rose-800 text-base">{historyItem.written_off}</div>
              </div>
            </div>

            {/* Filtered Movements Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recorded Movements
              </span>
              <div className="max-h-[50vh] overflow-y-auto border border-border rounded-xl">
                {ledger.filter((entry) => entry.item_id === historyItem.id).length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No movement records found for this item.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase sticky top-0">
                      <tr>
                        <th className="p-2.5">Date & Time</th>
                        <th className="p-2.5">Movement Type</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5">Bucket Route</th>
                        <th className="p-2.5">Reference / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {ledger
                        .filter((entry) => entry.item_id === historyItem.id)
                        .map((entry) => (
                          <tr key={entry.id} className="hover:bg-muted/30">
                            <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                              {new Date(entry.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}{' '}
                              {new Date(entry.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  entry.type === 'DISPATCH'
                                    ? 'bg-blue-500/10 text-blue-600'
                                    : entry.type === 'RETURN_GOOD'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : entry.type === 'RETURN_BROKEN' || entry.type === 'RETURN_MISSING'
                                    ? 'bg-rose-500/10 text-rose-600'
                                    : entry.type === 'WASH_DONE'
                                    ? 'bg-purple-500/10 text-purple-600'
                                    : 'bg-cyan-500/10 text-cyan-600'
                                }`}
                              >
                                {entry.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold">
                              {entry.quantity} pcs
                            </td>
                            <td className="p-2.5 text-[11px] text-muted-foreground">
                              {(entry.bucket_from || 'godown').replace('_', ' ')} → {(entry.bucket_to || 'godown').replace('_', ' ')}
                            </td>
                            <td className="p-2.5 text-foreground max-w-xs truncate">
                              {entry.booking_number ? (
                                <span className="font-mono font-bold text-amber-600 mr-1.5">
                                  #{entry.booking_number}
                                </span>
                              ) : null}
                              {entry.reason}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
