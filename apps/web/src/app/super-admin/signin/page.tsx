'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  Unlock,
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
  Sparkles,
} from 'lucide-react';
import WaveBackground from '../../../components/WaveBackground';

interface LockState {
  unlocked: boolean;
  bursting: boolean;
  checking: boolean;
}

export default function SuperAdminSignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin4, setPin4] = useState('');
  const [pin8, setPin8] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 4 Locks State
  const [locks, setLocks] = useState<{
    username: LockState;
    password: LockState;
    pin4: LockState;
    pin8: LockState;
  }>({
    username: { unlocked: false, bursting: false, checking: false },
    password: { unlocked: false, bursting: false, checking: false },
    pin4: { unlocked: false, bursting: false, checking: false },
    pin8: { unlocked: false, bursting: false, checking: false },
  });

  const timerRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({
    username: null,
    password: null,
    pin4: null,
    pin8: null,
  });

  // Verify single field with server
  const verifyField = useCallback(async (field: 'username' | 'password' | 'pin4' | 'pin8', val: string) => {
    if (!val.trim()) {
      setLocks((prev) => ({
        ...prev,
        [field]: { unlocked: false, bursting: false, checking: false },
      }));
      return;
    }

    setLocks((prev) => ({
      ...prev,
      [field]: { ...prev[field], checking: true },
    }));

    try {
      const res = await fetch('/api/auth/super-admin/verify-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: val }),
      });
      const data = await res.json();

      if (data.locked) {
        setErrorMsg(data.error || 'Account temporarily locked.');
      } else if (!data.success && data.error) {
        setErrorMsg(data.error);
      } else {
        // clear error if server responded normally
        setErrorMsg('');
      }

      if (data.success && data.matched) {
        // Trigger Super 3D Bomb Detonation Animation
        setLocks((prev) => ({
          ...prev,
          [field]: { unlocked: true, bursting: true, checking: false },
        }));

        // Reset bursting explosion state after 1300ms while keeping unlocked
        setTimeout(() => {
          setLocks((prev) => ({
            ...prev,
            [field]: { unlocked: true, bursting: false, checking: false },
          }));
        }, 1300);
      } else {
        setLocks((prev) => ({
          ...prev,
          [field]: { unlocked: false, bursting: false, checking: false },
        }));
      }
    } catch {
      setLocks((prev) => ({
        ...prev,
        [field]: { unlocked: false, bursting: false, checking: false },
      }));
    }
  }, []);

  // Handle Debounced Typing (1 second pause triggers server check)
  const handleInputChange = (field: 'username' | 'password' | 'pin4' | 'pin8', val: string) => {
    if (field === 'username') setUsername(val);
    if (field === 'password') setPassword(val);
    if (field === 'pin4') setPin4(val.replace(/\D/g, '').slice(0, 4));
    if (field === 'pin8') setPin8(val.replace(/\D/g, '').slice(0, 8));

    // Clear existing timer
    if (timerRefs.current[field]) {
      clearTimeout(timerRefs.current[field]!);
    }

    // Set 1-second debounced trigger
    timerRefs.current[field] = setTimeout(() => {
      verifyField(field, val);
    }, 1000);
  };

  const unlockedCount = [locks.username.unlocked, locks.password.unlocked, locks.pin4.unlocked, locks.pin8.unlocked].filter(Boolean).length;
  const allUnlocked = unlockedCount === 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !pin4.trim() || !pin8.trim()) {
      setErrorMsg('All 4 credentials are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          pin4: pin4.trim(),
          pin8: pin8.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Authentication failed. Please verify all 4 credentials.');
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push('/super-admin/credentials');
    } catch {
      setErrorMsg('Failed to connect to authentication server. Please try again.');
      setIsLoading(false);
    }
  };

  // Spark angle coordinates for 12 explosion debris particles
  const sparkParticles = [
    { x: '0px', y: '-70px', delay: '0.05s' },
    { x: '45px', y: '-55px', delay: '0.1s' },
    { x: '65px', y: '-15px', delay: '0.08s' },
    { x: '60px', y: '35px', delay: '0.12s' },
    { x: '25px', y: '65px', delay: '0.06s' },
    { x: '-15px', y: '70px', delay: '0.14s' },
    { x: '-55px', y: '45px', delay: '0.07s' },
    { x: '-68px', y: '0px', delay: '0.11s' },
    { x: '-55px', y: '-45px', delay: '0.09s' },
    { x: '-20px', y: '-65px', delay: '0.13s' },
    { x: '35px', y: '-35px', delay: '0.04s' },
    { x: '-35px', y: '35px', delay: '0.15s' },
  ];

  const lockConfigs = [
    {
      id: 'username' as const,
      num: '1',
      label: '1. User',
      fieldTitle: '1. Master Admin Username',
      state: locks.username,
      color: '#10b981', // Emerald
      glowRgba: 'rgba(16, 185, 129, 0.95)',
      cardBgUnlocked: 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300 shadow-[0_8px_25px_rgba(16,185,129,0.35)]',
    },
    {
      id: 'password' as const,
      num: '2',
      label: '2. Pass',
      fieldTitle: '2. Master Password',
      state: locks.password,
      color: '#f59e0b', // Amber
      glowRgba: 'rgba(245, 158, 11, 0.95)',
      cardBgUnlocked: 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-[0_8px_25px_rgba(245,158,11,0.35)]',
    },
    {
      id: 'pin4' as const,
      num: '3',
      label: '3. PIN-4',
      fieldTitle: '3. 4-Digit Security PIN',
      state: locks.pin4,
      color: '#06b6d4', // Cyan
      glowRgba: 'rgba(6, 182, 212, 0.95)',
      cardBgUnlocked: 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300 shadow-[0_8px_25px_rgba(6,182,212,0.35)]',
    },
    {
      id: 'pin8' as const,
      num: '4',
      label: '4. PIN-8',
      fieldTitle: '4. 8-Digit Master Key',
      state: locks.pin8,
      color: '#a855f7', // Purple
      glowRgba: 'rgba(168, 85, 247, 0.95)',
      cardBgUnlocked: 'bg-purple-950/60 border-purple-500/70 text-purple-300 shadow-[0_8px_25px_rgba(168,85,247,0.35)]',
    },
  ];

  return (
    <main className="relative min-h-screen max-h-screen overflow-hidden bg-[#050609] flex flex-col justify-between px-3 py-2 sm:px-6 sm:py-3 text-white selection:bg-indigo-500 selection:text-white font-sans">
      {/* Dynamic 3D Keyframes & Bomb Detonation Styling */}
      <style>{`
        @keyframes bomb3DSurge {
          0% {
            transform: perspective(1000px) scale(1) translateZ(0) rotateX(0deg);
          }
          20% {
            transform: perspective(1000px) scale(1.35) translateZ(50px) rotateX(-8deg) rotateY(6deg);
            filter: brightness(1.7) drop-shadow(0 0 30px var(--bomb-glow));
          }
          38% {
            transform: perspective(1000px) scale(1.52) translateZ(85px) rotateX(6deg) rotateY(-6deg);
            filter: brightness(2.6) drop-shadow(0 0 60px #ffffff);
          }
          48% {
            /* THE BOMB DETONATION MOMENT */
            transform: perspective(1000px) scale(1.65) translateZ(110px) rotateZ(3deg);
            filter: brightness(4) contrast(1.7) drop-shadow(0 0 100px #ffffff);
          }
          62% {
            transform: perspective(1000px) scale(1.22) translateZ(45px) rotateX(-4deg);
            filter: brightness(1.6) drop-shadow(0 0 35px var(--bomb-glow));
          }
          82% {
            transform: perspective(1000px) scale(1.06) translateZ(20px) rotateX(2deg);
          }
          100% {
            transform: perspective(1000px) scale(1) translateZ(0) rotateX(0deg);
            filter: drop-shadow(0 0 16px var(--bomb-glow));
          }
        }

        @keyframes bombShockwaveA {
          0% {
            transform: scale(0.6);
            opacity: 1;
            border-width: 8px;
          }
          50% {
            transform: scale(2.4);
            opacity: 0.85;
            border-width: 4px;
          }
          100% {
            transform: scale(4.4);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes bombShockwaveB {
          0% {
            transform: scale(0.4);
            opacity: 1;
          }
          100% {
            transform: scale(5.2);
            opacity: 0;
          }
        }

        @keyframes bombShrapnel {
          0% {
            transform: translate(0, 0) scale(1.5);
            opacity: 1;
          }
          60% {
            opacity: 0.9;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes bombNuclearFlash {
          0% { opacity: 0; }
          30% { opacity: 0.8; }
          45% { opacity: 1; background: #ffffff; }
          65% { opacity: 0.5; }
          100% { opacity: 0; }
        }

        @keyframes shackleSnapOpen {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          40% {
            transform: translateY(-8px) rotate(-15deg);
          }
          55% {
            transform: translateY(-15px) rotate(-35deg) scale(1.15);
          }
          100% {
            transform: translateY(-11px) rotate(-30deg);
          }
        }

        .lock-3d-box {
          perspective: 1200px;
          transform-style: preserve-3d;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bomb-lock-active {
          animation: bomb3DSurge 1.25s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
          z-index: 50 !important;
        }

        .shockwave-ring-1 {
          animation: bombShockwaveA 0.9s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }

        .shockwave-ring-2 {
          animation: bombShockwaveB 1.1s cubic-bezier(0.1, 0.8, 0.2, 1) 0.1s forwards;
        }

        .bomb-flash-layer {
          animation: bombNuclearFlash 0.6s ease-out forwards;
        }

        .spark-debris {
          animation: bombShrapnel 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .shackle-popped {
          animation: shackleSnapOpen 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* 3D Silky Vertical Monochromatic Waves Background */}
      <WaveBackground />

      {/* Top Navbar */}
      <div className="relative z-10 mx-auto w-full max-w-3xl flex items-center justify-between py-1 px-1">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Workspaces</span>
        </Link>
        <div className="flex items-center space-x-2 text-[11px] text-indigo-400 font-mono tracking-wider">
          <Terminal className="h-3 w-3" />
          <span>SUPER_ADMIN_CONSOLE_v2.0</span>
        </div>
      </div>

      {/* Main Console Authentication Card - Compact, Wide 2x2 Grid fitting 100% on screen */}
      <div className="relative z-10 mx-auto w-full max-w-3xl my-auto">
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl relative overflow-visible">
          {/* Subtle top glowing bar */}
          <div className="absolute -top-[1px] left-6 right-6 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/70 pb-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 shadow-glow-indigo">
                <ShieldAlert className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-black tracking-tight text-white">
                    Super Admin Console
                  </h1>
                  <span className="rounded-full bg-indigo-950/90 border border-indigo-700/60 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
                    Privileged
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Single source of truth via Supabase · 4-Factor Interactive Verification
                </p>
              </div>
            </div>

            {/* Total Unlocked Pill Badge */}
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-mono px-3 py-1 rounded-full font-black tracking-wider transition-all duration-300 ${
                allUnlocked
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
              }`}>
                {unlockedCount}/4 BURST UNLOCKED
              </span>
            </div>
          </div>

          {/* 3D 4-FACTOR SECURITY LOCKS (Row of 4 Super 3D Vault Locks with Bomb Detonation) */}
          <div className="mb-4 rounded-2xl border border-slate-800/90 bg-slate-950/90 p-3 shadow-inner relative">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>3D 4-Factor Security Locks</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Real-time Supabase Check (1s Debounce)
              </span>
            </div>

            {/* 4 Super 3D Locks Grid */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
              {lockConfigs.map((cfg) => {
                const isBursting = cfg.state.bursting;
                const isUnlocked = cfg.state.unlocked;
                const isChecking = cfg.state.checking;

                return (
                  <div
                    key={cfg.id}
                    className="relative lock-3d-box flex items-center justify-center"
                    style={{ '--bomb-glow': cfg.glowRgba } as any}
                  >
                    {/* Bomb Explosion Shockwave Rings & Particle Sparks */}
                    {isBursting && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                        {/* Shockwave Ring 1 */}
                        <div
                          className="shockwave-ring-1 absolute rounded-full"
                          style={{
                            width: '45px',
                            height: '45px',
                            borderColor: cfg.color,
                            boxShadow: `0 0 30px ${cfg.color}`,
                          }}
                        />
                        {/* Shockwave Ring 2 */}
                        <div
                          className="shockwave-ring-2 absolute rounded-full border border-white"
                          style={{
                            width: '45px',
                            height: '45px',
                            boxShadow: `0 0 40px #ffffff`,
                          }}
                        />
                        {/* Nuclear Flash */}
                        <div className="bomb-flash-layer absolute inset-0 rounded-2xl" />

                        {/* 12 Radial Sparks flying out like a detonating bomb */}
                        {sparkParticles.map((pt, pIdx) => (
                          <div
                            key={pIdx}
                            className="spark-debris absolute rounded-full"
                            style={{
                              width: pIdx % 2 === 0 ? '5px' : '3px',
                              height: pIdx % 2 === 0 ? '5px' : '3px',
                              backgroundColor: pIdx % 3 === 0 ? '#ffffff' : cfg.color,
                              boxShadow: `0 0 10px ${cfg.color}`,
                              '--tx': pt.x,
                              '--ty': pt.y,
                              animationDelay: pt.delay,
                            } as any}
                          />
                        ))}
                      </div>
                    )}

                    {/* 3D Physical Lock Vault Card */}
                    <div
                      className={`w-full py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center relative cursor-default select-none transition-all duration-300 ${
                        isBursting
                          ? 'bomb-lock-active'
                          : isUnlocked
                          ? cfg.cardBgUnlocked
                          : 'bg-gradient-to-b from-slate-900/90 to-slate-950/95 border-slate-800 text-slate-400 hover:border-slate-700 shadow-md'
                      }`}
                      style={{
                        transform: isUnlocked && !isBursting ? 'translateY(-2px)' : undefined,
                      }}
                    >
                      {/* Top Physical Shackle Arch */}
                      <div className="relative mb-0.5">
                        {isUnlocked ? (
                          <div className={isBursting ? 'shackle-popped' : 'transform -translate-y-1.5 -rotate-12 transition-all'}>
                            <Unlock
                              className="h-5 w-5 animate-pulse"
                              style={{ color: cfg.color }}
                            />
                          </div>
                        ) : (
                          <div>
                            <Lock
                              className={`h-5 w-5 transition-colors ${
                                isChecking ? 'text-amber-400 animate-spin' : 'text-slate-400'
                              }`}
                            />
                          </div>
                        )}
                      </div>

                      {/* Lock Label */}
                      <span className={`text-[10px] font-black tracking-tight ${
                        isUnlocked ? 'text-white' : 'text-slate-300'
                      }`}>
                        {cfg.label}
                      </span>

                      {/* Status indicator dot */}
                      <div className="mt-1 flex items-center space-x-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isUnlocked
                              ? 'animate-ping'
                              : isChecking
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-slate-700'
                          }`}
                          style={{
                            backgroundColor: isUnlocked ? cfg.color : undefined,
                          }}
                        />
                        <span className={`text-[8px] font-mono font-bold uppercase ${
                          isUnlocked ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          {isUnlocked ? 'BURST' : isChecking ? 'CHECK' : 'LOCKED'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form with 2-Fields in a Row (2x2 Grid) */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* 2x2 Grid: 2 Fields in a Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
              {/* Row 1, Col 1: Master Admin Username */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>1. Master Admin Username</span>
                  <span className={`text-[10px] font-mono ${locks.username.unlocked ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    {locks.username.unlocked ? '✓ Lock 1 Burst' : 'Factor 1 of 4'}
                  </span>
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.username.unlocked ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter master username"
                    required
                    className={`w-full rounded-xl border bg-slate-950 py-2 pl-9 pr-3 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none font-mono transition ${
                      locks.username.unlocked
                        ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
              </div>

              {/* Row 1, Col 2: Master Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>2. Master Password</span>
                  <span className={`text-[10px] font-mono ${locks.password.unlocked ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    {locks.password.unlocked ? '✓ Lock 2 Burst' : 'Factor 2 of 4'}
                  </span>
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.password.unlocked ? 'text-amber-400' : 'text-slate-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter master password"
                    required
                    className={`w-full rounded-xl border bg-slate-950 py-2 pl-9 pr-9 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none font-mono transition ${
                      locks.password.unlocked
                        ? 'border-amber-500/70 ring-2 ring-amber-500/20 text-amber-300'
                        : 'border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Row 2, Col 1: 4-Digit Security PIN */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>3. 4-Digit Security PIN</span>
                  <span className={`text-[10px] font-mono ${locks.pin4.unlocked ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                    {locks.pin4.unlocked ? '✓ Lock 3 Burst' : 'Factor 3 of 4'}
                  </span>
                </label>
                <div className="relative">
                  <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.pin4.unlocked ? 'text-cyan-400' : 'text-cyan-500'}`} />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={pin4}
                    onChange={(e) => handleInputChange('pin4', e.target.value)}
                    placeholder="••••"
                    required
                    className={`w-full rounded-xl border bg-slate-950 py-2 pl-9 pr-3 text-xs sm:text-sm placeholder:text-slate-700 focus:outline-none font-mono tracking-widest text-center font-black transition ${
                      locks.pin4.unlocked
                        ? 'border-cyan-500/70 ring-2 ring-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-cyan-400'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2, Col 2: 8-Digit Master Key */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>4. 8-Digit Master Key</span>
                  <span className={`text-[10px] font-mono ${locks.pin8.unlocked ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                    {locks.pin8.unlocked ? '✓ Lock 4 Burst' : 'Factor 4 of 4'}
                  </span>
                </label>
                <div className="relative">
                  <KeySquare className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.pin8.unlocked ? 'text-purple-400' : 'text-purple-500'}`} />
                  <input
                    type="password"
                    maxLength={8}
                    inputMode="numeric"
                    value={pin8}
                    onChange={(e) => handleInputChange('pin8', e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full rounded-xl border bg-slate-950 py-2 pl-9 pr-3 text-xs sm:text-sm placeholder:text-slate-700 focus:outline-none font-mono tracking-widest text-center font-black transition ${
                      locks.pin8.unlocked
                        ? 'border-purple-500/70 ring-2 ring-purple-500/20 text-purple-300'
                        : 'border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center space-x-2 rounded-xl py-2.5 text-xs font-bold text-white transition-all cursor-pointer ${
                  allUnlocked
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:from-emerald-500 hover:to-indigo-500 ring-2 ring-emerald-400/40'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-glow-indigo'
                }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>
                      {allUnlocked ? 'All 4 Locks Burst — Open Control Panel' : 'Authenticate & Open Control Panel'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Audit disclaimer footer note */}
          <div className="mt-3 rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Full audit logging enabled in Supabase</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Lockout: 5 failed attempts = 15m</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-1 text-[11px] text-slate-400 flex items-center justify-center space-x-2">
        <Server className="h-3 w-3 text-slate-500" />
        <span>Supabase PostgreSQL Single Source of Truth · Bcrypt Encryption</span>
      </div>
    </main>
  );
}
