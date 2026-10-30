'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCw,
  Link as LinkIcon,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Save,
} from 'lucide-react';

interface GoogleSheetsViewProps {
  branch: string;
}

const DEFAULT_PRESET_SHEETS = [
  {
    name: 'Gentle Hair Wigs Master Financials',
    url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/pubhtml?widget=true&headers=false',
    desc: 'Consolidated studio revenue, staff salaries, rent allocation & tax ledgers',
  },
  {
    name: 'Daily Cash & POS Reconciliation',
    url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/pubhtml?gid=0&single=true&widget=true&headers=false',
    desc: 'Daily cash counter tally, UPI merchant transactions & closing register',
  },
  {
    name: 'Wig Inventory & Consumables Audit',
    url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/pubhtml?gid=1&single=true&widget=true&headers=false',
    desc: 'Base materials, hair bundle stock levels, adhesive bottles & reorder tracker',
  },
];

const STORAGE_KEY_PREFIX = 'homeseva_gentle_hair_wigs_sheet_';

export function GoogleSheetsView({ branch }: GoogleSheetsViewProps) {
  const [sheetUrl, setSheetUrl] = useState<string>(DEFAULT_PRESET_SHEETS[0]!.url);
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_PRESET_SHEETS[0]!.url);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [showGuide, setShowGuide] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved sheet URL from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${branch}`);
      if (saved) {
        setSheetUrl(saved);
        setInputUrl(saved);
      }
    } catch {
      // Ignore
    }
  }, [branch]);

  // Transform normal Google Sheet URL to embed format if needed
  const formatEmbedUrl = (rawUrl: string): string => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return DEFAULT_PRESET_SHEETS[0]!.url;

    // If user pasted iframe HTML tag: <iframe src="...">
    const iframeSrcMatch = trimmed.match(/src=["'](.*?)["']/);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      return iframeSrcMatch[1];
    }

    // If user pasted normal edit link: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
    if (trimmed.includes('docs.google.com/spreadsheets/d/') && trimmed.includes('/edit')) {
      return trimmed.replace(/\/edit.*$/, '/pubhtml?widget=true&headers=false');
    }

    return trimmed;
  };

  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = formatEmbedUrl(inputUrl);
    setIsLoading(true);
    setSheetUrl(formatted);
    setIframeKey(Date.now());
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${branch}`, formatted);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    setIsLoading(true);
    setInputUrl(presetUrl);
    setSheetUrl(presetUrl);
    setIframeKey(Date.now());
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${branch}`, presetUrl);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  return (
    <div
      className={`space-y-4 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white p-4 flex flex-col justify-between overflow-hidden'
          : ''
      }`}
    >
      {/* Top Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-slate-900">Google Finance Spreadsheets</h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  Live Sync
                </span>
                {savedSuccess && (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded animate-fade-in">
                    <Check className="h-3 w-3" />
                    <span>Sheet Saved!</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                View, audit and manage your external Google Sheets directly inside the Gentle Hair Wigs system.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleReload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Reload Spreadsheet"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>

            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
              title="Open Google Sheet in new browser window"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in Docs</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                isFullscreen
                  ? 'bg-amber-600 text-white'
                  : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="Toggle Fullscreen View"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleApplyUrl} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <LinkIcon className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste Google Sheet URL (Standard link or Publish to web embed link)..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Load &amp; Save Sheet</span>
          </button>
        </form>

        {/* Presets and Guide Accordion */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center space-x-1">
              <Layers className="h-3 w-3" />
              <span>Quick Presets:</span>
            </span>
            {DEFAULT_PRESET_SHEETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                  sheetUrl === preset.url
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={preset.desc}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
          >
            <HelpCircle className="h-3 w-3" />
            <span>How to embed your Google Sheet?</span>
            {showGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Help Guide Box */}
        {showGuide && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-slate-700 space-y-2 animate-fade-in">
            <span className="font-bold text-amber-900 block">
              Step-by-Step: How to link your Google Spreadsheet
            </span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
              <li>Open your Google Sheet in Google Drive.</li>
              <li>
                Click on <strong>File &rarr; Share &rarr; Publish to web</strong> in the top menu.
              </li>
              <li>
                Select <strong>Embed</strong> (or Link) and click the green <strong>Publish</strong> button.
              </li>
              <li>
                Copy the generated URL (or the embed code) and paste it into the input box above, then click <strong>Load &amp; Save Sheet</strong>.
              </li>
            </ol>
            <p className="text-[10px] text-amber-800 font-medium">
              Note: The link is automatically saved for your studio branch and will persist whenever you return to this tab!
            </p>
          </div>
        )}
      </div>

      {/* Embedded Google Sheet Iframe Container */}
      <div
        className={`w-full rounded-2xl border border-slate-200 shadow-xs overflow-hidden bg-white relative ${
          isFullscreen ? 'flex-1 h-full' : 'h-[750px]'
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs space-y-3">
            <RotateCw className="h-6 w-6 text-amber-600 animate-spin" />
            <span className="text-xs font-bold text-slate-700">Connecting to Google Spreadsheet...</span>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={sheetUrl}
          title="Google Finance Spreadsheet"
          className="w-full h-full border-0"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-write; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
