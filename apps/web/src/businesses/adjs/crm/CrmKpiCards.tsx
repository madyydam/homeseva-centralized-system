'use client';

import {
  Users,
  CheckCircle2,
  ThumbsUp,
  FileText,
  Clock,
  PhoneOff,
  UserX,
} from 'lucide-react';
import { PrintboothLeadItem } from '../types';
import { normalizeStatus } from './crmUtils';

export interface MonthKpiStats {
  total: number;
  converted: number;
  interested: number;
  followUp: number;
  notPicked: number;
  notInterested: number;
}

interface CrmKpiCardsProps {
  stats: MonthKpiStats;
  currentFilter: string;
  onFilterChange: (status: string) => void;
}

export function CrmKpiCards({
  stats,
  currentFilter,
  onFilterChange,
}: CrmKpiCardsProps) {
  const normCurrent = normalizeStatus(currentFilter);

  const CARDS = [
    {
      id: 'all',
      label: 'TOTAL INQUIRIES',
      count: stats.total,
      sublabel: 'ALL ACTIVE',
      icon: Users,
      color: 'purple',
      badgeClass: 'border-purple-200 bg-purple-50 text-purple-900',
      activeRing: 'ring-2 ring-purple-600',
    },
    {
      id: 'converted',
      label: 'MACHINES SOLD',
      count: stats.converted,
      sublabel: 'CONVERTED',
      icon: CheckCircle2,
      color: 'emerald',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      activeRing: 'ring-2 ring-emerald-600',
    },
    {
      id: 'interested',
      label: 'INTERESTED',
      count: stats.interested,
      sublabel: 'WARM LEADS',
      icon: ThumbsUp,
      color: 'blue',
      badgeClass: 'border-blue-200 bg-blue-50 text-blue-900',
      activeRing: 'ring-2 ring-blue-600',
    },
    {
      id: 'followup',
      label: 'FOLLOW-UPS',
      count: stats.followUp,
      sublabel: 'SCHEDULED',
      icon: Clock,
      color: 'indigo',
      badgeClass: 'border-indigo-200 bg-indigo-50 text-indigo-900',
      activeRing: 'ring-2 ring-indigo-600',
    },
    {
      id: 'notpicked',
      label: 'NOT PICKED',
      count: stats.notPicked,
      sublabel: 'RE-DIAL',
      icon: PhoneOff,
      color: 'amber',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
      activeRing: 'ring-2 ring-amber-600',
    },
    {
      id: 'notinterested',
      label: 'NOT INTERESTED',
      count: stats.notInterested,
      sublabel: 'CLOSED',
      icon: UserX,
      color: 'rose',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-900',
      activeRing: 'ring-2 ring-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const isSelected = normCurrent === card.id;
        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className={`rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer shadow-xs hover:scale-[1.02] flex flex-col justify-between ${
              card.badgeClass
            } ${isSelected ? card.activeRing : 'border-slate-200/80 bg-white hover:bg-slate-50'}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <Icon className="h-4 w-4 opacity-70" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-slate-900">
                {card.count}
              </span>
              <span className="text-[9.5px] font-bold text-slate-500 uppercase">
                {card.sublabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

