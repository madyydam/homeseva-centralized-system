import React, { useState, useRef } from 'react';
import { Item, ItemCategory, RentBasis } from '../types';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ImportItemsExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (items: Omit<Item, 'id' | 'in_godown' | 'out_on_rent' | 'in_cleaning' | 'written_off'>[]) => void;
}

export const ImportItemsExcelModal: React.FC<ImportItemsExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<Omit<Item, 'id' | 'in_godown' | 'out_on_rent' | 'in_cleaning' | 'written_off'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Sample Pre-Formatted Excel Template (.xlsx)
  const handleDownloadSampleTemplate = async () => {
    try {
      const XLSX = await import('xlsx');

      const sampleData = [
        {
          'Item Name': 'Bone China Dinner Plates (10-inch)',
          'Category': 'plates',
          'Pack Size': 25,
          'Rent Per Day': 10,
          'Rent Basis': 'per_day',
          'Replacement Cost': 120,
          'Total Quantity': 500,
          'Low Stock Alert Threshold': 50,
        },
        {
          'Item Name': 'Water Goblet Glasses (300ml)',
          'Category': 'glassware',
          'Pack Size': 24,
          'Rent Per Day': 6,
          'Rent Basis': 'per_day',
          'Replacement Cost': 65,
          'Total Quantity': 480,
          'Low Stock Alert Threshold': 48,
        },
        {
          'Item Name': 'Porcelain Soup Bowls (6-inch)',
          'Category': 'bowls',
          'Pack Size': 20,
          'Rent Per Day': 5,
          'Rent Basis': 'per_day',
          'Replacement Cost': 55,
          'Total Quantity': 300,
          'Low Stock Alert Threshold': 40,
        },
        {
          'Item Name': 'Stainless Steel Dessert Spoon',
          'Category': 'cutlery',
          'Pack Size': 50,
          'Rent Per Day': 2,
          'Rent Basis': 'per_day',
          'Replacement Cost': 25,
          'Total Quantity': 600,
          'Low Stock Alert Threshold': 50,
        },
        {
          'Item Name': 'Melamine Handi Curry Serving Bowl',
          'Category': 'serving',
          'Pack Size': 10,
          'Rent Per Day': 15,
          'Rent Basis': 'per_day',
          'Replacement Cost': 180,
          'Total Quantity': 100,
          'Low Stock Alert Threshold': 20,
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);

      // Auto-fit column widths
      worksheet['!cols'] = [
        { wch: 36 }, // Item Name
        { wch: 14 }, // Category
        { wch: 12 }, // Pack Size
        { wch: 14 }, // Rent Per Day
        { wch: 14 }, // Rent Basis
        { wch: 18 }, // Replacement Cost
        { wch: 16 }, // Total Quantity
        { wch: 25 }, // Low Stock Alert Threshold
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Crockery Items Template');
      XLSX.writeFile(workbook, 'Crockery_Items_Sample_Template.xlsx');
    } catch (err) {
      console.error('Failed to generate sample template:', err);
      alert('Could not download sample template. Please try again.');
    }
  };

  // 2. Handle File Upload & Parsing
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setErrors([]);
    setParsedItems([]);

    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setErrors(['The uploaded Excel workbook contains no sheets.']);
        setIsProcessing(false);
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        setErrors(['The primary worksheet could not be read.']);
        setIsProcessing(false);
        return;
      }

      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        setErrors(['No data rows found in the uploaded file. Please populate the sheet before uploading.']);
        setIsProcessing(false);
        return;
      }

      const validCategories: ItemCategory[] = ['plates', 'bowls', 'glassware', 'cups', 'cutlery', 'serving'];
      const parsed: Omit<Item, 'id' | 'in_godown' | 'out_on_rent' | 'in_cleaning' | 'written_off'>[] = [];
      const validationIssues: string[] = [];

      rows.forEach((row, index) => {
        // Robust flexible header mapping
        const name = (
          row['Item Name'] ||
          row['item_name'] ||
          row['Name'] ||
          row['name'] ||
          row['Title'] ||
          row['Item'] ||
          ''
        ).toString().trim();

        if (!name) {
          validationIssues.push(`Row ${index + 2}: Item Name is missing.`);
          return;
        }

        const rawCategory = (
          row['Category'] ||
          row['category'] ||
          'plates'
        ).toString().trim().toLowerCase();

        const category: ItemCategory = validCategories.includes(rawCategory as ItemCategory)
          ? (rawCategory as ItemCategory)
          : 'plates';

        const packSize = Math.max(1, parseInt(row['Pack Size'] || row['pack_size'] || '25', 10) || 25);
        const rentPerDay = Math.max(0.5, parseFloat(row['Rent Per Day'] || row['rent_per_day'] || row['Rent'] || '10') || 10);
        const rentBasis: RentBasis = (row['Rent Basis'] || row['rent_basis'] || '').toString().toLowerCase().includes('event')
          ? 'per_event'
          : 'per_day';
        const replacementCost = Math.max(1, parseFloat(row['Replacement Cost'] || row['replacement_cost'] || row['Cost'] || '100') || 100);
        const totalQuantity = Math.max(1, parseInt(row['Total Quantity'] || row['total_quantity'] || row['Quantity'] || row['Stock'] || '100', 10) || 100);
        const lowStockThreshold = Math.max(5, parseInt(row['Low Stock Alert Threshold'] || row['low_stock_threshold'] || '20', 10) || Math.round(totalQuantity * 0.2));

        parsed.push({
          name,
          category,
          pack_size: packSize,
          rent_per_day: rentPerDay,
          rent_basis: rentBasis,
          replacement_cost: replacementCost,
          total_quantity: totalQuantity,
          low_stock_threshold: lowStockThreshold,
          active: true,
        });
      });

      if (parsed.length === 0 && validationIssues.length > 0) {
        setErrors(validationIssues);
      } else {
        setParsedItems(parsed);
        if (validationIssues.length > 0) {
          setErrors(validationIssues.slice(0, 5)); // show top 5 issues if any skipped
        }
      }
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setErrors([`Failed to process file: ${err.message || 'Invalid Excel format'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    onImportSuccess(parsedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Crockery Inventory from Excel</h2>
              <p className="text-xs text-slate-500">
                Bulk add crockery products, rental rates, and warehouse stocks using spreadsheet files (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Download Sample Pre-Formatted Template */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
              <Download className="h-4 w-4 text-amber-600" />
              <span>Step 1: Download Pre-Formatted Excel Template</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 shadow-xs transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Sample Template (.xlsx)</span>
            </button>
          </div>
          <p className="text-[11.5px] text-amber-800/90 leading-relaxed">
            Download our verified sample spreadsheet containing the correct column structure (`Item Name`, `Category`, `Pack Size`, `Rent Per Day`, `Total Quantity`, `Replacement Cost`). Open it in Excel, fill your items, and upload below.
          </p>
        </div>

        {/* Step 2: Upload File Area */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Step 2: Upload Your Filled Excel File (.xlsx, .xls, .csv)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/20 transition group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center text-slate-500 group-hover:text-amber-600 transition">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop Excel Sheet'}
              </div>
              <p className="text-[11px] text-slate-400">Supported formats: Microsoft Excel (.xlsx, .xls), CSV (.csv)</p>
            </div>
          </div>
        </div>

        {/* Errors & Validation alerts */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Validation Warning:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 3: Preview Parsed Items */}
        {parsedItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Ready to Import: {parsedItems.length} Crockery Products Verified</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Showing preview of first 5 items</span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Item Name</th>
                    <th className="py-2 px-2.5">Category</th>
                    <th className="py-2 px-2.5 text-center">Pack</th>
                    <th className="py-2 px-2.5 text-right">Rent/Day</th>
                    <th className="py-2 px-2.5 text-center">Stock</th>
                    <th className="py-2 px-2.5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11.5px]">
                  {parsedItems.slice(0, 5).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2 px-2.5">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center text-slate-600">{item.pack_size} pcs</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">₹{item.rent_per_day}</td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-emerald-700">{item.total_quantity}</td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-600">₹{item.replacement_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedItems.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <span>Confirm &amp; Add {parsedItems.length} Products to Inventory</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
