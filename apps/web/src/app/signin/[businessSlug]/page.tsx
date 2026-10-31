'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock as LockIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Building2,
  AlertCircle,
  KeyRound,
  MapPin,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  Scissors,
  Ruler,
  Receipt,
  Package,
  Award,
  Check,
  UtensilsCrossed,
  PhoneCall,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import WaveBackground from '../../../components/WaveBackground';

interface SignInPageProps {
  params: {
    businessSlug: string;
  };
}

interface DynamicRole {
  id: string;
  role_id: string;
  label: string;
  description?: string;
  department?: string;
}

interface LockState {
  unlocked: boolean;
  bursting: boolean;
  checking: boolean;
}

// Icon helper mapped dynamically by role keyword
function getRoleIcon(roleName: string, dept: string = '') {
  const text = `${roleName} ${dept}`.toLowerCase();
  if (text.includes('manager') || text.includes('supervisor') || text.includes('director')) return ShieldCheck;
  if (text.includes('call') || text.includes('telecaller')) return PhoneCall;
  if (text.includes('stylist') || text.includes('hair') || text.includes('cut')) return Scissors;
  if (text.includes('measurement') || text.includes('consultant')) return Ruler;
  if (text.includes('billing') || text.includes('desk') || text.includes('front') || text.includes('account')) return Receipt;
  if (text.includes('inventory') || text.includes('warehouse') || text.includes('stock')) return Package;
  if (text.includes('partner') || text.includes('owner') || text.includes('lead')) return Award;
  if (text.includes('engineer') || text.includes('site') || text.includes('civil')) return Building2;
  return UserCheck;
}

const DEFAULT_BUSINESS_ROLES: Record<string, DynamicRole[]> = {
  'gentle-hair-wigs': [
    { id: '1', role_id: 'Studio Manager', label: 'Studio Manager', department: 'Operations', description: 'Studio operations & roster' },
    { id: '2', role_id: 'Cold Caller', label: 'Cold Caller / Telecaller', department: 'Telecalling', description: 'Leads & calling desk' },
    { id: '3', role_id: 'Senior Wig Specialist & Stylist', label: 'Senior Wig Specialist & Stylist', department: 'Styling', description: 'Custom hair fittings & styling' },
    { id: '4', role_id: 'Scalp & Measurement Consultant', label: 'Scalp & Measurement Consultant', department: 'Consultation', description: 'Head contouring & templates' },
    { id: '5', role_id: 'Billing & Front Desk', label: 'Billing & Front Desk', department: 'Front Desk', description: 'POS & invoices register' },
    { id: '6', role_id: 'Inventory Coordinator (Wigs & Patches)', label: 'Inventory Coordinator (Wigs & Patches)', department: 'Inventory', description: 'Stock, lace systems & patches' },
    { id: '7', role_id: 'Studio Partner / Owner', label: 'Studio Partner / Owner', department: 'Executive', description: 'Studio P&L & audits' },
  ],
  'horeca-essentials': [
    { id: '1', role_id: 'Store Operations Manager', label: 'Store Operations Manager', department: 'Operations', description: 'Store & warehouse manager' },
    { id: '2', role_id: 'B2B Sales Executive', label: 'B2B Sales Executive', department: 'Sales', description: 'Commercial kitchen sales' },
    { id: '3', role_id: 'Crockery Hire Coordinator', label: 'Crockery Hire Coordinator', department: 'Rentals', description: 'Event & banquet hire' },
    { id: '4', role_id: 'Accountant & Billing', label: 'Accountant & Billing', department: 'Finance', description: 'GST invoicing & ledger' },
  ],
  'ecolab-distribution': [
    { id: '1', role_id: 'Territory Sales Manager', label: 'Territory Sales Manager', department: 'Sales', description: 'Institutional sales' },
    { id: '2', role_id: 'Institutional Account Specialist', label: 'Institutional Account Specialist', department: 'Accounts', description: 'Commercial accounts' },
    { id: '3', role_id: 'Chemical Safety Auditor', label: 'Chemical Safety Auditor', department: 'Quality', description: 'Safety & sanitation audits' },
  ],
  'prefab-construction': [
    { id: '1', role_id: 'Site Project Manager', label: 'Site Project Manager', department: 'Projects', description: 'Site execution & delivery' },
    { id: '2', role_id: 'Civil Structural Engineer', label: 'Civil Structural Engineer', department: 'Engineering', description: 'Structural designs & CAD' },
  ],
};

export default function BusinessSignInPage({ params }: SignInPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { businessSlug } = params;
  const isGentleHairWigs = businessSlug === 'gentle-hair-wigs' || businessSlug === 'business-2';
  const isHorecaEssentials = businessSlug === 'horeca-essentials' || businessSlug === 'crockery-rental';
  const isEcolab = businessSlug === 'ecolab-distribution' || businessSlug === 'business-4';

  // Theme configuration for the business
  const theme = isGentleHairWigs
    ? {
        primary: '#d97706',
        glow: 'rgba(217, 119, 6, 0.95)',
        badgeBg: 'bg-amber-50 border-amber-200 text-amber-900',
        activeGrad: 'from-amber-600 to-yellow-600',
        ring: 'focus:ring-amber-500/20 focus:border-amber-500',
        bannerGrad: 'bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600',
      }
    : isHorecaEssentials
    ? {
        primary: '#059669',
        glow: 'rgba(5, 150, 105, 0.95)',
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        activeGrad: 'from-emerald-600 to-teal-600',
        ring: 'focus:ring-emerald-500/20 focus:border-emerald-500',
        bannerGrad: 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700',
      }
    : isEcolab
    ? {
        primary: '#0284c7',
        glow: 'rgba(2, 132, 199, 0.95)',
        badgeBg: 'bg-sky-50 border-sky-200 text-sky-900',
        activeGrad: 'from-blue-600 to-sky-600',
        ring: 'focus:ring-blue-500/20 focus:border-blue-500',
        bannerGrad: 'bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600',
      }
    : {
        primary: '#4f46e5',
        glow: 'rgba(79, 70, 229, 0.95)',
        badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        activeGrad: 'from-indigo-600 to-purple-600',
        ring: 'focus:ring-indigo-500/20 focus:border-indigo-500',
        bannerGrad: 'bg-gradient-to-r from-blue-600 to-indigo-700',
      };

  const divisionParam = searchParams.get('division') || searchParams.get('branch');
  const initialDivision =
    divisionParam === 'essentials-sales' || divisionParam === 'crockery-rental'
      ? (divisionParam as 'essentials-sales' | 'crockery-rental')
      : null;

  const [selectedDivision, setSelectedDivision] = useState<'essentials-sales' | 'crockery-rental' | null>(initialDivision);

  const initialBranch =
    branchParam === 'viman-nagar' || branchParam === 'ravet' || branchParam === 'kolhapur'
      ? branchParam
      : null;

  const [selectedBranch, setSelectedBranch] = useState<'viman-nagar' | 'ravet' | 'kolhapur' | null>(initialBranch);

  // Dynamic roles fetched from Supabase API (pre-populated with catalog defaults)
  const fallbackRoles = DEFAULT_BUSINESS_ROLES[businessSlug] || [];
  const [roles, setRoles] = useState<DynamicRole[]>(fallbackRoles);
  const [selectedRole, setSelectedRole] = useState(fallbackRoles[0]?.role_id || '');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 2 Locks State for Role Sign In: Password & PIN
  const [locks, setLocks] = useState<{
    password: LockState;
    pin: LockState;
  }>({
    password: { unlocked: false, bursting: false, checking: false },
    pin: { unlocked: false, bursting: false, checking: false },
  });

  const timerRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({
    password: null,
    pin: null,
  });

  // Verify single field with server
  const verifyRoleField = useCallback(
    async (field: 'password' | 'pin', val: string, roleToTest?: string) => {
      const activeRole = roleToTest || selectedRole;
      if (!val.trim() || !activeRole) {
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
        const res = await fetch('/api/auth/role/verify-field', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessSlug,
            roleId: activeRole,
            field,
            value: val,
          }),
        });
        const data = await res.json();

        if (data.locked) {
          setErrorMsg(data.error || 'Role account temporarily locked.');
        } else if (!data.success && data.error) {
          setErrorMsg(data.error);
        } else {
          setErrorMsg('');
        }

        if (data.success && data.matched) {
          // Trigger Bomb Detonation Animation
          setLocks((prev) => ({
            ...prev,
            [field]: { unlocked: true, bursting: true, checking: false },
          }));

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
    },
    [businessSlug, selectedRole]
  );

  const handleInputChange = (field: 'password' | 'pin', val: string) => {
    if (field === 'password') setPassword(val);
    if (field === 'pin') setPin(val.replace(/\D/g, '').slice(0, 4));

    if (timerRefs.current[field]) {
      clearTimeout(timerRefs.current[field]!);
    }

    timerRefs.current[field] = setTimeout(() => {
      verifyRoleField(field, val);
    }, 700);
  };

  const handleRoleSelect = (newRole: string) => {
    setSelectedRole(newRole);
    setIsRoleDropdownOpen(false);
    // Reset locks for new role
    setLocks({
      password: { unlocked: false, bursting: false, checking: false },
      pin: { unlocked: false, bursting: false, checking: false },
    });
    if (password) verifyRoleField('password', password, newRole);
    if (pin) verifyRoleField('pin', pin, newRole);
  };

  // Fetch dynamic roles from Supabase on mount
  useEffect(() => {
    async function loadRoles() {
      try {
        setIsLoadingRoles(true);
        const res = await fetch(`/api/auth/businesses?slug=${businessSlug}`);
        const data = await res.json();
        if (data.success && data.business?.roles) {
          setRoles(data.business.roles);
          if (data.business.roles.length > 0) {
            setSelectedRole(data.business.roles[0].role_id);
          }
        }
      } catch (err) {
        console.error('Failed to load roles from API:', err);
      } finally {
        setIsLoadingRoles(false);
      }
    }
    loadRoles();
  }, [businessSlug]);

  // Update if branchParam or divisionParam changes
  useEffect(() => {
    if (branchParam === 'viman-nagar' || branchParam === 'ravet' || branchParam === 'kolhapur') {
      setSelectedBranch(branchParam);
    }
    if (divisionParam === 'essentials-sales' || divisionParam === 'crockery-rental') {
      setSelectedDivision(divisionParam as 'essentials-sales' | 'crockery-rental');
    }
  }, [branchParam, divisionParam]);

  // Handle clicking outside custom dropdown & ESC key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGentleHairWigs) {
      if (!selectedBranch) {
        setErrorMsg('Please select a studio branch');
        return;
      }
      if (!password.trim()) {
        setErrorMsg('Please enter your password');
        return;
      }
      if (!pin.trim()) {
        setErrorMsg('Please enter your 4-digit security PIN');
        return;
      }
    } else if (isHorecaEssentials) {
      if (!selectedDivision) {
        setErrorMsg('Please select a practice: Essentials Sales or Crockery Rental');
        return;
      }
      if (!selectedRole || !password.trim()) {
        setErrorMsg('Please select your role and enter password');
        return;
      }
    } else if (!selectedRole || !password.trim()) {
      setErrorMsg('Please select a role and enter password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          role: selectedRole,
          password: password.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      if (isGentleHairWigs && selectedBranch) {
        router.push(`/app/gentle-hair-wigs/dashboard?branch=${selectedBranch}&role=${encodeURIComponent(selectedRole)}`);
      } else if (isHorecaEssentials && selectedDivision) {
        router.push(`/app/horeca-essentials/dashboard?division=${selectedDivision}`);
      } else {
        router.push(`/app/${businessSlug}/dashboard`);
      }
    } catch {
      setErrorMsg('Unable to verify credentials. Please try again.');
      setIsLoading(false);
    }
  };

  const currentRoleObj = roles.find((r) => r.role_id === selectedRole) || roles[0];
  const CurrentRoleIcon = currentRoleObj
    ? getRoleIcon(currentRoleObj.label || currentRoleObj.role_id, currentRoleObj.department)
    : ShieldCheck;

  // 16 radial explosion spark vectors
  const sparkDebris = [
    { x: '0px', y: '-75px', delay: '0.02s' },
    { x: '35px', y: '-65px', delay: '0.04s' },
    { x: '60px', y: '-45px', delay: '0.03s' },
    { x: '75px', y: '-15px', delay: '0.06s' },
    { x: '80px', y: '15px', delay: '0.05s' },
    { x: '60px', y: '45px', delay: '0.04s' },
    { x: '35px', y: '70px', delay: '0.07s' },
    { x: '0px', y: '80px', delay: '0.02s' },
    { x: '-35px', y: '70px', delay: '0.05s' },
    { x: '-60px', y: '45px', delay: '0.03s' },
    { x: '-80px', y: '15px', delay: '0.06s' },
    { x: '-75px', y: '-15px', delay: '0.04s' },
    { x: '-60px', y: '-45px', delay: '0.05s' },
    { x: '-35px', y: '-65px', delay: '0.03s' },
    { x: '25px', y: '-30px', delay: '0.08s' },
    { x: '-25px', y: '30px', delay: '0.08s' },
  ];

  const roleLocks = [
    {
      id: 'password' as const,
      label: 'Password',
      state: locks.password,
      color: theme.primary,
      glowRgba: theme.glow,
    },
    {
      id: 'pin' as const,
      label: 'Security PIN',
      state: locks.pin,
      color: isGentleHairWigs ? '#06b6d4' : '#10b981',
      glowRgba: isGentleHairWigs ? 'rgba(6, 182, 212, 0.95)' : 'rgba(16, 185, 129, 0.95)',
    },
  ];

  return (
    <main className="relative min-h-screen bg-[#06080e] text-white flex flex-col justify-between p-3 sm:p-6 overflow-y-auto font-sans selection:bg-amber-500 selection:text-white">
      {/* 3D Keyframes & Bomb Detonation Physics (Optimized for Light Mode Vault) */}
      <style>{`
        @keyframes bomb3DLightDetonation {
          0% {
            transform: perspective(700px) scale(1) translateZ(0) rotateX(8deg);
          }
          22% {
            transform: perspective(700px) scale(1.7) translateZ(85px) rotateX(-10deg) rotateY(10deg);
            filter: brightness(1.6) drop-shadow(0 0 30px var(--glow));
          }
          38% {
            transform: perspective(700px) scale(2) translateZ(125px) rotateX(8deg) rotateY(-8deg);
            filter: brightness(2.6) drop-shadow(0 0 45px var(--glow));
          }
          48% {
            transform: perspective(700px) scale(2.2) translateZ(145px) rotateX(0deg);
            filter: brightness(3.5) drop-shadow(0 0 70px #ffffff);
          }
          62% {
            transform: perspective(700px) scale(0.94) translateZ(12px) rotateX(4deg);
            filter: brightness(1.2) drop-shadow(0 0 20px var(--glow));
          }
          80% {
            transform: perspective(700px) scale(1.06) translateZ(6px) rotateX(-2deg);
          }
          100% {
            transform: perspective(700px) scale(1) translateZ(0) rotateX(0deg);
            filter: brightness(1) drop-shadow(0 0 16px var(--glow));
          }
        }

        @keyframes shackleSnapLight {
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

        @keyframes shockwaveBlastRole1 {
          0% {
            transform: scale(0.2);
            opacity: 1;
            border-width: 4px;
          }
          100% {
            transform: scale(3.2);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes sparkBlastRole {
          0% {
            transform: translate(0, 0) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes bombFlashOverlayRole {
          0% { opacity: 0; }
          45% { opacity: 0; }
          48% { opacity: 0.95; }
          65% { opacity: 0; }
          100% { opacity: 0; }
        }

        .padlock-light-body {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
          transform-style: preserve-3d;
        }

        .padlock-light-body:hover {
          transform: perspective(700px) rotateX(12deg) rotateY(-6deg) translateZ(10px);
        }

        .padlock-light-bursting {
          animation: bomb3DLightDetonation 1.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
          z-index: 60 !important;
        }

        .shackle-light-bursting {
          animation: shackleSnapLight 1.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: 30px 48px;
        }

        .shackle-light-unlocked {
          transform: translateY(-19px) rotate(27deg);
          transform-origin: 30px 48px;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .shackle-light-locked {
          transform: translateY(0px) rotate(0deg);
          transform-origin: 30px 48px;
          transition: transform 0.3s ease;
        }
      `}</style>

      {/* 3D Vertical Silky Waves Background */}
      <WaveBackground />

      {/* Top Bar Navigation */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between shrink-0 mb-2">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-300 hover:text-white transition drop-shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Businesses</span>
        </Link>
      </div>

      {/* Main Single-Screen Card Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto my-auto py-2 sm:py-3 shrink-0 px-1 sm:px-4">
        <div className="rounded-3xl border border-slate-700/80 bg-white text-slate-900 shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className={`px-6 py-4 text-white flex items-center justify-between ${theme.bannerGrad}`}>
            <div className="flex items-center space-x-3.5">
              {isGentleHairWigs ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1 border-2 border-amber-300 shadow-sm shrink-0">
                  <img
                    src="/logos/gentle-hair-wigs-logo.jpg"
                    alt="Gentle Hair Wigs Studio Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : isHorecaEssentials ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold shadow-sm shrink-0">
                  <UtensilsCrossed className="h-6 w-6 text-white" />
                </div>
              ) : isEcolab ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#005eb8] p-0.5 border-2 border-blue-300 shadow-sm shrink-0 overflow-hidden">
                  <img
                    src="/logos/ecolab-logo.jpg"
                    alt="Ecolab Logo"
                    className="h-full w-full object-cover rounded-xl"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold shadow-sm shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                  {isGentleHairWigs
                    ? 'Gentle Hair Wigs Studio'
                    : isHorecaEssentials
                    ? 'HORECA Essentials'
                    : isEcolab
                    ? 'Ecolab Distribution'
                    : 'Business Workspace Sign In'}
                </h1>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  {isGentleHairWigs
                    ? 'Custom Hair Systems & Aesthetic Studios'
                    : isHorecaEssentials
                    ? 'Commercial Kitchenware Supply & Crockery Rentals'
                    : isEcolab
                    ? 'Hygiene, Chemical Solutions & Commercial Sanitization'
                    : 'Authorized Personnel Access'}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1: HORECA ESSENTIALS PRACTICE SELECTION */}
          {isHorecaEssentials && !selectedDivision ? (
            <div className="p-6 sm:p-8 pb-8 sm:pb-10 space-y-6 bg-slate-50/70">
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Select Business Practice
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Choose between B2B commercial sales supply or banquet &amp; event crockery rental
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto items-stretch">
                <button
                  type="button"
                  onClick={() => setSelectedDivision('essentials-sales')}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[230px]"
                >
                  <div className="w-full">
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 text-[11px] font-bold text-emerald-900 shadow-2xs">
                      B2B Supply &amp; Distribution
                    </span>

                    <div className="flex items-center space-x-3 my-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 p-1 group-hover:border-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-800 transition leading-snug">
                          Essentials Sales
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Wholesale Kitchenware &amp; Tableware
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 font-medium">
                      Commercial cutlery, chinaware, glassware &amp; hotel amenities sales
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-700 group-hover:text-emerald-800">
                    <span>Select &amp; Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDivision('crockery-rental')}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[230px]"
                >
                  <div className="w-full">
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 text-[11px] font-bold text-emerald-900 shadow-2xs">
                      Banquet &amp; Event Hire
                    </span>

                    <div className="flex items-center space-x-3 my-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 p-1 group-hover:border-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-800 transition leading-snug">
                          Crockery Rental
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Weddings, Caterers &amp; Banquets Hire
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 font-medium">
                      Buffet chafing dishes, premium crockery, glasses &amp; event hire inventory
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-700 group-hover:text-emerald-800">
                    <span>Select &amp; Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          ) : isGentleHairWigs && !selectedBranch ? (
            /* STEP 1: GENTLE HAIR WIGS STUDIO SELECTION */
            <div className="p-6 sm:p-8 pb-8 sm:pb-10 space-y-6 bg-slate-50/70">
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Select Studio Location
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pick your branch to open designated appointments, orders &amp; billing desk
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
                {[
                  {
                    id: 'viman-nagar',
                    region: 'Pune East',
                    title: 'Studio of Viman Nagar',
                    sub: 'Phoenix Marketcity vicinity',
                    desc: '4 Stylist Suites · Private Fitting Rooms',
                  },
                  {
                    id: 'ravet',
                    region: 'PCMC Lounge',
                    title: 'Studio of Ravet',
                    sub: 'Kiwale-Ravet BRTS Corridor',
                    desc: '3 Stylist Suites · Express Studio',
                  },
                  {
                    id: 'kolhapur',
                    region: 'South Maharashtra',
                    title: 'Studio of Kolhapur',
                    sub: 'Tarabai Park / Station Rd',
                    desc: '3 Stylist Suites · Premium Lounge',
                  },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b.id as any)}
                    className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white p-5 sm:p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[240px]"
                  >
                    <div className="w-full">
                      <span className="rounded-lg bg-amber-50 border border-amber-200/90 px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-2xs">
                        {b.region}
                      </span>

                      <div className="flex items-center space-x-3 my-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50/70 border border-amber-200 p-1.5 group-hover:border-amber-500 transition shadow-2xs">
                          <img
                            src="/logos/gentle-hair-wigs-logo.jpg"
                            alt={b.title}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-800 transition leading-snug">
                            {b.title}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{b.sub}</span>
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 font-medium">
                        {b.desc}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-700 group-hover:text-amber-800">
                      <span>Select &amp; Sign In</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: DYNAMIC ROLE & CREDENTIALS WITH 2 3D LOCKS IN LEFT COLUMN */
            <div className="p-5 sm:p-7 bg-white">
              {/* Branch / Division Selector Chip */}
              {isGentleHairWigs && selectedBranch && (
                <div className="mb-4 flex items-center justify-between bg-amber-50/80 border border-amber-200 rounded-xl px-3.5 py-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="h-6 w-6 rounded-md bg-white border border-amber-200 p-0.5 shrink-0 overflow-hidden">
                      <img src="/logos/gentle-hair-wigs-logo.jpg" alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-xs font-extrabold text-amber-950 truncate">
                      {selectedBranch === 'viman-nagar'
                        ? 'Studio of Viman Nagar (Pune East)'
                        : selectedBranch === 'ravet'
                        ? 'Studio of Ravet (PCMC Lounge)'
                        : 'Studio of Kolhapur (South Maharashtra)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBranch(null)}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-white border border-amber-300 px-2.5 py-1 rounded-lg transition shadow-2xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Change</span>
                  </button>
                </div>
              )}

              {isHorecaEssentials && selectedDivision && (
                <div className="mb-4 flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-xl px-3.5 py-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="h-6 w-6 rounded-md bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 p-0.5 shrink-0">
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-extrabold text-emerald-950 truncate">
                      {selectedDivision === 'essentials-sales'
                        ? 'Practice: Essentials Sales'
                        : 'Practice: Crockery Rental'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDivision(null)}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg transition shadow-2xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Change</span>
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="mb-3.5 flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 2-COLUMN LAYOUT: 2 3D LOCKS IN LEFT COLUMN, FORM IN RIGHT COLUMN */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                {/* LEFT COLUMN: 2 REAL 3D VAULT PADLOCKS IN VERTICAL COLUMN */}
                <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/90 to-slate-50 border border-slate-200 p-4 flex flex-col justify-between items-center shadow-inner relative">
                  <div className="w-full text-center pb-1 border-b border-slate-200/80">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono">
                      Security Vault Locks
                    </span>
                  </div>

                  {/* The 2 3D Padlocks in Column (Password Lock on Top, PIN Lock below) */}
                  <div className="w-full flex flex-row md:flex-col justify-around md:justify-center items-center gap-4 py-2">
                    {roleLocks.map((cfg) => {
                      const isBursting = cfg.state.bursting;
                      const isUnlocked = cfg.state.unlocked;
                      const isChecking = cfg.state.checking;

                      return (
                        <div
                          key={cfg.id}
                          className="relative flex flex-col items-center justify-center my-1"
                          style={{ '--glow': cfg.glowRgba } as any}
                        >
                          {/* Bomb Explosion Shockwaves & Particles */}
                          {isBursting && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                              <div
                                className="absolute rounded-full"
                                style={{
                                  width: '45px',
                                  height: '45px',
                                  borderColor: cfg.color,
                                  boxShadow: `0 0 30px ${cfg.color}`,
                                  animation: 'shockwaveBlastRole1 0.9s ease-out forwards',
                                }}
                              />
                              <div
                                className="absolute -inset-8 rounded-2xl bg-white pointer-events-none"
                                style={{
                                  animation: 'bombFlashOverlayRole 1.3s ease-out forwards',
                                  mixBlendMode: 'screen',
                                }}
                              />
                              {sparkDebris.map((pt, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="absolute rounded-full pointer-events-none"
                                  style={{
                                    width: pIdx % 2 === 0 ? '4.5px' : '3px',
                                    height: pIdx % 2 === 0 ? '4.5px' : '3px',
                                    backgroundColor: pIdx % 3 === 0 ? '#ffffff' : cfg.color,
                                    boxShadow: `0 0 8px ${cfg.color}`,
                                    '--tx': pt.x,
                                    '--ty': pt.y,
                                    animation: `sparkBlastRole 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${pt.delay} forwards`,
                                  } as any}
                                />
                              ))}
                            </div>
                          )}

                          {/* 3D LIGHT MODE VAULT PADLOCK SVG */}
                          <div
                            className={`relative flex flex-col items-center justify-center cursor-default ${
                              isBursting ? 'padlock-light-bursting' : 'padlock-light-body'
                            }`}
                          >
                            <svg
                              viewBox="0 0 100 115"
                              className="w-14 h-16 sm:w-16 sm:h-20 drop-shadow-[0_10px_14px_rgba(0,0,0,0.18)]"
                              style={{
                                filter: isUnlocked
                                  ? `drop-shadow(0 0 12px ${cfg.glowRgba})`
                                  : isChecking
                                  ? 'drop-shadow(0 0 6px rgba(99,102,241,0.4))'
                                  : 'drop-shadow(0 6px 8px rgba(0,0,0,0.14))',
                              }}
                            >
                              <defs>
                                {/* Light Mode Specular Chrome Shackle */}
                                <linearGradient id={`shackleGradRole_${cfg.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#64748b" />
                                  <stop offset="25%" stopColor="#cbd5e1" />
                                  <stop offset="50%" stopColor="#ffffff" />
                                  <stop offset="75%" stopColor="#94a3b8" />
                                  <stop offset="100%" stopColor="#475569" />
                                </linearGradient>

                                {/* Light Mode Brushed Titanium Body */}
                                <linearGradient id={`bodyGradRole_${cfg.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor={isUnlocked ? '#ffffff' : '#f8fafc'} />
                                  <stop offset="50%" stopColor={isUnlocked ? '#f1f5f9' : '#e2e8f0'} />
                                  <stop offset="100%" stopColor={isUnlocked ? '#e2e8f0' : '#cbd5e1'} />
                                </linearGradient>

                                <radialGradient id={`keyholeRoleGlow_${cfg.id}`} cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor={isUnlocked ? cfg.color : '#64748b'} stopOpacity="0.8" />
                                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                                </radialGradient>
                              </defs>

                              {/* 1. 3D STEEL SHACKLE */}
                              <g
                                className={
                                  isBursting
                                    ? 'shackle-light-bursting'
                                    : isUnlocked
                                    ? 'shackle-light-unlocked'
                                    : 'shackle-light-locked'
                                }
                              >
                                <path
                                  d="M 32 50 L 32 28 A 18 18 0 0 1 68 28 L 68 50"
                                  fill="none"
                                  stroke="#64748b"
                                  strokeWidth="9"
                                  strokeLinecap="round"
                                  opacity="0.35"
                                  transform="translate(0, 3)"
                                />
                                <path
                                  d="M 32 50 L 32 28 A 18 18 0 0 1 68 28 L 68 50"
                                  fill="none"
                                  stroke={`url(#shackleGradRole_${cfg.id})`}
                                  strokeWidth="8.5"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M 32 45 L 32 28 A 18 18 0 0 1 68 28"
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  opacity="0.9"
                                />
                              </g>

                              {/* 2. 3D SOLID PADLOCK BODY (Light Titanium Block) */}
                              <g>
                                <rect
                                  x="16"
                                  y="44"
                                  width="68"
                                  height="62"
                                  rx="13"
                                  fill="#475569"
                                  opacity="0.25"
                                  transform="translate(0, 4)"
                                />

                                <rect
                                  x="16"
                                  y="44"
                                  width="68"
                                  height="62"
                                  rx="13"
                                  fill={`url(#bodyGradRole_${cfg.id})`}
                                  stroke={isUnlocked ? cfg.color : '#94a3b8'}
                                  strokeWidth={isUnlocked ? '2.5' : '1.5'}
                                />

                                <path
                                  d="M 24 45 L 76 45"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  opacity="0.95"
                                />

                                {/* 4 Screws */}
                                <circle cx="23" cy="51" r="2.2" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                                <circle cx="77" cy="51" r="2.2" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                                <circle cx="23" cy="99" r="2.2" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                                <circle cx="77" cy="99" r="2.2" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />

                                {/* Center Cylinder Escutcheon */}
                                <circle
                                  cx="50"
                                  cy="74"
                                  r="15"
                                  fill="#f1f5f9"
                                  stroke={isUnlocked ? cfg.color : '#64748b'}
                                  strokeWidth="1.6"
                                />

                                <circle
                                  cx="50"
                                  cy="74"
                                  r="11"
                                  fill={`url(#keyholeRoleGlow_${cfg.id})`}
                                />

                                <path
                                  d="M 48 70 A 3 3 0 0 1 52 70 L 53 77 L 47 77 Z"
                                  fill={isUnlocked ? '#ffffff' : '#0f172a'}
                                  opacity={isUnlocked ? '0.95' : '0.8'}
                                />

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
                                    fill={cfg.color}
                                    className="animate-pulse"
                                  />
                                ) : null}
                              </g>
                            </svg>

                            {/* Label & Status */}
                            <div className="mt-1 flex items-center space-x-1.5">
                              <span
                                className="h-2 w-2 rounded-full transition-all duration-300"
                                style={{
                                  backgroundColor: isUnlocked ? cfg.color : isChecking ? '#6366f1' : '#94a3b8',
                                  boxShadow: isUnlocked ? `0 0 8px ${cfg.color}` : 'none',
                                }}
                              />
                              <span
                                className={`text-xs font-mono font-bold tracking-tight transition-colors ${
                                  isUnlocked ? 'text-slate-900' : 'text-slate-500'
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

                  <div className="w-full text-center pt-1 border-t border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Dynamic Role Verification
                    </span>
                  </div>
                </div>

                {/* RIGHT COLUMN: CREDENTIALS FORM */}
                <div className="md:col-span-8 flex flex-col justify-center">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 1. DYNAMIC ROLE DROPDOWN (Fetched from Supabase) */}
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Your Role
                      </label>

                      {isLoadingRoles ? (
                        <div className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                          Loading roles...
                        </div>
                      ) : roles.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                            className="w-full flex items-center justify-between rounded-xl border border-slate-300 bg-white p-2.5 text-left transition hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${theme.badgeBg}`}
                              >
                                <CurrentRoleIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-black text-slate-900 truncate">
                                  {currentRoleObj?.label || selectedRole}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {currentRoleObj?.description || currentRoleObj?.department || 'Authorized Personnel'}
                                </div>
                              </div>
                            </div>

                            <ChevronDown
                              className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                                isRoleDropdownOpen ? 'rotate-180 text-amber-600' : ''
                              }`}
                            />
                          </button>

                          {/* Dropdown Menu */}
                          {isRoleDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl max-h-64 overflow-y-auto space-y-1">
                              {roles.map((opt) => {
                                const OptionIcon = getRoleIcon(opt.label || opt.role_id, opt.department);
                                const isSelected = selectedRole === opt.role_id;
                                return (
                                  <button
                                    key={opt.role_id}
                                    type="button"
                                    onClick={() => handleRoleSelect(opt.role_id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                                      isSelected
                                        ? 'bg-amber-50/90 border border-amber-300/80 shadow-2xs'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
                                          isSelected
                                            ? 'bg-amber-600 text-white shadow-xs'
                                            : 'bg-slate-100 border border-slate-200 text-slate-600'
                                        }`}
                                      >
                                        <OptionIcon className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div
                                          className={`text-xs font-extrabold truncate ${
                                            isSelected ? 'text-amber-950 font-black' : 'text-slate-900'
                                          }`}
                                        >
                                          {opt.label || opt.role_id}
                                        </div>
                                        <div className="text-[10.5px] text-slate-400 truncate">
                                          {opt.description || opt.department}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                                      {opt.department && (
                                        <span
                                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                            isSelected
                                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                                              : 'bg-slate-50 text-slate-500 border-slate-200'
                                          }`}
                                        >
                                          {opt.department}
                                        </span>
                                      )}
                                      {isSelected && <Check className="h-4 w-4 text-amber-700 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>

                    {/* 2. PASSWORD INPUT (Linked to Left Column Lock 1) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Password</label>
                        {locks.password.unlocked && (
                          <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center space-x-1">
                            <Check className="h-3 w-3" />
                            <span>Unlocked</span>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <LockIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                          locks.password.unlocked ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Enter assigned password"
                          required
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-9 text-xs sm:text-sm text-slate-900 focus:outline-none transition ${
                            locks.password.unlocked
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'border-slate-300 ' + theme.ring
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 3. PIN INPUT (Linked to Left Column Lock 2) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Security PIN</label>
                        {locks.pin.unlocked && (
                          <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center space-x-1">
                            <Check className="h-3 w-3" />
                            <span>Unlocked</span>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                          locks.pin.unlocked ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                        <input
                          type="password"
                          maxLength={4}
                          inputMode="numeric"
                          value={pin}
                          onChange={(e) => handleInputChange('pin', e.target.value)}
                          placeholder="••••"
                          required
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-mono tracking-widest text-slate-900 focus:outline-none transition ${
                            locks.pin.unlocked
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'border-slate-300 ' + theme.ring
                          }`}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full inline-flex items-center justify-center space-x-2 rounded-xl py-3 text-xs sm:text-sm font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer bg-gradient-to-r ${theme.activeGrad} hover:opacity-95`}
                      >
                        {isLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <span>Verify Credentials &amp; Open Workspace</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="relative z-10" />
    </main>
  );
}
