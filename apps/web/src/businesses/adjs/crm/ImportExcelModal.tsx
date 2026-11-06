'use client';

import { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PrintboothLeadItem, PrintboothLeadStatusType } from '../types';
import { ParsedImportLead, findDuplicateLead, normalizePhoneNumber } from './crmUtils';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLeads: PrintboothLeadItem[];
  defaultMonth: string;
  defaultYear: string;
  onImportLeads: (leads: Omit<PrintboothLeadItem, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

export function ImportExcelModal({
  isOpen,
  onClose,
  existingLeads,
  defaultMonth,
  defaultYear,
  onImportLeads,
}: ImportExcelModalProps) {
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<ParsedImportLead[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleParse = () => {
    setErrorMsg('');
    if (!csvText.trim()) {
      setErrorMsg('Please paste CSV or tabular content to import.');
      return;
    }

    const lines = csvText.trim().split('\n');
    const results: ParsedImportLead[] = [];
    let dupes = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      // Skip possible header
      if (i === 0 && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('name'))) {
        continue;
      }

      const cols = line.split(/[,\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const name = cols[0] || "Don't know";
      const phone = cols[1] || '';
      const shopName = cols[2] || undefined;
      const rawStatus = cols[3] || 'Interested';
      const date = cols[4] || `${defaultYear}-${defaultMonth}-01`;
      const note = cols[5] || '';

      const validStatus: PrintboothLeadStatusType =
        rawStatus.toLowerCase().includes('convert') || rawStatus.toLowerCase().includes('sold')
          ? 'Converted'
          : rawStatus.toLowerCase().includes('follow')
          ? 'Follow-up'
          : rawStatus.toLowerCase().includes('not pick')
          ? 'Not Picked'
          : rawStatus.toLowerCase().includes('not inter')
          ? 'Not Interested'
          : 'Interested';

      // Check duplicates against existing DB
      const isDuplicate = findDuplicateLead(phone, existingLeads);
      if (isDuplicate) {
        dupes++;
        continue;
      }

      results.push({
        clientName: name,
        phone,
        shopName,
        locationCategory: 'Stationery & Xerox',
        status: validStatus,
        callCount: 1,
        notesList: [note, '', '', '', ''],
        leadDate: date,
      });
    }

    setParsed(results);
    setDuplicatesCount(dupes);
  };

  const handleConfirmImport = () => {
    if (parsed.length === 0) return;
    onImportLeads(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 max-h-[90vh] flex flex-col font-sans">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-purple-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-700" />
            <div>
              <h3 className="text-base font-extrabold text-purple-950">
                Import Kiosk Leads from Excel / CSV
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Paste tabular data: Name, Phone, Shop Name, Status, Date, Notes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px] mb-1">
              Paste CSV / Tab-Separated Data
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleParse}
              type="button"
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 font-bold text-white shadow-xs transition"
            >
              Parse Data & Check Duplicates
            </button>

            {parsed.length > 0 && (
              <span className="font-bold text-emerald-700">
                ✓ {parsed.length} valid unique leads ready to import
              </span>
            )}
          </div>

          {duplicatesCount > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Skipped <span className="font-bold">{duplicatesCount}</span> duplicate phone numbers already existing in CRM.
              </span>
            </div>
          )}

          {errorMsg && (
            <p className="font-bold text-rose-600">{errorMsg}</p>
          )}

          {parsed.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Shop</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsed.slice(0, 10).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800">{p.clientName}</td>
                      <td className="p-2 font-mono">{p.phone}</td>
                      <td className="p-2">{p.shopName || '—'}</td>
                      <td className="p-2">
                        <span className="rounded bg-purple-50 text-purple-800 px-1.5 py-0.5 text-[10px] font-bold">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 10 && (
                <div className="p-2 text-center text-slate-400 text-[10px] bg-slate-50">
                  ...and {parsed.length - 10} more rows
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsed.length === 0}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 font-bold text-white shadow-sm disabled:opacity-50"
          >
            Import {parsed.length} Leads
          </button>
        </div>
      </div>
    </div>
  );
}

