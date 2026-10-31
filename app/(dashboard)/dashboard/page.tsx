'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, FileText, RefreshCw, Upload, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { RecentActivity } from '@/components/features/dashboard/RecentActivity';
import { BudgetSummary } from '@/components/features/categories/BudgetsPanel';
import { reportsService } from '@/services/reports.service';
import { documentsService } from '@/services/documents.service';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import {
  DashboardSummary,
  MonthlyExpense,
  RecentDocumentItem,
  RecentExpenseItem,
} from '@/types/report';
import { DocumentStats, PayablesOverview } from '@/types/document';
import { useI18n } from '@/providers/I18nProvider';

const PERIODS = [
  { labelKey: 'dashboard.period1', value: 1 },
  { labelKey: 'dashboard.period3', value: 3 },
  { labelKey: 'dashboard.period6', value: 6 },
  { labelKey: 'dashboard.period12', value: 12 },
];

export default function DashboardPage() {
  const { t } = useI18n();
  const [periodMonths, setPeriodMonths] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [docStats, setDocStats] = useState<DocumentStats | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpenseItem[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocumentItem[]>([]);
  const [payables, setPayables] = useState<PayablesOverview | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [summaryRes, docStatsRes, monthlyRes, recentExpRes, recentDocRes, payablesRes] = await Promise.all([
        reportsService.getDashboardSummary({ months: periodMonths }),
        documentsService.getStats(),
        reportsService.getMonthlyExpenses({ months: periodMonths }),
        reportsService.getRecentExpenses(5),
        reportsService.getRecentDocuments(5),
        documentsService.getPayables(),
      ]);
      if (summaryRes.data) setSummary(summaryRes.data);
      if (docStatsRes.data) setDocStats(docStatsRes.data);
      if (monthlyRes.data) setMonthlyExpenses(monthlyRes.data);
      if (recentExpRes.data) setRecentExpenses(recentExpRes.data);
      if (recentDocRes.data) setRecentDocuments(recentDocRes.data);
      if (payablesRes.data) setPayables(payablesRes.data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [periodMonths]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (hasError) {
    return (
      <div className="py-12">
        <ErrorState title={t('common.errorTitle')} message={t('dashboard.loadError')} onRetry={fetchDashboardData} />
      </div>
    );
  }

  const reviewCount = (docStats?.review_required || 0) + (docStats?.failed || 0);
  const overdue = payables?.buckets.overdue ?? [];
  const dueSoon = payables?.buckets.due_soon ?? [];
  const urgent = overdue.length ? overdue : dueSoon;
  const thisMonth = monthlyExpenses.length ? monthlyExpenses[monthlyExpenses.length - 1] : null;
  const maxMonth = Math.max(...monthlyExpenses.map((item) => Number(item.total) || 0), 1);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{t('dashboard.title')}</h2>
          <p className="mt-1 text-sm text-stone-500">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-stone-200 bg-white p-1">
            {PERIODS.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => setPeriodMonths(period.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  periodMonths === period.value ? 'bg-stone-900 text-white' : 'text-stone-600'
                }`}
              >
                {t(period.labelKey)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            aria-label={t('common.refresh')}
            className="rounded-xl border border-stone-200 bg-white p-2 text-stone-600"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/documents">
            <Button size="sm" leftIcon={<Upload className="h-4 w-4" />}>
              {t('dashboard.upload')}
            </Button>
          </Link>
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-700" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-orange-950">
                {reviewCount === 1 ? t('dashboard.reviewBannerOne') : t('dashboard.reviewBanner', { count: reviewCount })}
              </p>
              <p className="text-sm text-orange-800">{t('dashboard.reviewHint')}</p>
            </div>
          </div>
          <Link href="/review">
            <Button variant="outline" size="sm">{t('dashboard.reviewNow')}</Button>
          </Link>
        </div>
      )}

      {urgent.length > 0 && (
        <div
          className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            overdue.length ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <CalendarClock className={`mt-0.5 h-5 w-5 ${overdue.length ? 'text-red-700' : 'text-amber-700'}`} aria-hidden />
            <div>
              <p className={`text-sm font-semibold ${overdue.length ? 'text-red-950' : 'text-amber-950'}`}>
                {t(overdue.length ? 'dashboard.payBannerOverdue' : 'dashboard.payBannerSoon', {
                  count: urgent.length,
                  amount: formatCurrency(payables?.totals[overdue.length ? 'overdue' : 'due_soon'] ?? 0),
                })}
              </p>
              <p className={`text-sm ${overdue.length ? 'text-red-800' : 'text-amber-800'}`}>{t('dashboard.payBannerHint')}</p>
            </div>
          </div>
          <Link href="/payables">
            <Button variant="outline" size="sm">{t('dashboard.payNow')}</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title={t('dashboard.totalSpent')} value={formatCurrency(summary?.total_expenses ?? 0)} icon={Wallet} loading={isLoading} />
        <SummaryCard title={t('dashboard.thisMonth')} value={formatCurrency(thisMonth?.total ?? 0)} hint={thisMonth?.label} icon={Clock} loading={isLoading} />
        <SummaryCard title={t('dashboard.processed')} value={docStats?.completed ?? 0} icon={CheckCircle2} loading={isLoading} />
        <SummaryCard title={t('dashboard.needsReview')} value={docStats?.review_required ?? 0} icon={AlertTriangle} loading={isLoading} />
        <SummaryCard title={t('dashboard.unpaid')} value={docStats?.unpaid ?? 0} icon={FileText} loading={isLoading} />
        <SummaryCard title={t('dashboard.paid')} value={docStats?.paid ?? 0} icon={CheckCircle2} loading={isLoading} />
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">{t('dashboard.monthly')}</h3>
        <div className="mt-4 space-y-3">
          {monthlyExpenses.map((item) => {
            const width = Math.max(4, Math.round(((Number(item.total) || 0) / maxMonth) * 100));
            return (
              <div key={item.month} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-sm">
                <span className="text-stone-500">{formatMonth(item.month) || item.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${width}%` }} />
                </div>
                <span className="font-medium text-stone-800">{formatCurrency(item.total)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <BudgetSummary />

      <RecentActivity expenses={recentExpenses} documents={recentDocuments} loading={isLoading} />
    </div>
  );
}
