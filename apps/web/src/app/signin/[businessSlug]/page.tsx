'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
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
  Laptop,
  Smartphone,
  Printer,
  Boxes,
  Home,
  UserCheck,
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

export default function BusinessSignInPage({ params }: SignInPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { businessSlug } = params;
  const isGentleHairWigs = businessSlug === 'gentle-hair-wigs' || businessSlug === 'business-2';
  const isHorecaEssentials = businessSlug === 'horeca-essentials' || businessSlug === 'crockery-rental';
  const isEcolab = businessSlug === 'ecolab-distribution' || businessSlug === 'business-4';

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

  // Dynamic roles fetched from Supabase API
  const [roles, setRoles] = useState<DynamicRole[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  return (
    <main className="relative min-h-screen bg-[#050609] text-white flex flex-col justify-between p-3 sm:p-6 overflow-y-auto font-sans selection:bg-amber-500 selection:text-white">
      {/* 3D Silky Vertical Monochromatic Waves Live Background */}
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
        <span className="text-[11px] font-mono text-zinc-400">
          HomeSeva Centralized Access
        </span>
      </div>

      {/* Main Single-Screen Card Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto my-auto py-2 sm:py-4 shrink-0 px-1 sm:px-4">
        <div className="rounded-3xl border border-slate-700/80 bg-white text-slate-900 shadow-2xl overflow-hidden">
          {/* Luxury Banner Header */}
          <div className={`px-7 py-5 text-white flex items-center justify-between ${
            isGentleHairWigs
              ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600'
              : isHorecaEssentials
              ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700'
              : isEcolab
              ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700'
          }`}>
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

            <div className="hidden sm:inline-flex items-center space-x-1.5 rounded-full bg-black/20 border border-white/20 px-3.5 py-1 text-xs font-bold text-white shadow-2xs">
              <ShieldCheck className={`h-3.5 w-3.5 ${isHorecaEssentials ? 'text-emerald-300' : isEcolab ? 'text-sky-300' : 'text-amber-300'}`} />
              <span>Isolated Scope</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2.5xl mx-auto items-stretch">
                <button
                  type="button"
                  onClick={() => setSelectedDivision('essentials-sales')}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[250px]"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="rounded-lg bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 text-[11px] font-bold text-emerald-900 shadow-2xs">
                        B2B Supply &amp; Distribution
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 p-1 group-hover:border-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-800 transition leading-snug">
                          Essentials Sales
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>Wholesale Kitchenware &amp; Tableware</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 font-medium">
                      Commercial cutlery, chinaware, glassware &amp; hotel amenities sales
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-700 group-hover:text-emerald-800">
                    <span>Select &amp; Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDivision('crockery-rental')}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[250px]"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="rounded-lg bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 text-[11px] font-bold text-emerald-900 shadow-2xs">
                        Banquet &amp; Event Hire
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 p-1 group-hover:border-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-800 transition leading-snug">
                          Crockery Rental
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>Weddings, Caterers &amp; Banquets Hire</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 font-medium">
                      Buffet chafing dishes, premium crockery, glasses &amp; event hire inventory
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-700 group-hover:text-emerald-800">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl lg:max-w-6xl mx-auto items-stretch">
                <button
                  type="button"
                  onClick={() => setSelectedBranch('viman-nagar')}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white p-6 sm:p-7 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[260px]"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                      <span className="rounded-lg bg-amber-50 border border-amber-200/90 px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-2xs">
                        Pune East
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50/70 border border-amber-200 p-1.5 group-hover:border-amber-500 transition shadow-2xs">
                        <img
                          src="/logos/gentle-hair-wigs-logo.jpg"
                          alt="Viman Nagar"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-800 transition leading-snug">
                          Studio of Viman Nagar
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Phoenix Marketcity vicinity</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 font-medium">
                      4 Stylist Suites · Private Fitting Rooms
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-700 group-hover:text-amber-800">
                    <span>Select &amp; Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBranch('ravet')}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white p-6 sm:p-7 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[260px]"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                      <span className="rounded-lg bg-amber-50 border border-amber-200/90 px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-2xs">
                        PCMC Lounge
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50/70 border border-amber-200 p-1.5 group-hover:border-amber-500 transition shadow-2xs">
                        <img
                          src="/logos/gentle-hair-wigs-logo.jpg"
                          alt="Ravet"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-800 transition leading-snug">
                          Studio of Ravet
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Kiwale-Ravet BRTS Corridor</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 font-medium">
                      3 Stylist Suites · Express Studio
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-700 group-hover:text-amber-800">
                    <span>Select &amp; Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBranch('kolhapur')}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white p-6 sm:p-7 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 min-h-[260px]"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                      <span className="rounded-lg bg-amber-50 border border-amber-200/90 px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-2xs">
                        South Maharashtra
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50/70 border border-amber-200 p-1.5 group-hover:border-amber-500 transition shadow-2xs">
                        <img
                          src="/logos/gentle-hair-wigs-logo.jpg"
                          alt="Kolhapur"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-800 transition leading-snug">
                          Studio of Kolhapur
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Tarabai Park / Station Rd</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 font-medium">
                      3 Stylist Suites · Premium Lounge
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-700 group-hover:text-amber-800">
                    <span>Select &amp; Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: DYNAMIC ROLE & CREDENTIALS FORM */
            <div className="p-6 sm:p-7 bg-white">
              {/* Branch Pill */}
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

              {/* Division Pill */}
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

              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3.5">
                {/* 1. DYNAMIC ROLE DROPDOWN (Fetched from Supabase) */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Your Role
                  </label>

                  {isLoadingRoles ? (
                    <div className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                      Loading roles from Supabase...
                    </div>
                  ) : roles.length > 0 ? (
                    <>
                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-300 bg-white p-2.5 text-left transition hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                            isGentleHairWigs
                              ? 'bg-amber-50 border border-amber-200 text-amber-800'
                              : isHorecaEssentials
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                              : 'bg-blue-50 border border-blue-200 text-blue-800'
                          }`}>
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
                                onClick={() => {
                                  setSelectedRole(opt.role_id);
                                  setIsRoleDropdownOpen(false);
                                }}
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
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        placeholder="Enter Role ID"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 2. PASSWORD */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter assigned password"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 3. PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Security PIN</label>
                    <span className="text-[10px] text-amber-700 font-mono font-bold">4-Digit Terminal PIN</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-mono tracking-widest text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full inline-flex items-center justify-center space-x-2 rounded-xl py-2.5 text-xs font-extrabold text-white shadow-md transition disabled:opacity-50 ${
                      isGentleHairWigs
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-500/20'
                        : isHorecaEssentials
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                    }`}
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
          )}
        </div>
      </div>

      {/* Clean Bottom Bar */}
      <footer className="relative z-10 py-2.5 text-center text-[11px] text-zinc-400 shrink-0 bg-black/40 backdrop-blur-xs border-t border-white/[0.06]">
        HomeSeva Centralized System · Single Source of Truth: Supabase
      </footer>
    </main>
  );
}
