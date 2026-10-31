'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  KeySquare,
  ArrowRight,
  ArrowLeft,
  Server,
  Terminal,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import WaveBackground from '../../../components/WaveBackground';

export default function SuperAdminSignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin4, setPin4] = useState('');
  const [pin8, setPin8] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both Master Username and Password.');
      return;
    }
    if (!pin4.trim()) {
      setErrorMsg('Please enter your 4-digit terminal security PIN.');
      return;
    }
    if (!pin8.trim()) {
      setErrorMsg('Please enter your 8-digit master authority PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/role-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-super-admin',
          username: username.trim(),
          password: password.trim(),
          pin4: pin4.trim(),
          pin8: pin8.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Invalid credentials. Master access denied.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push('/super-admin/credentials');
    } catch (err: any) {
      console.error('Super admin auth error:', err);
      setErrorMsg('Unable to reach authentication server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#050609] overflow-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-white selection:bg-indigo-500 selection:text-white font-sans">
      {/* 3D Silky Vertical Monochromatic Waves Background */}
      <WaveBackground />

      {/* Top Navbar */}
      <div className="relative z-10 mx-auto w-full max-w-4xl flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Public Workspaces</span>
        </Link>
        <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono">
          <Terminal className="h-3.5 w-3.5" />
          <span>SUPER_ADMIN_CONSOLE_v1.2</span>
        </div>
      </div>

      {/* Main Console Authentication Card */}
      <div className="relative z-10 mx-auto w-full max-w-lg my-auto">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top glowing bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 shadow-glow-indigo mb-4">
              <ShieldAlert className="h-7 w-7 text-indigo-400" />
            </div>

            <span className="inline-block rounded-full bg-indigo-950/80 border border-indigo-800/60 px-3 py-1 text-[11px] font-semibold text-indigo-300 tracking-wide mb-2">
              Privileged Master Access
            </span>

            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Super Admin Console
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Only exactly 1 Super Admin account exists in HomeSeva (PRD Section 4).
            </p>
          </div>

          {/* Form with 4-Factor Authentication */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Master Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>1. Master Admin Username</span>
                <span className="text-[10px] text-slate-500 font-mono">Factor 1 of 4</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmin@homeseva.internal"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 font-mono transition"
                />
              </div>
            </div>

            {/* 2. Master Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>2. Master Password</span>
                <span className="text-[10px] text-slate-500 font-mono">Factor 2 of 4</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 3. 4-Digit Terminal Security PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>3. 4-Digit Security PIN</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={pin4}
                    onChange={(e) => setPin4(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-amber-300 placeholder:text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 font-mono tracking-widest text-center font-black transition"
                  />
                </div>
              </div>

              {/* 4. 8-Digit Master Authority / Recovery Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>4. 8-Digit Master Key</span>
                </label>
                <div className="relative">
                  <KeySquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                  <input
                    type="password"
                    maxLength={8}
                    inputMode="numeric"
                    value={pin8}
                    onChange={(e) => setPin8(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-purple-300 placeholder:text-slate-700 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/15 font-mono tracking-widest text-center font-black transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white shadow-glow-indigo hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Authenticate &amp; Open Control Panel</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Audit disclaimer */}
          <div className="mt-8 rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3.5 flex items-start space-x-2.5 text-[11px] text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Session recorded in <code className="text-indigo-300">audit_log</code> with IP and timestamp. Super Admin can manage all 10 businesses, backup &amp; restore, and user assignments.
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-2 text-xs text-slate-400 flex items-center justify-center space-x-2">
        <Server className="h-3.5 w-3.5 text-slate-500" />
        <span>PostgreSQL Master Node · S3 Encrypted Backup Destination</span>
      </div>
    </main>
  );
}
