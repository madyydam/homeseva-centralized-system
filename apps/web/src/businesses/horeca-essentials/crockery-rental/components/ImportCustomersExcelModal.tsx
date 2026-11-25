import React, { useState, useRef } from 'react';
import { Customer } from '../types';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
} from 'lucide-react';

interface ImportCustomersExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (customers: Omit<Customer, 'id' | 'created_at'>[]) => void;
}

export const ImportCustomersExcelModal: React.FC<ImportCustomersExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedCustomers, setParsedCustomers] = useState<Omit<Customer, 'id' | 'created_at'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Sample Pre-Formatted Excel Template (.xlsx)
  const handleDownloadSampleTemplate = async () => {
    try {
      const XLSX = await import('xlsx');

      const sampleData = [
        {
          'Customer Name': 'Royal Feast Caterers & Banquets',
          'Phone Number': '9822011223',
          'Alternative Phone': '9822099887',
          'Delivery / Billing Address': 'Shop 4, Grand Pride Complex, Kothrud, Pune 411038',
          'GSTIN Number': '27ABCDE1234F1Z5',
          'Customer Tag': 'caterer',
          'Notes': 'High-volume banquet caterer. 15-day credit terms approved.',
        },
        {
          'Customer Name': 'Shivaji Lawns & Marriage Hall',
          'Phone Number': '9850022334',
          'Alternative Phone': '',
          'Delivery / Billing Address': 'Near Highway Junction, Karve Nagar, Pune 411052',
          'GSTIN Number': '27AAFFC9876P1Z1',
          'Customer Tag': 'caterer',
          'Notes': 'Wedding hall regular hiring bone china and chafing dishes.',
        },
        {
          'Customer Name': 'Amit Patil',
          'Phone Number': '9422033445',
          'Alternative Phone': '',
          'Delivery / Billing Address': 'Flat 302, Green Acres, Aundh, Pune 411007',
          'GSTIN Number': '',
          'Customer Tag': 'regular',
          'Notes': 'Private family event host.',
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      worksheet['!cols'] = [
        { wch: 32 }, // Customer Name
        { wch: 18 }, // Phone Number
        { wch: 18 }, // Alternative Phone
        { wch: 45 }, // Delivery / Billing Address
        { wch: 20 }, // GSTIN Number
        { wch: 16 }, // Customer Tag
        { wch: 40 }, // Notes
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Customers Template');
      XLSX.writeFile(workbook, 'Crockery_Customers_Sample_Template.xlsx');
    } catch (err) {
      console.error('Error generating sample customer template:', err);
      alert('Could not generate sample Excel template. Please try again.');
    }
  };

  // 2. Parse uploaded file (.xlsx, .xls, .csv)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setErrors([]);
    setParsedCustomers([]);

    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setErrors(['The uploaded Excel workbook contains no readable sheets.']);
        setIsProcessing(false);
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      if (!sheet) {
        setErrors(['Unable to read sheet data.']);
        setIsProcessing(false);
        return;
      }

      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rawRows.length === 0) {
        setErrors(['The uploaded file is empty. Please add rows to the sheet.']);
        setIsProcessing(false);
        return;
      }

      const newCustomers: Omit<Customer, 'id' | 'created_at'>[] = [];
      const validationErrors: string[] = [];

      rawRows.forEach((row, index) => {
        const rowNum = index + 2; // Accounting for 1-based index and header

        // Flexible key matching
        const findVal = (possibleKeys: string[]) => {
          for (const key of possibleKeys) {
            for (const rowKey of Object.keys(row)) {
              if (rowKey.trim().toLowerCase().replace(/[\s_-]+/g, '') === key.toLowerCase().replace(/[\s_-]+/g, '')) {
                return row[rowKey];
              }
            }
          }
          return undefined;
        };

        const rawName = String(findVal(['Customer Name', 'Name', 'Client Name', 'Caterer Name', 'Customer']) || '').trim();
        const rawPhone = String(findVal(['Phone Number', 'Phone', 'Mobile', 'Contact', 'Contact Number']) || '').trim();
        const rawAltPhone = String(findVal(['Alternative Phone', 'Alt Phone', 'Alternate Phone', 'Secondary Phone']) || '').trim();
        const rawAddress = String(findVal(['Delivery / Billing Address', 'Address', 'Billing Address', 'Location']) || '').trim();
        const rawGstin = String(findVal(['GSTIN Number', 'GSTIN', 'GST', 'UIN']) || '').trim().toUpperCase();
        const rawTag = String(findVal(['Customer Tag', 'Tag', 'Type', 'Category']) || 'regular').trim().toLowerCase();
        const rawNotes = String(findVal(['Notes', 'Remarks', 'Comments']) || '').trim();

        if (!rawName) {
          validationErrors.push(`Row ${rowNum}: Customer Name is missing.`);
          return;
        }

        if (!rawPhone) {
          validationErrors.push(`Row ${rowNum} (${rawName}): Phone Number is missing.`);
          return;
        }

        let tag: 'regular' | 'caterer' | 'blacklisted' = 'regular';
        if (rawTag.includes('caterer') || rawTag.includes('banquet') || rawTag.includes('hall')) {
          tag = 'caterer';
        } else if (rawTag.includes('black') || rawTag.includes('block')) {
          tag = 'blacklisted';
        }

        newCustomers.push({
          name: rawName,
          phone: rawPhone,
          alt_phone: rawAltPhone,
          address: rawAddress,
          gstin: rawGstin,
          tag,
          notes: rawNotes,
        });
      });

      setErrors(validationErrors);
      setParsedCustomers(newCustomers);
    } catch (err: any) {
      console.error('Error parsing customer Excel:', err);
      setErrors([`Failed to parse Excel file: ${err?.message || 'Invalid format'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedCustomers.length === 0) return;
    onImportSuccess(parsedCustomers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">
                Import Customers via Excel (.xlsx / .csv)
              </h3>
              <p className="text-xs text-muted-foreground">
                Bulk upload caterers, banquet halls, and client profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Step 1: Download Sample Excel Template */}
          <div className="p-4 rounded-xl border border-dashed border-blue-500/40 bg-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold">
                <Download className="h-4 w-4" />
                <span>Pre-Formatted Sample Excel Format</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Download the official template with standard column headers for customer imports.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Sample Template</span>
            </button>
          </div>

          {/* Step 2: File Dropzone */}
          <div>
            <label className="block font-bold text-foreground mb-1.5">
              Select or Drop Excel / CSV File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition bg-muted/10 hover:bg-muted/20"
            >
              <Upload className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
              <p className="font-bold text-foreground text-xs">
                {selectedFile ? selectedFile.name : 'Click to select or drag & drop file'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Supports .xlsx, .xls, and .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Validation Errors Alert */}
          {errors.length > 0 && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errors.length} Issue(s) Detected in File</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 max-h-32 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 3: Preview Table */}
          {parsedCustomers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Valid Customers Preview ({parsedCustomers.length})
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready for Import
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground sticky top-0 border-b border-border">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Tag</th>
                      <th className="p-2">GSTIN</th>
                      <th className="p-2">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedCustomers.slice(0, 50).map((c, i) => (
                      <tr key={i} className="hover:bg-muted/10">
                        <td className="p-2 font-bold text-foreground">{c.name}</td>
                        <td className="p-2 font-mono">{c.phone}</td>
                        <td className="p-2 uppercase font-bold text-[10px]">
                          <span className={c.tag === 'caterer' ? 'text-amber-600' : 'text-blue-600'}>
                            {c.tag}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-[11px]">{c.gstin || '—'}</td>
                        <td className="p-2 text-muted-foreground truncate max-w-xs">{c.address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedCustomers.length === 0 || isProcessing}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import {parsedCustomers.length} Customers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
