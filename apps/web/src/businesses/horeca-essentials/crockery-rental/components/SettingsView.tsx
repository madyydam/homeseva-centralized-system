import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../InventoryContext';
import { BusinessProfile } from '../types';
import { Settings, ShieldCheck, CheckCircle2, Building2, Save } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, role } = useInventory();
  const [formData, setFormData] = useState<BusinessProfile>(profile);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Business Configuration & Rental Rules
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your firm's profile, GSTIN, UPI details, late-fee multipliers, and cleaning stage workflow.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Business Profile */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
            1. Business Letterhead & Identity
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Firm / Business Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Tagline / Services</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Primary Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Alternate Phone</label>
              <input
                type="text"
                value={formData.alt_phone}
                onChange={(e) => setFormData({ ...formData, alt_phone: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Warehouse / Office Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
              required
            />
          </div>
        </div>

        {/* Banking & UPI Payment Gateway info */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
            2. Invoicing Bank & UPI Details
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">UPI Virtual Payment ID</label>
              <input
                type="text"
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-mono font-bold text-amber-700"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Bank Name & Branch</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Account Number</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Rental Rules & Policies */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
            3. Rental Policies & Stock Buffers
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Return Buffer Days
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.return_buffer_days}
                onChange={(e) =>
                  setFormData({ ...formData, return_buffer_days: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-bold font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Days held for washing before available for re-renting.
              </span>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Late Fee Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                value={formData.late_fee_multiplier}
                onChange={(e) =>
                  setFormData({ ...formData, late_fee_multiplier: parseFloat(e.target.value) || 1.0 })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-bold font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Multiplied with daily rent for overdue days (1.0 = standard).
              </span>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Min Advance Required (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.min_advance_percent}
                onChange={(e) =>
                  setFormData({ ...formData, min_advance_percent: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 font-bold font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground">
              <input
                type="checkbox"
                checked={formData.cleaning_stage_enabled}
                onChange={(e) => setFormData({ ...formData, cleaning_stage_enabled: e.target.checked })}
                className="rounded"
              />
              <span>Enable Mandatory Washing / Cleaning Queue Stage upon Return</span>
            </label>
            <span className="text-[11px] text-muted-foreground ml-5 block mt-0.5">
              When checked, returned pieces first land in "In Cleaning" bucket until godown staff marks them washed.
            </span>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">
              Terms & Conditions (Appears on Invoices & Challans)
            </label>
            <textarea
              rows={3}
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs mt-1 resize-none"
            />
          </div>
        </div>

        {/* Permission Matrix Reference (PRD Section 4) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Security & Role Access Matrix (PRD Section 4)
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border border-border rounded-lg">
              <thead className="bg-muted/40 font-bold text-muted-foreground">
                <tr>
                  <th className="p-2">Capability</th>
                  <th className="p-2 text-center">Owner</th>
                  <th className="p-2 text-center">Manager</th>
                  <th className="p-2 text-center">Counter</th>
                  <th className="p-2 text-center">Godown</th>
                  <th className="p-2 text-center">Accountant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                <tr>
                  <td className="p-2">Manage Items & Rates</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                </tr>
                <tr>
                  <td className="p-2">Create / Edit Bookings</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                </tr>
                <tr>
                  <td className="p-2">Dispatch & Return Counting</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                </tr>
                <tr>
                  <td className="p-2">View Prices & Invoices</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-rose-600 font-bold">Hidden</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                </tr>
                <tr>
                  <td className="p-2">Stock Adjustments & Write-offs</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">Yes</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                  <td className="p-2 text-center text-muted-foreground">Count Only</td>
                  <td className="p-2 text-center text-muted-foreground">No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
