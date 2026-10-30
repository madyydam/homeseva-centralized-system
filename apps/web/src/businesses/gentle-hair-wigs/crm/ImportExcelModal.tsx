'use client';

import { Dispatch, SetStateAction, RefObject, memo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
} from 'lucide-react';
import { ParsedImportLead, formatDateToDMY, getStatusBadgeClass } from './crmUtils';

interface ImportExcelModalProps {
  showImportModal: boolean;
  setShowImportModal: Dispatch<SetStateAction<boolean>>;
  selectedMonthName: string;
  selectedYear: string;
  importFile: File | null;
  importPreview: ParsedImportLead[];
  importError: string;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDownloadSampleExcel: () => Promise<void>;
  handleConfirmImport: () => void;
}

export const ImportExcelModal = memo(function ImportExcelModal({
  showImportModal,
  setShowImportModal,
  selectedMonthName,
  selectedYear,
  importFile,
  importPreview,
  importError,
  fileInputRef,
  handleFileChange,
  handleDownloadSampleExcel,
  handleConfirmImport,
}: ImportExcelModalProps) {
  if (!showImportModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Import Excel Leads into {selectedMonthName} {selectedYear}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Upload your Excel sheet (.xlsx, .xls, .csv) or download the pre-formatted template
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowImportModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sample Template Download Box (Inside Import Modal) */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 border border-amber-200 text-amber-700 shrink-0">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-950 block">
                Download Pre-Formatted Excel Template (.xlsx)
              </span>
              <span className="text-[11px] text-amber-800 font-medium block">
                Columns: Client Name, Phone, Status, Calls (0-5), Follow-up Date (DD/MM/YYYY), Note 1 to 5
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadSampleExcel}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-black shadow-2xs transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            <span>Download Sample Excel</span>
          </button>
        </div>

        {/* File Upload Drop Area */}
        <div className="mb-3.5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
            Select Excel File to Import (.xlsx, .xls, .csv)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/20 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="h-7 w-7 text-emerald-600 mx-auto mb-1.5" />
            <span className="text-xs font-black text-slate-800 block">
              {importFile ? importFile.name : 'Click to Browse or Drag & Drop Excel Sheet (.xlsx, .xls, .csv)'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Directly reads Microsoft Excel spreadsheets and CSV formats
            </span>
          </div>
        </div>

        {/* Error Message */}
        {importError && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 mb-3 flex items-start space-x-2 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{importError}</span>
          </div>
        )}

        {/* Preview of Parsed Leads */}
        {importPreview.length > 0 && (
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                Preview: {importPreview.length} Leads Ready to Import
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded">
                Validated
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 text-xs divide-y divide-slate-100">
              {importPreview.slice(0, 5).map((item, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">
                      {idx + 1}. {item.clientName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-1 mt-0.5">
                      <span>{item.phone}</span>
                      <span>&middot;</span>
                      <span>{item.callCount} Calls</span>
                      <span>&middot;</span>
                      <span>{item.notesList.length} Notes</span>
                      {item.createdAt && (
                        <span className="text-slate-700 font-bold bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          🕒 Added: {formatDateToDMY(item.createdAt)}
                        </span>
                      )}
                      {item.updatedAt && item.updatedAt !== item.createdAt && (
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          ✏️ Updated: {formatDateToDMY(item.updatedAt)}
                        </span>
                      )}
                      {item.status === 'Follow-up' && item.nextFollowUpDate && (
                        <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          📅 Follow-up: {formatDateToDMY(item.nextFollowUpDate)}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border shrink-0 ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
              {importPreview.length > 5 && (
                <div className="p-2 text-center text-[10px] font-bold text-slate-500 italic bg-white">
                  + {importPreview.length - 5} more leads will be imported
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowImportModal(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={importPreview.length === 0}
            onClick={handleConfirmImport}
            className={`inline-flex items-center space-x-1.5 rounded-lg px-4 py-1.5 text-xs font-black shadow-2xs transition cursor-pointer ${
              importPreview.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Import {importPreview.length > 0 ? `${importPreview.length} Leads from Excel` : 'Leads'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

