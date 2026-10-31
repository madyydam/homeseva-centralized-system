'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Mail,
  Lock as LockIcon,
  KeyRound,
  KeySquare,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
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
        setErrorMsg('');
      }

      if (data.success && data.matched) {
        // Trigger Super 3D Bomb Detonation Animation
        setLocks((prev) => ({
          ...prev,
          [field]: { unlocked: true, bursting: true, checking: false },
        }));

        // Reset bursting state after 1300ms while keeping unlocked
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

  const handleInputChange = (field: 'username' | 'password' | 'pin4' | 'pin8', val: string) => {
    if (field === 'username') setUsername(val);
    if (field === 'password') setPassword(val);
    if (field === 'pin4') setPin4(val.replace(/\D/g, '').slice(0, 4));
    if (field === 'pin8') setPin8(val.replace(/\D/g, '').slice(0, 8));

    if (timerRefs.current[field]) {
      clearTimeout(timerRefs.current[field]!);
    }

    timerRefs.current[field] = setTimeout(() => {
      verifyField(field, val);
    }, 700);
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

      router.push('/super-admin/credentials');
    } catch {
      setErrorMsg('Failed to connect to authentication server. Please try again.');
      setIsLoading(false);
    }
  };

  // 16 radial explosion spark vectors
  const sparkDebris = [
    { x: '0px', y: '-80px', delay: '0.02s' },
    { x: '35px', y: '-70px', delay: '0.04s' },
    { x: '65px', y: '-50px', delay: '0.03s' },
    { x: '80px', y: '-20px', delay: '0.06s' },
    { x: '85px', y: '15px', delay: '0.05s' },
    { x: '65px', y: '50px', delay: '0.04s' },
    { x: '35px', y: '75px', delay: '0.07s' },
    { x: '0px', y: '85px', delay: '0.02s' },
    { x: '-35px', y: '75px', delay: '0.05s' },
    { x: '-65px', y: '50px', delay: '0.03s' },
    { x: '-85px', y: '15px', delay: '0.06s' },
    { x: '-80px', y: '-20px', delay: '0.04s' },
    { x: '-65px', y: '-50px', delay: '0.05s' },
    { x: '-35px', y: '-70px', delay: '0.03s' },
    { x: '25px', y: '-35px', delay: '0.08s' },
    { x: '-25px', y: '35px', delay: '0.08s' },
  ];

  const lockList = [
    {
      id: 'username' as const,
      label: 'User',
      state: locks.username,
      color: '#10b981', // Emerald
      glowRgba: 'rgba(16, 185, 129, 0.95)',
      gradId: 'userGrad',
    },
    {
      id: 'password' as const,
      label: 'Pass',
      state: locks.password,
      color: '#f59e0b', // Amber
      glowRgba: 'rgba(245, 158, 11, 0.95)',
      gradId: 'passGrad',
    },
    {
      id: 'pin4' as const,
      label: 'PIN-4',
      state: locks.pin4,
      color: '#06b6d4', // Cyan
      glowRgba: 'rgba(6, 182, 212, 0.95)',
      gradId: 'pin4Grad',
    },
    {
      id: 'pin8' as const,
      label: 'PIN-8',
      state: locks.pin8,
      color: '#a855f7', // Purple
      glowRgba: 'rgba(168, 85, 247, 0.95)',
      gradId: 'pin8Grad',
    },
  ];

  return (
    <main className="relative min-h-screen max-h-screen overflow-hidden bg-[#06080e] flex flex-col justify-between px-4 py-3 sm:px-6 sm:py-4 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* 3D Keyframes & Bomb Detonation Physics */}
      <style>{`
        @keyframes bomb3DDetonation {
          0% {
            transform: perspective(800px) scale(1) translateZ(0) rotateX(10deg);
          }
          22% {
            transform: perspective(800px) scale(1.75) translateZ(95px) rotateX(-12deg) rotateY(10deg);
            filter: brightness(2) drop-shadow(0 0 35px var(--glow));
          }
          38% {
            transform: perspective(800px) scale(2.05) translateZ(135px) rotateX(8deg) rotateY(-8deg);
            filter: brightness(3.2) drop-shadow(0 0 55px var(--glow));
          }
          48% {
            /* Detonation Peak: Blinding flash */
            transform: perspective(800px) scale(2.25) translateZ(155px) rotateX(0deg);
            filter: brightness(4.5) drop-shadow(0 0 85px #ffffff);
          }
          62% {
            /* Recoil and snap */
            transform: perspective(800px) scale(0.92) translateZ(15px) rotateX(4deg);
            filter: brightness(1.3) drop-shadow(0 0 25px var(--glow));
          }
          80% {
            transform: perspective(800px) scale(1.08) translateZ(8px) rotateX(-2deg);
          }
          100% {
            transform: perspective(800px) scale(1) translateZ(0) rotateX(0deg);
            filter: brightness(1) drop-shadow(0 0 20px var(--glow));
          }
        }

        @keyframes shacklePopSnap {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          44% {
            transform: translateY(0px) rotate(0deg);
          }
          52% {
            transform: translateY(-24px) rotate(32deg);
          }
          75% {
            transform: translateY(-17px) rotate(24deg);
          }
          100% {
            transform: translateY(-19px) rotate(27deg);
          }
        }

        @keyframes shockwaveBlast1 {
          0% {
            transform: scale(0.2);
            opacity: 1;
            border-width: 5px;
          }
          100% {
            transform: scale(3.5);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes shockwaveBlast2 {
          0% {
            transform: scale(0.3);
            opacity: 1;
            border-width: 6px;
          }
          100% {
            transform: scale(4.2);
            opacity: 0;
            border-width: 0.5px;
          }
        }

        @keyframes sparkBlastOut {
          0% {
            transform: translate(0, 0) scale(1.6);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes bombFlashOverlay {
          0% { opacity: 0; }
          45% { opacity: 0; }
          48% { opacity: 0.95; }
          65% { opacity: 0; }
          100% { opacity: 0; }
        }

        /* 3D Padlock Chamber Styles */
        .padlock-chamber {
          perspective: 800px;
          transform-style: preserve-3d;
        }

        .padlock-3d-body {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
          transform-style: preserve-3d;
        }

        .padlock-3d-body:hover {
          transform: perspective(800px) rotateX(12deg) rotateY(-6deg) translateZ(12px);
        }

        .padlock-bursting {
          animation: bomb3DDetonation 1.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
          z-index: 60 !important;
        }

        .shackle-bursting {
          animation: shacklePopSnap 1.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: 30px 48px;
        }

        .shackle-unlocked {
          transform: translateY(-19px) rotate(27deg);
          transform-origin: 30px 48px;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .shackle-locked {
          transform: translateY(0px) rotate(0deg);
          transform-origin: 30px 48px;
          transition: transform 0.3s ease;
        }
      `}</style>

      {/* Atmospheric Ambient Wave Canvas */}
      <WaveBackground />

      {/* Top Navbar */}
      <div className="relative z-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition group py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          <span>Workspaces</span>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="relative z-10 mx-auto w-full max-w-2xl my-auto">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl relative">
          {/* Subtle top neon accent glow */}
          <div className="absolute -top-[1px] left-8 right-8 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" />

          {/* Clean Header */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Super Admin Console
              </h1>
            </div>
          </div>

          {/* REAL 3D 4-FACTOR SECURITY LOCKS (Isometric Vault Padlocks with Bomb Detonation) */}
          <div className="mb-5 rounded-2xl border border-slate-800/80 bg-[#090d16]/95 p-3.5 shadow-inner">
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 padlock-chamber">
              {lockList.map((cfg) => {
                const isBursting = cfg.state.bursting;
                const isUnlocked = cfg.state.unlocked;
                const isChecking = cfg.state.checking;

                return (
                  <div
                    key={cfg.id}
                    className="relative flex flex-col items-center justify-center"
                    style={{ '--glow': cfg.glowRgba } as any}
                  >
                    {/* Bomb Explosion Shockwaves & 16 Particles */}
                    {isBursting && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                        {/* Shockwave 1 */}
                        <div
                          className="absolute rounded-full"
                          style={{
                            width: '50px',
                            height: '50px',
                            borderColor: cfg.color,
                            boxShadow: `0 0 35px ${cfg.color}`,
                            animation: 'shockwaveBlast1 0.9s ease-out forwards',
                          }}
                        />
                        {/* Shockwave 2 (White Nuclear Ring) */}
                        <div
                          className="absolute rounded-full border border-white"
                          style={{
                            width: '45px',
                            height: '45px',
                            boxShadow: '0 0 45px #ffffff',
                            animation: 'shockwaveBlast2 1.1s ease-out 0.08s forwards',
                          }}
                        />
                        {/* Flash Layer */}
                        <div
                          className="absolute -inset-10 rounded-3xl bg-white pointer-events-none"
                          style={{
                            animation: 'bombFlashOverlay 1.3s ease-out forwards',
                            mixBlendMode: 'screen',
                          }}
                        />

                        {/* 16 Radial Spark Debris Particles */}
                        {sparkDebris.map((pt, pIdx) => (
                          <div
                            key={pIdx}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              width: pIdx % 2 === 0 ? '5px' : '3.5px',
                              height: pIdx % 2 === 0 ? '5px' : '3.5px',
                              backgroundColor: pIdx % 3 === 0 ? '#ffffff' : cfg.color,
                              boxShadow: `0 0 10px ${cfg.color}`,
                              '--tx': pt.x,
                              '--ty': pt.y,
                              animation: `sparkBlastOut 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${pt.delay} forwards`,
                            } as any}
                          />
                        ))}
                      </div>
                    )}

                    {/* REAL 3D VAULT PADLOCK (Interactive SVG with 3D Bevels, Shackle & Keyhole) */}
                    <div
                      className={`relative flex flex-col items-center justify-center py-1 cursor-default ${
                        isBursting ? 'padlock-bursting' : 'padlock-3d-body'
                      }`}
                    >
                      <svg
                        viewBox="0 0 100 115"
                        className="w-14 h-16 sm:w-16 sm:h-20 drop-shadow-[0_12px_18px_rgba(0,0,0,0.85)]"
                        style={{
                          filter: isUnlocked
                            ? `drop-shadow(0 0 14px ${cfg.glowRgba})`
                            : isChecking
                            ? 'drop-shadow(0 0 8px rgba(99,102,241,0.5))'
                            : 'drop-shadow(0 8px 12px rgba(0,0,0,0.7))',
                        }}
                      >
                        <defs>
                          {/* 3D Chrome Shackle Gradient */}
                          <linearGradient id={`shackleGrad_${cfg.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="25%" stopColor="#94a3b8" />
                            <stop offset="50%" stopColor="#ffffff" />
                            <stop offset="75%" stopColor="#cbd5e1" />
                            <stop offset="100%" stopColor="#334155" />
                          </linearGradient>

                          {/* 3D Padlock Body Gradient */}
                          <linearGradient id={`bodyGrad_${cfg.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={isUnlocked ? '#1e293b' : '#1e293b'} />
                            <stop offset="50%" stopColor={isUnlocked ? '#0f172a' : '#0f172a'} />
                            <stop offset="100%" stopColor={isUnlocked ? '#020617' : '#020617'} />
                          </linearGradient>

                          {/* Metallic Bevel Ring */}
                          <radialGradient id={`keyholeGlow_${cfg.id}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={isUnlocked ? cfg.color : '#334155'} stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
                          </radialGradient>
                        </defs>

                        {/* 1. 3D STEEL SHACKLE (U-Bar) */}
                        <g
                          className={
                            isBursting
                              ? 'shackle-bursting'
                              : isUnlocked
                              ? 'shackle-unlocked'
                              : 'shackle-locked'
                          }
                        >
                          {/* Shackle Shadow */}
                          <path
                            d="M 32 50 L 32 28 A 18 18 0 0 1 68 28 L 68 50"
                            fill="none"
                            stroke="#000000"
                            strokeWidth="9"
                            strokeLinecap="round"
                            opacity="0.6"
                            transform="translate(0, 3)"
                          />
                          {/* Outer Heavy Steel Shackle */}
                          <path
                            d="M 32 50 L 32 28 A 18 18 0 0 1 68 28 L 68 50"
                            fill="none"
                            stroke={`url(#shackleGrad_${cfg.id})`}
                            strokeWidth="8.5"
                            strokeLinecap="round"
                          />
                          {/* Inner Specular Light Highlight Line */}
                          <path
                            d="M 32 45 L 32 28 A 18 18 0 0 1 68 28"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            opacity="0.75"
                          />
                        </g>

                        {/* 2. PADLOCK BASE BODY (Solid 3D Chamfered Block) */}
                        <g transform="translate(0, 0)">
                          {/* Outer 3D Depth Shadow Ring */}
                          <rect
                            x="16"
                            y="44"
                            width="68"
                            height="62"
                            rx="13"
                            fill="#000000"
                            opacity="0.85"
                            transform="translate(0, 4)"
                          />

                          {/* Main Vault Padlock Body */}
                          <rect
                            x="16"
                            y="44"
                            width="68"
                            height="62"
                            rx="13"
                            fill={`url(#bodyGrad_${cfg.id})`}
                            stroke={isUnlocked ? cfg.color : '#334155'}
                            strokeWidth={isUnlocked ? '2.2' : '1.5'}
                          />

                          {/* Top Specular Edge Bevel (Gives true 3D thickness) */}
                          <path
                            d="M 24 45 L 76 45"
                            stroke="#ffffff"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            opacity={isUnlocked ? '0.7' : '0.35'}
                          />

                          {/* 4 Corner 3D Rivet Bolts */}
                          <circle cx="23" cy="51" r="2.2" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                          <circle cx="77" cy="51" r="2.2" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                          <circle cx="23" cy="99" r="2.2" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                          <circle cx="77" cy="99" r="2.2" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />

                          {/* Center 3D Cylinder Escutcheon / Keyhole Hub */}
                          <circle
                            cx="50"
                            cy="74"
                            r="15"
                            fill="#0b0f19"
                            stroke={isUnlocked ? cfg.color : '#475569'}
                            strokeWidth="1.6"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                          />

                          {/* Inner Glowing Keyhole Aperture */}
                          <circle
                            cx="50"
                            cy="74"
                            r="11"
                            fill={`url(#keyholeGlow_${cfg.id})`}
                          />

                          {/* Keyhole Slot Cutout */}
                          <path
                            d="M 48 70 A 3 3 0 0 1 52 70 L 53 77 L 47 77 Z"
                            fill={isUnlocked ? '#ffffff' : '#000000'}
                            opacity={isUnlocked ? '0.95' : '0.8'}
                          />

                          {/* Core Glowing Status Diode */}
                          {isUnlocked ? (
                            <circle
                              cx="50"
                              cy="73"
                              r="3.5"
                              fill="#ffffff"
                              filter={`drop-shadow(0 0 6px ${cfg.color})`}
                            />
                          ) : isChecking ? (
                            <circle
                              cx="50"
                              cy="73"
                              r="2.5"
                              fill="#6366f1"
                              className="animate-pulse"
                            />
                          ) : null}
                        </g>
                      </svg>

                      {/* Lock Label & LED indicator */}
                      <div className="mt-1 flex items-center space-x-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: isUnlocked ? cfg.color : isChecking ? '#6366f1' : '#475569',
                            boxShadow: isUnlocked ? `0 0 8px ${cfg.color}` : 'none',
                          }}
                        />
                        <span
                          className={`text-xs font-mono font-bold tracking-wide transition-colors ${
                            isUnlocked ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form with 2-Fields in a Row (2x2 Grid) */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex items-center space-x-2">
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Field 1: Master Admin Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>1. Master Admin Username</span>
                  {locks.username.unlocked && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center space-x-1">
                      <Check className="h-3 w-3" />
                      <span>Unlocked</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.username.unlocked ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter master username"
                    required
                    className={`w-full rounded-xl border bg-slate-950/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none font-mono transition ${
                      locks.username.unlocked
                        ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
              </div>

              {/* Field 2: Master Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>2. Master Password</span>
                  {locks.password.unlocked && (
                    <span className="text-[11px] font-mono text-amber-400 font-bold flex items-center space-x-1">
                      <Check className="h-3 w-3" />
                      <span>Unlocked</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <LockIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.password.unlocked ? 'text-amber-400' : 'text-slate-500'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter master password"
                    required
                    className={`w-full rounded-xl border bg-slate-950/90 py-2.5 pl-9 pr-9 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none font-mono transition ${
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

              {/* Field 3: 4-Digit Security PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>3. 4-Digit Security PIN</span>
                  {locks.pin4.unlocked && (
                    <span className="text-[11px] font-mono text-cyan-400 font-bold flex items-center space-x-1">
                      <Check className="h-3 w-3" />
                      <span>Unlocked</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.pin4.unlocked ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={pin4}
                    onChange={(e) => handleInputChange('pin4', e.target.value)}
                    placeholder="••••"
                    required
                    className={`w-full rounded-xl border bg-slate-950/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm placeholder:text-slate-700 focus:outline-none font-mono tracking-widest text-center font-bold transition ${
                      locks.pin4.unlocked
                        ? 'border-cyan-500/70 ring-2 ring-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-cyan-400'
                    }`}
                  />
                </div>
              </div>

              {/* Field 4: 8-Digit Master Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>4. 8-Digit Master Key</span>
                  {locks.pin8.unlocked && (
                    <span className="text-[11px] font-mono text-purple-400 font-bold flex items-center space-x-1">
                      <Check className="h-3 w-3" />
                      <span>Unlocked</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <KeySquare className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${locks.pin8.unlocked ? 'text-purple-400' : 'text-slate-500'}`} />
                  <input
                    type="password"
                    maxLength={8}
                    inputMode="numeric"
                    value={pin8}
                    onChange={(e) => handleInputChange('pin8', e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full rounded-xl border bg-slate-950/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm placeholder:text-slate-700 focus:outline-none font-mono tracking-widest text-center font-bold transition ${
                      locks.pin8.unlocked
                        ? 'border-purple-500/70 ring-2 ring-purple-500/20 text-purple-300'
                        : 'border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Clean Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center space-x-2 rounded-xl py-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer ${
                  allUnlocked
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:from-emerald-500 hover:to-indigo-500 ring-2 ring-emerald-400/40'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg'
                }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Unlock Super Admin Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom spacer for centering */}
      <div className="relative z-10" />
    </main>
  );
}
