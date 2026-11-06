'use client';

import { useState, useId, useMemo } from 'react';
import {
  X,
  PhoneCall,
  User,
  Building,
  Calendar,
  AlertTriangle,
  Store,
  MapPin,
  Package,
} from 'lucide-react';
import {
  PrintboothLeadItem,
  PrintboothLeadStatusType,
  LocationCategoryType,
  KioskModelType,
} from '../types';
import {
  LOCATION_CATEGORIES,
  KIOSK_MODELS,
  formatDateToDMY,
  findDuplicateLead,
} from './crmUtils';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonthName: string;
  selectedYear: string;
  defaultDate: string; // YYYY-MM-DD
  existingLeads: PrintboothLeadItem[];
  onSave: (lead: Omit<PrintboothLeadItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AddLeadModal({
  isOpen,
  onClose,
  selectedMonthName,
  selectedYear,
  defaultDate,
  existingLeads,
  onSave,
}: AddLeadModalProps) {
  const formId = useId();

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [locationCategory, setLocationCategory] = useState<LocationCategoryType>('Stationery & Xerox');
  const [status, setStatus] = useState<PrintboothLeadStatusType>('Interested');
  const [callCount, setCallCount] = useState<number>(1);
  const [leadDate, setLeadDate] = useState<string>(defaultDate);

  // Converted Fields (ONLY relevant when status is 'Converted')
  const [kioskModel, setKioskModel] = useState<KioskModelType>('PRINTBOOTH™ Compact (Standard)');
  const [installationCity, setInstallationCity] = useState('');
  const [unitsOrdered, setUnitsOrdered] = useState<number>(1);

  // Up to 5 notes
  const [note1, setNote1] = useState('');
  const [note2, setNote2] = useState('');
  const [note3, setNote3] = useState('');
  const [note4, setNote4] = useState('');
  const [note5, setNote5] = useState('');

  // Live duplicate detection
  const duplicateLead = useMemo(() => {
    return findDuplicateLead(phone, existingLeads);
  }, [phone, existingLeads]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    if (duplicateLead) return; // Prevent duplicate lead entry

    const trimmedName = clientName.trim() || "Don't know";
    const notesList: [string, string, string, string, string] = [
      note1.trim(),
      note2.trim(),
      note3.trim(),
      note4.trim(),
      note5.trim(),
    ];

    const isConverted = status === 'Converted';

    onSave({
      clientName: trimmedName,
      phone: phone.trim(),
      shopName: shopName.trim() || undefined,
      locationCategory,
      status,
      callCount,
      notesList,
      leadDate: leadDate || defaultDate,
      kioskModel: isConverted ? kioskModel : undefined,
      installationCity: isConverted ? installationCity.trim() || undefined : undefined,
      unitsOrdered: isConverted ? unitsOrdered || 1 : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-purple-50/70 to-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>+ Add New Kiosk Lead in {selectedMonthName} {selectedYear}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Record merchant inquiry directly into the centralized PRINTBOOTH™ sheet
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-sans">
          {/* Row 1: Merchant Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-client`} className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px] mb-1">
                Merchant / Contact Name (Optional)
              </label>
              <div className="relative">
                <input
                  id={`${formId}-client`}
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-phone`} className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px] mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder=""
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                    duplicateLead
                      ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/30'
                      : 'border-slate-300 focus:border-purple-600 focus:ring-purple-500/20'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Duplicate Phone Warning Alert */}
          {duplicateLead && (
            <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 text-rose-900 animate-in fade-in-down duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-xs text-rose-800">
                    This phone number already exists in CRM!
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Lead: <span className="font-bold">{duplicateLead.clientName}</span> · Status:{' '}
                    <span className="font-bold">{duplicateLead.status}</span>
                    {duplicateLead.shopName ? ` · Shop: ${duplicateLead.shopName}` : ''}
                    {duplicateLead.installationCity ? ` · City: ${duplicateLead.installationCity}` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Row 2: Business/Shop Name & Location Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-shop`} className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px] mb-1">
                Shop / Business Name (Optional)
              </label>
              <input
                id={`${formId}-shop`}
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder=""
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label htmlFor={`${formId}-category`} className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px] mb-1">
                Location Category
              </label>
              <select
                id={`${formId}-category`}
                value={locationCategory}
                onChange={(e) => setLocationCategory(e.target.value as LocationCategoryType)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                {LOCATION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Status & Calls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-status`} className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px] mb-1">
                Status Dropdown
              </label>
              <select
                id={`${formId}-status`}
                value={status}
                onChange={(e) => setStatus(e.target.value as PrintboothLeadStatusType)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Converted">Converted (Machine Sold)</option>
                <option value="Not Picked">Not Picked</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            <div>
              <label htmlFor={`${formId}-calls`} className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px] mb-1">
                Calls (0 to 5)
              </label>
              <select
                id={`${formId}-calls`}
                value={callCount}
                onChange={(e) => setCallCount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value={0}>0 Calls</option>
                <option value={1}>1 Call</option>
                <option value={2}>2 Calls</option>
                <option value={3}>3 Calls</option>
                <option value={4}>4 Calls</option>
                <option value={5}>5 Calls</option>
              </select>
            </div>
          </div>

          {/* Converted Fields: STRICTLY SHOWN ONLY IF STATUS IS CONVERTED */}
          {status === 'Converted' && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3 animate-in fade-in-down duration-150">
              <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-xs">
                <Package className="h-4 w-4 text-purple-700" />
                <span>Converted Machine Sale Details *</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor={`${formId}-model`} className="block font-bold text-purple-950 uppercase tracking-wider text-[10px] mb-1">
                    Kiosk Model Purchased *
                  </label>
                  <select
                    id={`${formId}-model`}
                    value={kioskModel}
                    onChange={(e) => setKioskModel(e.target.value as KioskModelType)}
                    className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {KIOSK_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${formId}-city`} className="block font-bold text-purple-950 uppercase tracking-wider text-[10px] mb-1">
                    Installation City *
                  </label>
                  <input
                    id={`${formId}-city`}
                    type="text"
                    required
                    value={installationCity}
                    onChange={(e) => setInstallationCity(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Lead Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={`${formId}-date`} className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px]">
                Lead Date
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                ({formatDateToDMY(leadDate)})
              </span>
            </div>
            <input
              id={`${formId}-date`}
              type="date"
              value={leadDate}
              onChange={(e) => setLeadDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Row 5: Up to 5 Notes */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px]">
              Initial Notes (Up to 5 in 1 Lead)
            </label>
            <input
              type="text"
              value={note1}
              onChange={(e) => setNote1(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
            />
            <input
              type="text"
              value={note2}
              onChange={(e) => setNote2(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
            />
            <input
              type="text"
              value={note3}
              onChange={(e) => setNote3(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">
              Centralized CRM · Unique Phone Guaranteed
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(duplicateLead)}
                className={`rounded-xl px-5 py-2 font-bold text-white shadow-sm transition ${
                  duplicateLead
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {duplicateLead ? 'Duplicate Exists' : '+ Save Lead'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

