'use client';

import { useState, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { PrintboothLeadItem, PrintboothLeadStatusType } from '../types';
import {
  ParsedImportLead,
  findDuplicateLead,
  normalizePhoneNumber,
  normalizeDateToYMD,
  getStatusBadgeClass,
  downloadPrintboothSampleExcel,
} from './crmUtils';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [csvText, setCsvText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImportLead[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [skippedRows, setSkippedRows] = useState<{ name: string; phone: string; reason: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Download Sample Pre-Formatted Excel Template (.xlsx)
  const handleDownloadSampleExcel = useCallback(async () => {
    try {
      setIsDownloading(true);
      await downloadPrintboothSampleExcel();
    } catch (err: any) {
      console.error('Failed to generate sample Excel:', err);
      setErrorMsg('Failed to generate sample Excel template: ' + (err?.message || 'Error'));
    } finally {
      setIsDownloading(false);
    }
  }, []);

  if (!isOpen) return null;

  // Process rows from array of objects/arrays
  const processRawRows = (rawRows: any[][]) => {
    setErrorMsg('');
    const results: ParsedImportLead[] = [];
    const skipped: { name: string; phone: string; reason: string }[] = [];
    let dupes = 0;

    if (rawRows.length === 0) {
      setErrorMsg('The selected file or text is empty.');
      return;
    }

    // Determine if first row is header
    let startIndex = 0;
    const firstRowStr = (rawRows[0] || []).join(' ').toLowerCase();
    if (
      firstRowStr.includes('name') ||
      firstRowStr.includes('phone') ||
      firstRowStr.includes('merchant') ||
      firstRowStr.includes('mobile')
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const name = String(row[0] || '').trim() || "Don't know";
      const rawPhone = String(row[1] || '').trim();
      const shopName = String(row[2] || '').trim() || undefined;
      const category = String(row[3] || '').trim() || 'Stationery & Xerox';
      const rawStatus = String(row[4] || '').trim() || 'Interested';
      const rawDate = String(row[5] || '').trim();
      const calls = Math.max(0, Math.min(5, Number(row[6]) || 1));
      const note1 = String(row[7] || '').trim();
      const note2 = String(row[8] || '').trim();
      const note3 = String(row[9] || '').trim();
      const note4 = String(row[10] || '').trim();
      const note5 = String(row[11] || '').trim();
      const kioskModel = String(row[12] || '').trim() || undefined;
      const unitsOrdered = row[13] ? Number(row[13]) || undefined : undefined;
      const installationCity = String(row[14] || '').trim() || undefined;

      const date = rawDate
        ? normalizeDateToYMD(rawDate) || `${defaultYear}-${defaultMonth}-01`
        : `${defaultYear}-${defaultMonth}-01`;

      const sNorm = rawStatus.toLowerCase();
      const validStatus: PrintboothLeadStatusType =
        sNorm.includes('convert') || sNorm.includes('sold')
          ? 'Converted'
          : sNorm.includes('follow')
          ? 'Follow-up'
          : sNorm.includes('negotiat')
          ? 'Negotiation'
          : sNorm.includes('not pick')
          ? 'Not Picked'
          : sNorm.includes('not inter')
          ? 'Not Interested'
          : 'Interested';

      const normTarget = normalizePhoneNumber(rawPhone);
      if (!normTarget || normTarget.length < 8) {
        skipped.push({ name, phone: rawPhone || '(missing)', reason: 'Invalid phone number' });
        continue;
      }

      // Check duplicates against existing DB
      const isDuplicateExisting = findDuplicateLead(normTarget, existingLeads);
      // Check duplicates against already parsed batch
      const isDuplicateBatch = results.some((r) => {
        const normP = normalizePhoneNumber(r.phone);
        if (normP === normTarget) return true;
        if (normP.length >= 10 && normTarget.length >= 10) {
          return normP.slice(-10) === normTarget.slice(-10);
        }
        return false;
      });

      if (isDuplicateExisting || isDuplicateBatch) {
        dupes++;
        skipped.push({
          name,
          phone: rawPhone,
          reason: isDuplicateExisting ? 'Already exists in CRM' : 'Duplicate in file/batch',
        });
        continue;
      }

      results.push({
        clientName: name,
        phone: rawPhone,
        shopName,
        locationCategory: category,
        status: validStatus,
        callCount: calls,
        notesList: [note1, note2, note3, note4, note5],
        leadDate: date,
        kioskModel,
        unitsOrdered,
        installationCity,
      });
    }

    setParsed(results);
    setDuplicatesCount(dupes);
    setSkippedRows(skipped);
  };

  // 2. Handle File Upload (.xlsx, .xls, .csv)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setErrorMsg('The selected spreadsheet contains no sheets.');
        setIsProcessing(false);
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        setErrorMsg('Unable to parse active sheet.');
        setIsProcessing(false);
        return;
      }

      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      processRawRows(rawRows);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg('Failed to parse Excel file: ' + (err?.message || 'Unsupported format'));
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Handle Pasted CSV / TSV text
  const handleParsePastedText = () => {
    if (!csvText.trim()) {
      setErrorMsg('Please paste CSV or tabular content to import.');
      return;
    }

    const lines = csvText.trim().split('\n');
    const rawRows = lines.map((line) =>
      line.split(/[,\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''))
    );
    processRawRows(rawRows);
  };

  const handleConfirmImport = () => {
    if (parsed.length === 0) return;
    onImportLeads(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 max-h-[92vh] flex flex-col font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-blue-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-blue-950">
                Import Kiosk Leads from Excel / CSV
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Upload your Excel spreadsheet (.xlsx, .xls, .csv) or download the pre-formatted template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* ── Sample Template Download Box (Matching Gentle Wigs CRM) ── */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 border border-blue-200 text-blue-700 shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-black text-blue-950 block">
                  Download Pre-Formatted Excel Template (.xlsx)
                </span>
                <span className="text-[11px] text-blue-800 font-medium block">
                  Columns: Merchant Name, Phone Number, Shop Name, Category, Status, Date, Notes 1-5
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadSampleExcel}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition cursor-pointer shrink-0 self-start sm:self-auto disabled:opacity-50"
            >
              {isDownloading ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-white" />
              )}
              <span>Download Sample Excel</span>
            </button>
          </div>

          {/* ── Mode Switcher Tabs ── */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Excel File (.xlsx, .xls, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`pb-2 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Paste Tabular CSV / Text</span>
            </button>
          </div>

          {/* Tab 1: File Upload Drop Area */}
          {activeTab === 'upload' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileSpreadsheet className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-black text-slate-800 block">
                  {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop Excel Sheet (.xlsx, .xls, .csv)'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                  Directly reads Microsoft Excel spreadsheets and CSV formats
                </span>
                {isProcessing && (
                  <div className="mt-2 text-blue-600 font-bold flex items-center justify-center gap-1.5">
                    <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Parsing spreadsheet...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Paste CSV Text */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10.5px]">
                  PASTE CSV / TAB-SEPARATED DATA
                </label>
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  disabled={isDownloading}
                  className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline transition cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>Download Sample Template (.xlsx)</span>
                </button>
              </div>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Merchant Name, Phone Number, Shop Name, Category, Status, Date, Note"
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleParsePastedText}
                type="button"
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 font-bold text-white shadow-xs transition cursor-pointer"
              >
                Parse Data & Check Duplicates
              </button>
            </div>
          )}

          {/* Success Validation Pill */}
          {parsed.length > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  ✓ {parsed.length} valid unique leads ready to import into CRM
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
          )}

          {/* Skipped Rows / Duplicate Alert Box */}
          {skippedRows.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-semibold text-xs">
                  Skipped <span className="font-bold">{skippedRows.length}</span> invalid or duplicate rows:
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pl-6 text-[11px] font-mono text-amber-800">
                {skippedRows.slice(0, 6).map((s, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {s.name} ({s.phone})
                    </span>
                    <span className="text-amber-700 italic">[{s.reason}]</span>
                  </div>
                ))}
                {skippedRows.length > 6 && (
                  <div className="text-amber-600 italic">...and {skippedRows.length - 6} more skipped</div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 flex items-start space-x-2 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table of Parsed Leads */}
          {parsed.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2">Merchant Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Shop Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsed.slice(0, 10).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800">{p.clientName}</td>
                      <td className="p-2 font-mono text-slate-600">{p.phone}</td>
                      <td className="p-2 text-slate-600">{p.shopName || '—'}</td>
                      <td className="p-2 text-slate-500 text-[11px]">{p.locationCategory || '—'}</td>
                      <td className="p-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${getStatusBadgeClass(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 10 && (
                <div className="p-2 text-center text-slate-400 text-[10px] bg-slate-50 border-t border-slate-100">
                  ...and {parsed.length - 10} more rows
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsed.length === 0}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm disabled:opacity-50 transition cursor-pointer"
          >
            Import {parsed.length} Leads
          </button>
        </div>
      </div>
    </div>
  );
}
