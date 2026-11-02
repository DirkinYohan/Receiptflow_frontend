'use client';

import React from 'react';
import { CategoryExpense } from '@/types/report';
import { formatCurrency } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

export function CategoryBreakdownChart({
  data,
  currency = 'COP',
  loading = false,
}: {
  data: CategoryExpense[];
  currency?: string;
  loading?: boolean;
}) {
  const { locale, t } = useI18n();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
        {t('reports.noCategoryData')}
      </div>
    );
  }

  const overallTotal = data.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 1;

  const defaultColors = [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#64748b',
  ];

  return (
    <div className="space-y-4">
      {data.slice(0, 6).map((cat, idx) => {
        const totalNum = Number(cat.total) || 0;
        const pct = Math.round((totalNum / overallTotal) * 100);
        const color = cat.color || defaultColors[idx % defaultColors.length];

        return (
          <div key={cat.category_id || idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {localizeCategoryName(cat, locale) || t('common.noCategory')}
                </span>
                <span className="text-zinc-400 text-xs dark:text-zinc-500">({cat.count} reg.)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(totalNum, currency)}
                </span>
                <span className="text-zinc-400 font-medium text-xs w-8 text-right dark:text-zinc-500">
                  {pct}%
                </span>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
