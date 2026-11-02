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
        <div className="h-48 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
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
              {/* Tooltip */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-zinc-900 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap z-20 dark:bg-zinc-700">
                {formatMonth(item.month) || item.label}: {formatCurrency(totalNum, currency)} ({item.count})
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 shadow-xs cursor-pointer"
              />

              {/* Label */}
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[48px]">
                {formatMonth(item.month) || item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
