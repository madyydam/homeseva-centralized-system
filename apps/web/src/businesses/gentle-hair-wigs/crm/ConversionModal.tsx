'use client';

import { Dispatch, SetStateAction, memo } from 'react';
import {
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { CrmLeadItem, StudioInfoItem } from '../types';

interface ConversionModalProps {
  conversionModalLead: CrmLeadItem;
  setConversionModalLead: Dispatch<SetStateAction<CrmLeadItem | null>>;
  studios: StudioInfoItem[];
  handleConfirmConversion: (leadId: string, studioSlug: string, studioName: string) => void;
}

export const ConversionModal = memo(function ConversionModal({
  conversionModalLead,
  setConversionModalLead,
  studios,
  handleConfirmConversion,
}: ConversionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Mark Converted &amp; Select Studio Branch
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Attributing conversion for <span className="text-slate-900 font-bold">{conversionModalLead.clientName}</span> ({conversionModalLead.phone})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConversionModalLead(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-700">
            Which studio branch completed the consultation, fitting, or order placement?
          </p>

          {/* Studio Branch Cards */}
          <div className="space-y-2">
            {studios.map((st) => {
              const isCurrent = conversionModalLead.studioSlug === st.slug;
              return (
                <button
                  key={st.slug}
                  type="button"
                  onClick={() => handleConfirmConversion(conversionModalLead.id, st.slug, st.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                    isCurrent
                      ? 'border-purple-400 bg-purple-50/80 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 border border-purple-200 group-hover:scale-105 transition-transform">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 group-hover:text-purple-900 block leading-tight">
                        {st.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {st.address || st.shortName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-purple-700 group-hover:underline">
                      Select &amp; Convert &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Selecting a studio branch attributes this conversion, updates the landing page Studio Benchmarks, 12-Month Trajectory chart, and annual analytics in real-time.
          </p>
        </div>

        <div className="pt-3 mt-3.5 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setConversionModalLead(null)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

