'use client';

import Link from 'next/link';
import {
  Building2,
  UtensilsCrossed,
  Sparkles,
  Laptop,
  Smartphone,
  Printer,
  Boxes,
  ShieldCheck,
  Home,
  Layers,
  ArrowRight,
} from 'lucide-react';
import WaveBackground from '../components/WaveBackground';

interface BusinessItem {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  icon?: any;
  logoImg?: string;
  color: string;
  bgColor: string;
  buttonStyle: string;
  hoverEffect: string;
  isGentleHairWigs?: boolean;
  isHorecaEssentials?: boolean;
}

const BUSINESSES: BusinessItem[] = [
  {
    id: '1',
    name: 'Prefab Construction',
    subtitle: 'Civil & Modular Sites',
    slug: 'prefab-construction',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
    buttonStyle: 'bg-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100 hover:border-blue-300',
    hoverEffect: 'hover:border-blue-500 hover:shadow-blue-500/35 hover:ring-2 hover:ring-blue-400/25',
  },
  {
    id: '2',
    name: 'HORECA Essentials',
    subtitle: 'Essentials Sales & Crockery Rental',
    slug: 'horeca-essentials',
    icon: UtensilsCrossed,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
    buttonStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300',
    hoverEffect: 'hover:border-emerald-500 hover:shadow-emerald-500/35 hover:ring-2 hover:ring-emerald-400/25',
    isHorecaEssentials: true,
  },
  {
    id: '3',
    name: 'Gentle Hair Wigs',
    subtitle: 'Viman Nagar, Ravet & Kolhapur',
    slug: 'gentle-hair-wigs',
    logoImg: '/logos/gentle-hair-wigs-logo.jpg',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
    buttonStyle: 'bg-amber-50 text-amber-800 border-amber-300/90 hover:bg-amber-100 hover:border-amber-400',
    hoverEffect: 'hover:border-amber-400 hover:shadow-amber-500/40 hover:ring-2 hover:ring-amber-400/30',
    isGentleHairWigs: true,
  },
  {
    id: '4',
    name: 'Ecolab Distribution',
    subtitle: 'Hygiene & Chemical Solutions',
    slug: 'ecolab-distribution',
    logoImg: '/logos/ecolab-logo.jpg',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
    buttonStyle: 'bg-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100 hover:border-blue-300',
    hoverEffect: 'hover:border-blue-500 hover:shadow-blue-500/35 hover:ring-2 hover:ring-blue-400/25',
  },
  {
    id: '5',
    name: 'HS Co-working',
    subtitle: 'Flexible Desks & Workspaces',
    slug: 'hs-coworking',
    icon: Laptop,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
    buttonStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/90 hover:bg-indigo-100 hover:border-indigo-300',
    hoverEffect: 'hover:border-indigo-500 hover:shadow-indigo-500/35 hover:ring-2 hover:ring-indigo-400/25',
  },
  {
    id: '6',
    name: 'First Mover Advantage',
    subtitle: 'App SaaS Platform',
    slug: 'first-mover-advantage',
    icon: Smartphone,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 group-hover:bg-cyan-600 group-hover:text-white',
    buttonStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200/90 hover:bg-cyan-100 hover:border-cyan-300',
    hoverEffect: 'hover:border-cyan-500 hover:shadow-cyan-500/35 hover:ring-2 hover:ring-cyan-400/25',
  },
  {
    id: '7',
    name: 'Printbooth',
    subtitle: 'Digital & Commercial Printing',
    slug: 'printbooth',
    icon: Printer,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
    buttonStyle: 'bg-purple-50 text-purple-700 border-purple-200/90 hover:bg-purple-100 hover:border-purple-300',
    hoverEffect: 'hover:border-purple-500 hover:shadow-purple-500/35 hover:ring-2 hover:ring-purple-400/25',
  },
  {
    id: '8',
    name: 'DVR Enterprise',
    subtitle: 'Commercial Trading & Supplies',
    slug: 'dvr-enterprise',
    icon: Boxes,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 group-hover:bg-orange-600 group-hover:text-white',
    buttonStyle: 'bg-orange-50 text-orange-700 border-orange-200/90 hover:bg-orange-100 hover:border-orange-300',
    hoverEffect: 'hover:border-orange-500 hover:shadow-orange-500/35 hover:ring-2 hover:ring-orange-400/25',
  },
  {
    id: '9',
    name: 'NDA Services',
    subtitle: 'Security & Facility Care',
    slug: 'nda-services',
    icon: ShieldCheck,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 group-hover:bg-sky-600 group-hover:text-white',
    buttonStyle: 'bg-sky-50 text-sky-700 border-sky-200/90 hover:bg-sky-100 hover:border-sky-300',
    hoverEffect: 'hover:border-sky-500 hover:shadow-sky-500/35 hover:ring-2 hover:ring-sky-400/25',
  },
  {
    id: '10',
    name: 'HS Real Estate',
    subtitle: 'Property Leasing & Assets',
    slug: 'hs-real-estate',
    icon: Home,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 group-hover:bg-rose-600 group-hover:text-white',
    buttonStyle: 'bg-rose-50 text-rose-700 border-rose-200/90 hover:bg-rose-100 hover:border-rose-300',
    hoverEffect: 'hover:border-rose-500 hover:shadow-rose-500/35 hover:ring-2 hover:ring-rose-400/25',
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen h-screen max-h-screen bg-[#050609] text-white flex flex-col justify-between overflow-hidden font-sans">
      {/* 3D Silky Vertical Monochromatic Waves Live Background */}
      <WaveBackground />

      {/* TOP NAVBAR HEADER: CENTERED, MINIMAL */}
      <header className="relative z-20 w-full border-b border-white/[0.08] bg-black/70 backdrop-blur-md px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-center shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-zinc-700 via-zinc-800 to-zinc-900 border border-white/20 text-white shadow-sm shadow-black/50">
            <Layers className="h-4 w-4 text-slate-100" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white drop-shadow-sm">
              HomeSeva
            </span>
            <span className="rounded-md bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-slate-100 uppercase tracking-wider">
              ERP v1.2
            </span>
          </div>
        </div>
      </header>

      {/* CENTERED CONTAINER: BALANCED VERTICALLY BETWEEN HEADER & FOOTER */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full max-w-6xl mx-auto px-4 py-2 my-auto">
        {/* Hero Section */}
        <section className="text-center mb-6 sm:mb-7 shrink-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_3px_16px_rgba(0,0,0,0.9)]">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">HomeSeva</span>
          </h1>
          <p className="mt-1.5 text-sm sm:text-base md:text-lg text-slate-200 font-bold tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
            Centralized ERP v1.2
          </p>
        </section>

        {/* 10 BUSINESS CARDS (With Dynamic Specific-Color Glow & Enlargement on Hover) */}
        <section className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
            {BUSINESSES.map((biz) => {
              const IconComponent = biz.icon;
              return (
                <div
                  key={biz.id}
                  className={`group relative flex flex-col items-center justify-between text-center rounded-2xl bg-white p-4 sm:p-5 text-slate-900 shadow-xl shadow-black/40 border border-slate-100/90 hover:-translate-y-2.5 hover:scale-[1.06] hover:shadow-2xl transition-all duration-300 ease-out z-10 hover:z-30 cursor-pointer transform-gpu ${biz.hoverEffect}`}
                >
                  {/* 1. LOGO IN MIDDLE */}
                  <div className="flex flex-col items-center w-full">
                    {biz.logoImg ? (
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl overflow-hidden border shadow-xs mb-2 p-1 group-hover:scale-110 transition-transform duration-200 ${
                        biz.isGentleHairWigs ? 'border-amber-300/80 bg-white' : 'border-blue-400/80 bg-[#005eb8]'
                      }`}>
                        <img
                          src={biz.logoImg}
                          alt={biz.name}
                          width={44}
                          height={44}
                          loading="eager"
                          decoding="async"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${biz.bgColor} shadow-xs mb-2 group-hover:scale-110`}>
                        {IconComponent && <IconComponent className={`h-5 w-5 ${biz.color} group-hover:text-white transition-colors duration-200`} />}
                      </div>
                    )}

                    {/* 2. NAME */}
                    <Link
                      href={`/signin/${biz.slug}`}
                      className="text-xs sm:text-[13px] font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight line-clamp-1 hover:underline"
                    >
                      {biz.name}
                    </Link>

                    {/* 3. SUB-BUSINESS BUTTON(S) */}
                    {biz.isGentleHairWigs ? (
                      /* 3 SEPARATE BUTTONS (Viman Nagar, Ravet & Kolhapur) */
                      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 w-full">
                        <Link
                          href="/signin/gentle-hair-wigs?branch=viman-nagar"
                          className="inline-flex items-center justify-center rounded-md border border-amber-300/90 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-900 shadow-2xs transition-all hover:scale-105"
                          title="Studio of Viman Nagar"
                        >
                          Viman Nagar
                        </Link>
                        <Link
                          href="/signin/gentle-hair-wigs?branch=ravet"
                          className="inline-flex items-center justify-center rounded-md border border-amber-300/90 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-900 shadow-2xs transition-all hover:scale-105"
                          title="Studio of Ravet"
                        >
                          Ravet
                        </Link>
                        <Link
                          href="/signin/gentle-hair-wigs?branch=kolhapur"
                          className="inline-flex items-center justify-center rounded-md border border-amber-300/90 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-900 shadow-2xs transition-all hover:scale-105"
                          title="Studio of Kolhapur"
                        >
                          Kolhapur
                        </Link>
                      </div>
                    ) : biz.isHorecaEssentials ? (
                      /* 2 SEPARATE BUTTONS (Essentials Sales & Crockery Rental) */
                      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 w-full">
                        <Link
                          href="/signin/horeca-essentials?division=essentials-sales"
                          className="inline-flex items-center justify-center rounded-md border border-emerald-300/90 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-900 shadow-2xs transition-all hover:scale-105"
                          title="Essentials Sales"
                        >
                          Essentials Sales
                        </Link>
                        <Link
                          href="/signin/horeca-essentials?division=crockery-rental"
                          className="inline-flex items-center justify-center rounded-md border border-emerald-300/90 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-900 shadow-2xs transition-all hover:scale-105"
                          title="Crockery Rental"
                        >
                          Crockery Rental
                        </Link>
                      </div>
                    ) : (
                      /* Standard sub-business button */
                      <div className="mt-2 flex justify-center w-full">
                        <Link
                          href={`/signin/${biz.slug}`}
                          className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-[10.5px] font-bold shadow-2xs transition-all duration-150 hover:scale-105 line-clamp-1 ${biz.buttonStyle}`}
                        >
                          {biz.subtitle}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* 4. GO BUTTON */}
                  <div className="mt-2.5 w-full pt-2 border-t border-slate-100 flex items-center justify-center">
                    <Link
                      href={`/signin/${biz.slug}`}
                      className="inline-flex items-center space-x-1 rounded-full px-3 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50/80 group-hover:bg-blue-600 group-hover:text-white transition-all duration-150"
                    >
                      <span>Go</span>
                      <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="relative z-10" />
    </main>
  );
}
