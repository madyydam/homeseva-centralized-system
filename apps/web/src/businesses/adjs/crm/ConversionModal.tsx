'use client';

import { useState } from 'react';
import { X, CheckCircle2, Package, MapPin } from 'lucide-react';
import { PrintboothLeadItem, KioskModelType } from '../types';
import { KIOSK_MODELS } from './crmUtils';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: PrintboothLeadItem | null;
  onConfirm: (leadId: string, kioskModel: KioskModelType, installationCity: string, unitsOrdered: number) => void;
}

export function ConversionModal({
  isOpen,
  onClose,
  lead,
  onConfirm,
}: ConversionModalProps) {
  const [kioskModel, setKioskModel] = useState<KioskModelType>('PRINTBOOTH™ Compact (Standard)');
  const [installationCity, setInstallationCity] = useState('');
  const [unitsOrdered, setUnitsOrdered] = useState(1);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installationCity.trim()) return;
    onConfirm(lead.id, kioskModel, installationCity.trim(), unitsOrdered || 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-purple-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-700" />
            <h3 className="text-sm font-extrabold text-purple-950">Confirm Kiosk Sale (Converted)</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-slate-500 font-medium text-[11px]">Merchant / Prospect:</p>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">{lead.clientName}</p>
            <p className="text-xs text-slate-600 font-mono mt-0.5">{lead.phone}</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Kiosk Model Purchased *
            </label>
            <select
              value={kioskModel}
              onChange={(e) => setKioskModel(e.target.value as KioskModelType)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {KIOSK_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Installation City *
              </label>
              <input
                type="text"
                required
                value={installationCity}
                onChange={(e) => setInstallationCity(e.target.value)}
                placeholder=""
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Units Ordered
              </label>
              <input
                type="number"
                min={1}
                value={unitsOrdered}
                onChange={(e) => setUnitsOrdered(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 font-bold text-white shadow-sm"
            >
              Confirm Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

