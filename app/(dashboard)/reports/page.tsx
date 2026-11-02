'use client';

import React, { useState } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { Calendar, Building2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ExpenseEvolutionChart } from '@/components/features/dashboard/ExpenseEvolutionChart';
import { CategoryBreakdownChart } from '@/components/features/dashboard/CategoryBreakdownChart';
import {
  useDashboardSummary,
  useExpensesByCategory,
  useExpensesBySupplier,
  useMonthlyExpenses,
} from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { expensesService } from '@/services/expenses.service';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, localDateInput } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';

type Preset = 'month' | 'quarter' | 'year' | 'all';

const PRESETS: { id: Preset; labelKey: string }[] = [
  { id: 'month', labelKey: 'reports.presetMonth' },
  { id: 'quarter', labelKey: 'reports.presetQuarter' },
  { id: 'year', labelKey: 'reports.presetYear' },
  { id: 'all', labelKey: 'reports.presetAll' },
];

/** Start day of a preset; "all" starts at the user's oldest expense. */
async function presetStart(preset: Preset, client: QueryClient): Promise<string> {
  const now = new Date();
  if (preset === 'month') return localDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  if (preset === 'year') return localDateInput(new Date(now.getFullYear(), 0, 1));
  if (preset === 'quarter') return localDateInput(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()));
  // Same parameters as any expenses list, so it shares the cache (and its invalidation).
  const oldestParams = { ordering: 'incurred_at', page_size: 1 };
  const oldest = await client.fetchQuery({
    queryKey: qk.expenses.list(oldestParams),
    queryFn: () => expensesService.getExpenses(oldestParams),
    staleTime: 60_000,
  });
  const first = oldest.results?.[0]?.incurred_at;
  return localDateInput(first ? new Date(first) : now);
}

export default function ReportsPage() {
  const { t } = useI18n();

  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return localDateInput(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()));
  });
  const [endDate, setEndDate] = useState(() => localDateInput());
  const [preset, setPreset] = useState<Preset | null>('quarter');
  const queryClient = useQueryClient();

  const choosePreset = async (next: Preset) => {
    setPreset(next);
    const start = await presetStart(next, queryClient);
    setStartDate(start);
    setEndDate(localDateInput());
  };

  // Plain days: the server reads them as whole local days, so today's expenses are included.
  // Same range = same cache entry; a new range keeps the old numbers visible until it arrives.
  const range = { start_date: startDate, end_date: endDate };
  const summaryQuery = useDashboardSummary(range);
  const monthlyQuery = useMonthlyExpenses(range);
  const categoryQuery = useExpensesByCategory(range);
  const supplierQuery = useExpensesBySupplier(range);
  const summary = summaryQuery.data ?? null;
  const monthlyExpenses = monthlyQuery.data ?? [];
  const categoryExpenses = categoryQuery.data ?? [];
  const supplierExpenses = supplierQuery.data ?? [];
  const isLoading = summaryQuery.isPending;
  const hasError = summaryQuery.isError && !summaryQuery.data;
  const fetchAnalytics = () => {
    summaryQuery.refetch();
    monthlyQuery.refetch();
    categoryQuery.refetch();
    supplierQuery.refetch();
  };

  const [exporting, setExporting] = useState<'xlsx' | 'csv' | null>(null);
  const { error: toastError } = useToast();

  const handleExport = async (fileFormat: 'xlsx' | 'csv') => {
    setExporting(fileFormat);
    try {
      await expensesService.exportExpenses(fileFormat, { start_date: startDate, end_date: endDate });
    } catch {
      toastError(t('expenses.exportError'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('reports.title')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={t('reports.title')}
            className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            {PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={preset === item.id}
                onClick={() => choosePreset(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  preset === item.id
                    ? 'bg-stone-900 text-white dark:bg-stone-700'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-zinc-400 ml-1.5 dark:text-zinc-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPreset(null);
                setStartDate(e.target.value);
              }}
              className="text-xs bg-transparent border-0 focus:outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer"
            />
            <span className="text-zinc-300 dark:text-zinc-700 text-xs">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPreset(null);
                setEndDate(e.target.value);
              }}
              className="text-xs bg-transparent border-0 focus:outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => handleExport('xlsx')}
            isLoading={exporting === 'xlsx'}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t('expenses.exportExcel')}
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} isLoading={exporting === 'csv'}>
            {t('expenses.exportCsv')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" text={t('reports.loading')} />
        </div>
      ) : hasError ? (
        <ErrorState
          title={t('reports.loadErrorTitle')}
          message={t('reports.loadError')}
          onRetry={fetchAnalytics}
        />
      ) : (
        <div className="space-y-8">
          {/* Key Period Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block dark:text-zinc-500">
                {t('reports.periodTotal')}
              </span>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatCurrency(summary?.total_expenses ?? 0)}
              </p>
              <span className="text-xs text-zinc-500 mt-1 block dark:text-zinc-400">
                {t('reports.expensesCounted', { count: summary?.expenses_count ?? 0 })}
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block dark:text-zinc-500">
                {t('reports.average')}
              </span>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatCurrency(summary?.average_expense ?? 0)}
              </p>
              <span className="text-xs text-zinc-500 mt-1 block dark:text-zinc-400">{t('reports.perTransaction')}</span>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block dark:text-zinc-500">
                {t('reports.max')}
              </span>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatCurrency(summary?.max_expense ?? 0)}
              </p>
              <span className="text-xs text-zinc-500 mt-1 block dark:text-zinc-400">{t('reports.maxHint')}</span>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block dark:text-zinc-500">
                {t('reports.receipts')}
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {summary?.documents_processed ?? 0} / {summary?.documents_count ?? 0}
              </p>
              <span className="text-xs text-zinc-500 mt-1 block dark:text-zinc-400">{t('reports.processed')}</span>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('reports.monthly')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseEvolutionChart data={monthlyExpenses} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('reports.byCategory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryBreakdownChart data={categoryExpenses} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Suppliers Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{t('reports.topSuppliers')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {supplierExpenses.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  {t('reports.noSupplierData')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[11px] dark:text-zinc-400">
                      <tr>
                        <th className="py-2.5 px-4">{t('reports.colSupplier')}</th>
                        <th className="py-2.5 px-4">{t('reports.id')}</th>
                        <th className="py-2.5 px-4 text-center">{t('reports.colTransactions')}</th>
                        <th className="py-2.5 px-4 text-right">{t('reports.colTotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                      {supplierExpenses.map((sup, idx) => (
                        <tr key={sup.supplier_id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                            {sup.name || t('reports.unknownSupplier')}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                            {sup.tax_id || '—'}
                          </td>
                          <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-300">
                            {sup.count}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(sup.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
