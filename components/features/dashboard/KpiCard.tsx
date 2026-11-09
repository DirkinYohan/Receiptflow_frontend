import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  changePct?: number;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'violet' | 'rose';
  loading?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  changePct,
  icon: Icon,
  variant = 'emerald',
  loading = false,
}: KpiCardProps) {
  const iconVariants = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
  };

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconVariants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-28 bg-stone-200 dark:bg-stone-800 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {value}
          </h3>
        )}

        <div className="mt-2 flex items-center gap-2">
          {changePct !== undefined && !loading && (
            <span
              className={`inline-flex items-center text-xs font-semibold ${
                changePct >= 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {changePct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
              )}
              {changePct > 0 ? `+${changePct}%` : `${changePct}%`}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
