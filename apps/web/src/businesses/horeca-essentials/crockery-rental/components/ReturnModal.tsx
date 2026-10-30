import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../InventoryContext';
import { Booking, Invoice } from '../types';
import {
  RotateCcw,
  CheckCircle2,
  X,
  AlertTriangle,
  Camera,
  PenTool,
  FileText,
  Clock,
  ShieldAlert,
  Percent,
} from 'lucide-react';

interface ReturnModalProps {
  booking: Booking;
  onClose: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ booking, onClose, onViewInvoice }) => {
  const { returnBooking, role, profile } = useInventory();

  // Return counts state per item: Good, Broken, Grade
  const [returnCounts, setReturnCounts] = useState<
    Record<
      string,
      {
        good: number;
        broken: number;
        damageGrade: 'broken' | 'chipped' | 'none';
      }
    >
  >(() => {
    const initial: Record<
      string,
      { good: number; broken: number; damageGrade: 'broken' | 'chipped' | 'none' }
    > = {};
    booking.items.forEach((item) => {
      const dispatched = item.dispatched_quantity || item.quantity;
      initial[item.item_id] = {
        good: dispatched,
        broken: 0,
        damageGrade: 'none',
      };
    });
    return initial;
  });

  const [notes, setNotes] = useState('');
  const [photosAttached, setPhotosAttached] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e293b';
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
      }
    }
  };

  // Compute live damage total & missing counts
  let totalCalculatedDamage = 0;
  let totalMissingPieces = 0;
  let totalBrokenPieces = 0;

  booking.items.forEach((item) => {
    const dispatched = item.dispatched_quantity || item.quantity;
    const counts = returnCounts[item.item_id] || { good: dispatched, broken: 0, damageGrade: 'none' };
    const missing = Math.max(0, dispatched - counts.good - counts.broken);

    totalMissingPieces += missing;
    totalBrokenPieces += counts.broken;

    const unitCost = item.replacement_cost_snapshot;
    const brokenRate = counts.damageGrade === 'chipped' ? unitCost * 0.5 : unitCost;
    totalCalculatedDamage += counts.broken * brokenRate + missing * unitCost;
  });

  // Check late return
  const expectedReturnMs = new Date(booking.expected_return_date || '').getTime();
  const todayStr = new Date().toISOString().split('T')[0] ?? '';
  const todayMs = new Date(todayStr).getTime();
  const isLate = todayMs > expectedReturnMs;
  const extraDays = isLate ? Math.ceil((todayMs - expectedReturnMs) / 86400000) : 0;

  const handleConfirmReturn = () => {
    const signatureData = canvasRef.current?.toDataURL() || 'Staff Verified';
    const returnData = booking.items.map((bi) => ({
      itemId: bi.item_id,
      returnedGood: returnCounts[bi.item_id]?.good ?? (bi.dispatched_quantity || bi.quantity),
      returnedBroken: returnCounts[bi.item_id]?.broken ?? 0,
      damageGrade: returnCounts[bi.item_id]?.damageGrade ?? 'none',
    }));

    const invoice = returnBooking(booking.id, returnData, signatureData, notes);
    setGeneratedInvoice(invoice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Return Inspection & Breakage Counter
              </h2>
              <p className="text-xs text-muted-foreground">
                {booking.booking_number} • {booking.customer_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {generatedInvoice ? (
          /* Post Return Success & Auto Invoice View */
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Return & Inspection Recorded!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Stock balances have been reconciled: Good pieces moved to{' '}
                <strong>{profile.cleaning_stage_enabled ? 'In Cleaning' : 'In Godown'}</strong>, and broken/missing pieces written off to the loss ledger.
              </p>
            </div>

            {/* Generated Invoice Snapshot */}
            <div className="rounded-xl border border-border bg-muted/20 p-5 text-left max-w-md mx-auto space-y-3 text-xs">
              <div className="flex justify-between border-b border-border pb-2 font-bold text-foreground text-sm">
                <span>INVOICE #{generatedInvoice.invoice_number}</span>
                <span className="text-primary font-mono">₹{generatedInvoice.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Rental Days ({generatedInvoice.rent_days} days):</span>
                  <span className="font-medium text-foreground">₹{generatedInvoice.rent_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Charge:</span>
                  <span className="font-medium text-foreground">₹{generatedInvoice.transport_charge}</span>
                </div>
                {generatedInvoice.late_fee > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Late Return Fee:</span>
                    <span>+₹{generatedInvoice.late_fee}</span>
                  </div>
                )}
                {generatedInvoice.damage_amount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Breakage & Missing Charge:</span>
                    <span>+₹{generatedInvoice.damage_amount}</span>
                  </div>
                )}
                {generatedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{generatedInvoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="font-medium text-foreground">₹{generatedInvoice.tax_amount}</span>
                </div>
                <div className="border-t border-border/80 pt-2 flex justify-between font-bold text-sm text-foreground">
                  <span>Advance Paid:</span>
                  <span className="text-emerald-600">-₹{generatedInvoice.advance_paid}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-primary pt-1">
                  <span>Net Balance Due:</span>
                  <span>₹{generatedInvoice.balance_due.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              {onViewInvoice && (
                <button
                  onClick={() => onViewInvoice(generatedInvoice)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  View & Print Full Invoice
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Inspection & Counting Form */
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Late Return Alert Banner if applicable */}
            {isLate && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-700">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold">Overdue Return Detected ({extraDays} day{extraDays > 1 ? 's' : ''} late)</span>
                  <p className="mt-0.5 text-amber-600/90 text-[11px]">
                    Expected return was {booking.expected_return_date}. Daily rent surcharge will automatically be applied to the invoice.
                  </p>
                </div>
              </div>
            )}

            {/* Item-wise Return Counting Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Returned Pieces & Damage Inspection
                </h3>
                <span className="text-xs text-muted-foreground">
                  Missing = Sent − Good − Broken
                </span>
              </div>

              <div className="space-y-3">
                {booking.items.map((item) => {
                  const dispatched = item.dispatched_quantity || item.quantity;
                  const current = returnCounts[item.item_id] || { good: dispatched, broken: 0, damageGrade: 'none' };
                  const missing = Math.max(0, dispatched - current.good - current.broken);
                  const isDamaged = current.broken > 0 || missing > 0;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isDamaged
                          ? 'border-rose-500/30 bg-rose-500/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <span className="font-semibold text-foreground text-sm">
                            {item.item_name}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Total Dispatched: <strong className="text-foreground">{dispatched} pcs</strong>
                            {role !== 'godown' && (
                              <span> • Replacement cost: ₹{item.replacement_cost_snapshot}/pc</span>
                            )}
                          </p>
                        </div>

                        {/* Status preview */}
                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                          <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {current.good} Good
                          </span>
                          {current.broken > 0 && (
                            <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                              {current.broken} Broken
                            </span>
                          )}
                          {missing > 0 && (
                            <span className="text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded">
                              {missing} Missing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inputs Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/50 text-xs">
                        {/* Good input */}
                        <div>
                          <label className="text-[10px] font-semibold text-emerald-600 uppercase">
                            Returned Good
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={dispatched}
                            value={current.good}
                            onChange={(e) => {
                              const val = Math.min(dispatched, Math.max(0, parseInt(e.target.value) || 0));
                              setReturnCounts((prev) => ({
                                ...prev,
                                [item.item_id]: { ...current, good: val },
                              }));
                            }}
                            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>

                        {/* Broken input */}
                        <div>
                          <label className="text-[10px] font-semibold text-amber-600 uppercase">
                            Broken Pieces
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={dispatched - current.good}
                            value={current.broken}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setReturnCounts((prev) => ({
                                ...prev,
                                [item.item_id]: {
                                  ...current,
                                  broken: val,
                                  damageGrade: val > 0 && current.damageGrade === 'none' ? 'broken' : current.damageGrade,
                                },
                              }));
                            }}
                            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>

                        {/* Damage grade */}
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Damage Severity
                          </label>
                          <select
                            value={current.damageGrade}
                            onChange={(e) => {
                              setReturnCounts((prev) => ({
                                ...prev,
                                [item.item_id]: {
                                  ...current,
                                  damageGrade: e.target.value as 'broken' | 'chipped' | 'none',
                                },
                              }));
                            }}
                            disabled={current.broken === 0}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                          >
                            <option value="none">None (0%)</option>
                            <option value="chipped">Chipped/Cracked (50% Cost)</option>
                            <option value="broken">Completely Broken (100% Cost)</option>
                          </select>
                        </div>

                        {/* Calculated Missing */}
                        <div>
                          <label className="text-[10px] font-semibold text-rose-600 uppercase">
                            Auto Missing
                          </label>
                          <div className="w-full rounded-md border border-dashed border-rose-300 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-600 font-mono">
                            {missing} pcs
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Damage Summary Pill (Hidden for Godown staff as per PRD) */}
            {role !== 'godown' && (
              <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-foreground">Estimated Damage & Loss Recovery:</span>
                  <p className="text-muted-foreground mt-0.5">
                    {totalBrokenPieces} broken pieces + {totalMissingPieces} missing pieces
                  </p>
                </div>
                <div className="text-base font-bold font-mono text-rose-600">
                  ₹{totalCalculatedDamage.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* Photo & Inspection Notes */}
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3.5 text-center">
                {photosAttached ? (
                  <div className="flex items-center justify-between text-xs text-emerald-600 bg-emerald-500/10 p-2 rounded-lg">
                    <span className="font-semibold">✓ Broken Pieces & Load Photos Attached</span>
                    <button
                      onClick={() => setPhotosAttached(false)}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPhotosAttached(true)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Attach Photos of Broken Pieces (Inspection Evidence)</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Inspection / Return Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 4 plates found broken in crate #3 during unload. Customer representative present."
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none"
                />
              </div>
            </div>

            {/* Customer Acknowledgement Signature Pad */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <PenTool className="h-3.5 w-3.5 text-primary" />
                  Customer / Returnee Acknowledgement Signature
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="rounded-xl border border-border bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={650}
                  height={100}
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
                Both parties agree on the return, broken, and missing counts.
              </p>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Return & Prepare Invoice</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
