'use client';

import { useState } from 'react';
import {
  Cpu,
  Terminal,
  Activity,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  RefreshCw,
  QrCode,
  Printer,
  ShieldCheck,
  Wifi,
} from 'lucide-react';

export function DeveloperWorkspace() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'firmware' | 'docs'>('simulator');
  const [copiedText, setCopiedText] = useState('');

  // Print Simulator States
  const [simDocName, setSimDocName] = useState('College_Project_Report.pdf');
  const [simPages, setSimPages] = useState(4);
  const [simColor, setSimColor] = useState<'B&W' | 'Color'>('B&W');
  const [simPrintResponse, setSimPrintResponse] = useState<any | null>(null);
  const [simPrintLoading, setSimPrintLoading] = useState(false);

  // Payment Webhook Simulator States
  const [simKioskId, setSimKioskId] = useState('PB-KSK-2026-004');
  const [simAmount, setSimAmount] = useState('20.00');
  const [simTxnRef, setSimTxnRef] = useState(`UPI${Date.now().toString().slice(-8)}`);
  const [simPaymentResponse, setSimPaymentResponse] = useState<any | null>(null);
  const [simPaymentLoading, setSimPaymentLoading] = useState(false);

  // OTA Modal State
  const [showOtaModal, setShowOtaModal] = useState(false);
  const [otaVersion, setOtaVersion] = useState('v3.4.3');
  const [otaChannel, setOtaChannel] = useState<'Stable' | 'Beta'>('Stable');
  const [otaNotes, setOtaNotes] = useState('Optimized thermal cutter responsiveness and added dual-tray auto fallback.');
  const [otaSuccess, setOtaSuccess] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleRunPrintSim = (e: React.FormEvent) => {
    e.preventDefault();
    setSimPrintLoading(true);
    setSimPrintResponse(null);

    setTimeout(() => {
      setSimPrintResponse({
        status: 200,
        message: 'Print Job Accepted & Queued to Local Kiosk Spooler',
        jobId: `JOB-${Date.now().toString().slice(-6)}`,
        kioskTarget: 'Autonomous Touchscreen Unit #1',
        document: simDocName,
        pages: simPages,
        mode: simColor,
        spoolerLatencyMs: 48,
        dispatchedAt: new Date().toISOString(),
      });
      setSimPrintLoading(false);
    }, 450);
  };

  const handleRunPaymentSim = (e: React.FormEvent) => {
    e.preventDefault();
    setSimPaymentLoading(true);
    setSimPaymentResponse(null);

    setTimeout(() => {
      setSimPaymentResponse({
        status: 200,
        webhookEvent: 'payment.completed',
        kioskId: simKioskId,
        amount: `₹ ${simAmount}`,
        utr: `UTR-UPI-${Date.now().toString().slice(-6)}`,
        txnReference: simTxnRef,
        kioskCommand: 'UNLOCK_PRINT_AND_DISPENSE',
        receivedAt: new Date().toISOString(),
      });
      setSimPaymentLoading(false);
    }, 450);
  };

  const handleDeployOta = (e: React.FormEvent) => {
    e.preventDefault();
    setOtaSuccess(true);
    setTimeout(() => {
      setShowOtaModal(false);
      setOtaSuccess(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm shrink-0">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                PRINTBOOTH™ Kiosk OS &amp; Cloud Gateway Developer Console
              </h2>
              <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                API Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Engineering desk for Ubuntu IoT touchscreen firmware, Cloud Print daemon, and UPI webhook simulators.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'simulator'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            API &amp; Webhook Simulator
          </button>
          <button
            onClick={() => setActiveTab('firmware')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'firmware'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Firmware &amp; OTA Updates
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'docs'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            API Endpoints &amp; Specs
          </button>
        </div>
      </div>

      {/* Hardware Daemon Health Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Touch Driver</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 block mt-1.5">1920x1080 Calibrated</span>
          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">✓ 10-Point Capacitive</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">CUPS Print Spooler</span>
            <Printer className="h-4 w-4 text-purple-600" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 block mt-1.5">Daemon Ready</span>
          <span className="text-[10px] font-bold text-purple-700 block mt-0.5">Dual-Tray Auto Detect</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">UPI QR Display</span>
            <QrCode className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 block mt-1.5">Dynamic Webhook</span>
          <span className="text-[10px] font-bold text-blue-700 block mt-0.5">Instant Reconciliation</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Telemetry Link</span>
            <Wifi className="h-4 w-4 text-amber-600" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 block mt-1.5">MQTT Heartbeat</span>
          <span className="text-[10px] font-bold text-amber-700 block mt-0.5">42ms latency · Online</span>
        </div>
      </div>

      {/* TAB 1: SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Test Print Job Dispatch */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Printer className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">1. Simulate Cloud Print Job Dispatch</h3>
                <p className="text-[11px] text-slate-500">Test payload injection to kiosk local spooler daemon</p>
              </div>
            </div>

            <form onSubmit={handleRunPrintSim} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document File Name</label>
                <input
                  type="text"
                  required
                  value={simDocName}
                  onChange={(e) => setSimDocName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Page Count</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={simPages}
                    onChange={(e) => setSimPages(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Print Color Mode</label>
                  <select
                    value={simColor}
                    onChange={(e) => setSimColor(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-bold"
                  >
                    <option value="B&W">Black &amp; White (Monochrome)</option>
                    <option value="Color">High Definition Color</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={simPrintLoading}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 font-bold text-white shadow-2xs transition flex items-center justify-center space-x-1.5"
              >
                {simPrintLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Dispatch Test Job (POST /api/kiosk/print-job)</span>
                  </>
                )}
              </button>
            </form>

            {simPrintResponse && (
              <div className="rounded-xl border border-emerald-200 bg-slate-900 p-3.5 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-slate-400">
                  <span className="font-bold text-white">HTTP Response: 200 OK</span>
                  <span>{simPrintResponse.spoolerLatencyMs}ms</span>
                </div>
                <pre>{JSON.stringify(simPrintResponse, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Card B: Simulate UPI Payment Webhook */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">2. Simulate UPI Payment Webhook</h3>
                <p className="text-[11px] text-slate-500">Simulate customer QR scan payment executing at kiosk</p>
              </div>
            </div>

            <form onSubmit={handleRunPaymentSim} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Kiosk ID</label>
                  <input
                    type="text"
                    required
                    value={simKioskId}
                    onChange={(e) => setSimKioskId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="text"
                    required
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Transaction Ref</label>
                <input
                  type="text"
                  required
                  value={simTxnRef}
                  onChange={(e) => setSimTxnRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={simPaymentLoading}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 font-bold text-white shadow-2xs transition flex items-center justify-center space-x-1.5"
              >
                {simPaymentLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Trigger Payment Webhook (POST /webhook/payment)</span>
                  </>
                )}
              </button>
            </form>

            {simPaymentResponse && (
              <div className="rounded-xl border border-blue-200 bg-slate-900 p-3.5 text-[11px] font-mono text-blue-400 overflow-x-auto">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-slate-400">
                  <span className="font-bold text-white">HTTP 200 OK: Event Processed</span>
                  <span className="text-emerald-400">Kiosk Released</span>
                </div>
                <pre>{JSON.stringify(simPaymentResponse, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FIRMWARE & OTA */}
      {activeTab === 'firmware' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Current Deployed OS Version</span>
              <div className="flex items-center space-x-2 mt-1">
                <h3 className="text-2xl font-black text-slate-900 font-mono">v3.4.2-LTS</h3>
                <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  Production Stable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Base: Linux / Ubuntu Core 24 IoT. Includes touch-calibration v2.1, CUPS 2.4.7 spooler, and UPI QR renderer.
              </p>
            </div>

            <button
              onClick={() => setShowOtaModal(true)}
              className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
            >
              <Cpu className="h-4 w-4" />
              <span>Deploy OTA Firmware Update</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900">Firmware Release History</h4>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-purple-700">v3.4.2-LTS</span>
                  <p className="text-slate-600 mt-0.5">Optimized thermal cutter responsiveness and added dual-tray auto fallback.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Released 2026-10-15 · Active on all kiosks</span>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">✓ Active</span>
              </div>
              <div className="py-3 flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-700">v3.4.0</span>
                  <p className="text-slate-600 mt-0.5">Initial production build with dynamic QR display and WhatsApp upload engine.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Released 2026-09-01</span>
                </div>
                <span className="text-slate-400 font-medium text-[11px]">Archived</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API SPECS */}
      {activeTab === 'docs' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">PRINTBOOTH™ Cloud Gateway API Reference</h3>
            <p className="text-xs text-slate-500 mt-1">Official REST and Webhook protocols for autonomous printing kiosks.</p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900">POST /api/v1/kiosk/print-job</span>
                <button
                  onClick={() => handleCopy('POST /api/v1/kiosk/print-job', 'Endpoint 1')}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-sans"
                >
                  {copiedText === 'Endpoint 1' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 font-sans">
                Submits document bytes, color mode, and tray selector to the specified kiosk terminal.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900">POST /api/v1/kiosk/webhook/payment</span>
                <button
                  onClick={() => handleCopy('POST /api/v1/kiosk/webhook/payment', 'Endpoint 2')}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-sans"
                >
                  {copiedText === 'Endpoint 2' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 font-sans">
                Payment gateway callback verifying customer UPI payment and initiating print execution.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">GET /api/v1/kiosk/health</span>
                <button
                  onClick={() => handleCopy('GET /api/v1/kiosk/health', 'Endpoint 3')}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-sans"
                >
                  {copiedText === 'Endpoint 3' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 font-sans">
                Pings hardware daemon for paper status, toner level, and touchscreen responsiveness.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OTA Deploy Modal */}
      {showOtaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 font-sans">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Deploy OTA Kiosk OS Update</h3>
            {otaSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">OTA Update Scheduled!</h4>
                <p className="text-xs text-slate-500">Firmware image broadcasted to fleet over MQTT.</p>
              </div>
            ) : (
              <form onSubmit={handleDeployOta} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Version Tag</label>
                  <input
                    type="text"
                    required
                    value={otaVersion}
                    onChange={(e) => setOtaVersion(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deployment Channel</label>
                  <select
                    value={otaChannel}
                    onChange={(e) => setOtaChannel(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-bold"
                  >
                    <option value="Stable">Production Stable (All Active Turnkey Kiosks)</option>
                    <option value="Beta">Canary / Staging Kiosks Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Changelog Notes</label>
                  <textarea
                    rows={3}
                    value={otaNotes}
                    onChange={(e) => setOtaNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowOtaModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 font-bold text-white shadow-sm"
                  >
                    Deploy to Kiosks
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

