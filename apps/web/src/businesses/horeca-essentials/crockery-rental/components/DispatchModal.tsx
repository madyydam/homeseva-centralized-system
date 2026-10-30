import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../InventoryContext';
import { Booking } from '../types';
import {
  Truck,
  CheckCircle2,
  X,
  AlertTriangle,
  Camera,
  PenTool,
  Printer,
  RotateCcw,
  Plus,
  Minus,
  FileText,
  Calendar,
} from 'lucide-react';

interface DispatchModalProps {
  booking: Booking;
  onClose: () => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({ booking, onClose }) => {
  const { dispatchBooking, items: masterItems, role, profile } = useInventory();

  // Quantities state per item
  const [counts, setCounts] = useState<Record<string, { stacks: number; loose: number; total: number }>>(() => {
    const initial: Record<string, { stacks: number; loose: number; total: number }> = {};
    booking.items.forEach((item) => {
      const pack = item.pack_size || 25;
      const stacks = Math.floor(item.quantity / pack);
      const loose = item.quantity % pack;
      initial[item.item_id] = {
        stacks,
        loose,
        total: item.quantity,
      };
    });
    return initial;
  });

  const [driverName, setDriverName] = useState('Manoj (Godown Incharge)');
  const [vehicleDetails, setVehicleDetails] = useState('Tata Ace (HR 26 CB 4120)');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  // HTML5 Canvas for Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvasRectRef.current = rect;
    const clientX = 'touches' in e ? (e.touches[0] ? e.touches[0].clientX : 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvasRectRef.current || canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0] ? e.touches[0].clientX : 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRectRef.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setSignatureDataUrl('');
      }
    }
  };

  const updateItemCount = (itemId: string, packSize: number, newTotal: number) => {
    const validTotal = Math.max(0, newTotal);
    const stacks = Math.floor(validTotal / packSize);
    const loose = validTotal % packSize;
    setCounts((prev) => ({
      ...prev,
      [itemId]: { stacks, loose, total: validTotal },
    }));
  };

  const handleConfirmDispatch = () => {
    const signature = canvasRef.current?.toDataURL() || '';
    setSignatureDataUrl(signature);

    const dispatches = booking.items.map((bi) => ({
      itemId: bi.item_id,
      quantity: counts[bi.item_id]?.total || bi.quantity,
    }));

    dispatchBooking(booking.id, dispatches, vehicleDetails, signature, driverName);
    setConfirmed(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalLoadedPieces = booking.items.reduce(
    (sum, i) => sum + (counts[i.item_id]?.total || i.quantity),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
        {/* Top Header Bar (HIDDEN ON PRINT) */}
        <div className="no-print print:hidden flex items-center justify-between border-b border-border bg-muted/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {confirmed ? 'Dispatch Confirmed & Delivery Challan' : 'Dispatch & Loading Counter'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {booking.booking_number} • {booking.customer_name} ({booking.event_type})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmed ? (
          /* CONFIRMED VIEW WITH PROPER OFFICIAL COMMERCIAL DELIVERY CHALLAN */
          <div className="space-y-6">
            {/* Action Bar on Screen */}
            <div className="no-print print:hidden bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-sm">
                  Dispatch Confirmed! Stock moved to "Out on Rent" and recorded to Stock Ledger.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition active:scale-95"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Official Delivery Challan</span>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
                >
                  Done
                </button>
              </div>
            </div>

            {/* FULL COMMERCIAL DELIVERY CHALLAN / GATE PASS */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <div
                id="printable-document"
                className="p-8 sm:p-10 space-y-6 bg-white text-slate-900 border border-slate-300 rounded-xl"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Firm Letterhead */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-5">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                      {profile.name}
                    </h1>
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">
                      {profile.tagline}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 max-w-md">
                      {profile.address}
                    </p>
                    <div className="flex flex-wrap gap-x-4 text-xs text-slate-700 font-medium mt-1">
                      <span>Phone: <strong className="text-slate-900">{profile.phone}</strong></span>
                      <span>GSTIN: <strong className="text-slate-900 font-mono">{profile.gstin}</strong></span>
                    </div>
                  </div>

                  <div className="sm:text-right border-l-2 sm:border-l-0 border-slate-900 pl-4 sm:pl-0">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-sm mb-1">
                      DELIVERY CHALLAN & GATE PASS
                    </span>
                    <div className="text-2xl font-black text-slate-900 font-mono">
                      #CHL-{booking.booking_number.replace('BKG-', '')}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1 space-y-0.5">
                      <div>Dispatch Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                      <div>Booking Ref: <strong className="text-slate-900 font-mono">#{booking.booking_number}</strong></div>
                      <div>Event: <strong className="text-slate-900">{booking.event_type}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Delivery Logistics & Consignee Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-300 bg-slate-50/70 p-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                      CONSIGNEE / DELIVERED TO:
                    </span>
                    <h2 className="text-base font-bold text-slate-900 pt-1">
                      {booking.customer_name}
                    </h2>
                    <p className="text-slate-600">{booking.customer_address}</p>
                    <p className="text-slate-800 font-medium">
                      Customer Phone: <strong className="font-mono">{booking.customer_phone}</strong>
                    </p>
                  </div>

                  <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                      DELIVERY VENUE & VEHICLE DETAILS:
                    </span>
                    <div className="space-y-1 pt-1 text-slate-700">
                      <div>Venue Name: <strong className="text-slate-900">{booking.venue_name}</strong></div>
                      <div>Venue Address: <span className="text-slate-600">{booking.venue_address}</span></div>
                      <div>Driver / Delivered By: <strong className="text-slate-900">{driverName}</strong></div>
                      <div>Vehicle Reg No: <strong className="text-slate-900 font-mono">{vehicleDetails}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Loaded Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">#</th>
                        <th className="py-2.5 px-3 border-r border-slate-300">Item Description & Specification</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Category</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Pack Size</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Stacks / Crates</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Loose Pieces</th>
                        <th className="py-2.5 px-3 text-right w-32 font-black">Total Dispatched</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {booking.items.map((i, idx) => {
                        const cnt = counts[i.item_id] || { stacks: 0, loose: 0, total: i.quantity };
                        return (
                          <tr key={i.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                              {i.item_name}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 uppercase text-[10px] border-r border-slate-200">
                              {i.category}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200">
                              {i.pack_size} pcs/pack
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold border-r border-slate-200">
                              {cnt.stacks} stacks
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200">
                              {cnt.loose} pcs
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-sm">
                              {cnt.total} pcs
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <tr>
                        <td colSpan={6} className="py-2.5 px-4 text-right uppercase text-xs">
                          Grand Total Dispatched Pieces:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-base font-black text-slate-900">
                          {totalLoadedPieces} pcs
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Receiver Declaration Undertaking */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-[11px] text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800 uppercase block">
                    RECEIVER'S VERIFICATION UNDERTAKING:
                  </span>
                  <p className="leading-relaxed">
                    Received all the crockery, glassware, and catering pieces listed above in full count, clean, and undamaged condition. All pieces have been physically counted at the delivery vehicle before unloading. Any shortage, chipping, or breakage at return inspection will be debited to the customer's account as per the replacement tariff schedule.
                  </p>
                </div>

                {/* Signatures Block */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300">
                  <div className="text-center pt-8 border-t border-slate-300 text-xs text-slate-700">
                    <strong className="block text-slate-900">{driverName}</strong>
                    <span>Prepared & Loaded By</span>
                  </div>

                  <div className="text-center pt-8 border-t border-slate-300 text-xs text-slate-700">
                    <strong className="block text-slate-900">{vehicleDetails}</strong>
                    <span>Vehicle Transporter Sign</span>
                  </div>

                  <div className="text-center border-t border-slate-300 text-xs text-slate-900 font-bold pt-2">
                    {signatureDataUrl ? (
                      <div className="h-14 flex items-center justify-center">
                        <img src={signatureDataUrl} alt="Signature" className="max-h-12 max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-10" />
                    )}
                    <span>Receiver's Signature & Date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* COUNTING FORM ON SCREEN */
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-muted/20 p-4 text-xs">
              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Destination Venue</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{booking.venue_name}</p>
                <p className="text-muted-foreground text-xs">{booking.venue_address}</p>
              </div>
              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Contact Person</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{booking.contact_person || booking.customer_name}</p>
                <p className="text-muted-foreground text-xs font-mono">{booking.customer_phone}</p>
              </div>
            </div>

            {/* Fast Touch Items Counter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Verify & Count Loaded Pieces
                </h3>
                <span className="text-xs text-muted-foreground">
                  Tap fast counters or enter stacks + loose pieces
                </span>
              </div>

              <div className="space-y-3">
                {booking.items.map((item) => {
                  const master = masterItems.find((m) => m.id === item.item_id);
                  const inGodown = master?.in_godown || 0;
                  const packSize = item.pack_size || 25;
                  const current = counts[item.item_id] || { stacks: 0, loose: 0, total: item.quantity };
                  const isMatching = current.total === item.quantity;
                  const isExceeding = current.total > item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">
                              {item.item_name}
                            </span>
                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              Pack: {packSize} pcs/stack
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Booked: <strong>{item.quantity}</strong> | Clean in Godown: <strong>{inGodown}</strong>
                          </p>
                        </div>

                        {/* Total Count Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold font-mono px-3 py-1 rounded-lg border ${
                            isMatching
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : isExceeding
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {current.total} pcs
                          </span>
                        </div>
                      </div>

                      {/* Stacks + Loose Calculator & Quick Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                              Stacks ({packSize}s)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={current.stacks}
                              onChange={(e) => {
                                const st = parseInt(e.target.value) || 0;
                                updateItemCount(item.item_id, packSize, st * packSize + current.loose);
                              }}
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div className="text-muted-foreground font-bold pt-4">+</div>
                          <div className="flex-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                              Loose Pcs
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={current.loose}
                              onChange={(e) => {
                                const ls = parseInt(e.target.value) || 0;
                                updateItemCount(item.item_id, packSize, current.stacks * packSize + ls);
                              }}
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-3 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => updateItemCount(item.item_id, packSize, current.total - 1)}
                            className="h-9 w-9 rounded-md border border-border bg-muted/40 font-bold hover:bg-muted active:scale-95"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemCount(item.item_id, packSize, current.total + 1)}
                            className="h-9 w-9 rounded-md border border-border bg-muted/40 font-bold hover:bg-muted active:scale-95"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemCount(item.item_id, packSize, current.total + 5)}
                            className="h-9 px-2.5 rounded-md border border-border bg-muted/40 font-bold text-xs hover:bg-muted active:scale-95"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemCount(item.item_id, packSize, current.total + packSize)}
                            className="h-9 px-3 rounded-md bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 active:scale-95"
                            title={`Add 1 full stack of ${packSize}`}
                          >
                            +{packSize}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Transport & Loading Evidence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Driver / Delivered By
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Vehicle Details
                </label>
                <input
                  type="text"
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium"
                />
              </div>
            </div>

            {/* Photo Loading Attachment */}
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
              {photoAdded ? (
                <div className="flex items-center justify-between text-xs text-emerald-600 bg-emerald-500/10 p-2.5 rounded-lg">
                  <span className="font-semibold">✓ 2 Crate Loading Photos Attached to Challan</span>
                  <button
                    onClick={() => setPhotoAdded(false)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhotoAdded(true)}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Camera className="h-4 w-4" />
                  <span>Attach Loaded Crates Photo Evidence (Godown Proof)</span>
                </button>
              )}
            </div>

            {/* Customer Digital Signature Pad */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <PenTool className="h-3.5 w-3.5 text-primary" />
                  Customer / Receiver Signature on Glass (Will appear on printed Challan)
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="rounded-xl border border-border bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={750}
                  height={110}
                  className="w-full touch-none cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Receiver acknowledges the loaded piece count above.
              </p>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95"
              >
                <Truck className="h-4 w-4" />
                <span>Confirm Dispatch & Generate Official Challan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
