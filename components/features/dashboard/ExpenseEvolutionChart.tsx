'use client';

import React from 'react';
import { MonthlyExpense } from '@/types/report';
import { useI18n } from '@/providers/I18nProvider';
import { formatCurrency, formatMonth } from '@/lib/formatters';

export function ExpenseEvolutionChart({
  data,
  currency = 'COP',
  loading = false,
}: {
  data: MonthlyExpense[];
  currency?: string;
  loading?: boolean;
}) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="h-48 w-full bg-stone-100 dark:bg-stone-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
        {t('reports.noMonthlyData')}
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => Number(d.total) || 0), 1);

  return (
    <div className="space-y-4">
      <div className="h-60 flex items-end gap-2 sm:gap-4 pt-6 pb-2">
        {data.map((item, index) => {
          const totalNum = Number(item.total) || 0;
          const heightPercent = Math.max(Math.round((totalNum / maxTotal) * 100), 6);

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
            >
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-stone-900 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap z-20 dark:bg-stone-700">
                {formatMonth(item.month) || item.label}: {formatCurrency(totalNum, currency)} ({item.count})
              </div>

              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-400 transition-all duration-300 shadow-xs cursor-pointer"
              />

              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate max-w-[48px]">
                {formatMonth(item.month) || item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
