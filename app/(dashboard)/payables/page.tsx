'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { CalendarClock, Repeat } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PaymentStatus } from '@/components/features/documents/PaymentStatus';
import { documentsService } from '@/services/documents.service';
import { usePayables, useRecurringExpenses } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { DueState, PayableItem, PayablesOverview } from '@/types/document';
import { RecurringItem, RecurringState } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

const BUCKETS: DueState[] = ['overdue', 'due_soon', 'upcoming', 'no_due_date'];

const BUCKET_STYLE: Record<DueState, string> = {
  overdue: 'text-red-700 dark:text-red-300',
  due_soon: 'text-orange-700 dark:text-orange-300',
  upcoming: 'text-stone-700 dark:text-stone-300',
  no_due_date: 'text-stone-500 dark:text-stone-400',
};

const RECURRING_STYLE: Record<RecurringState, string> = {
  missing: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
  due_soon: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
};

const dayOnly = (value: string) => formatDate(`${value}T12:00:00`);

function dueLabel(item: PayableItem, t: (key: string, params?: Record<string, string | number>) => string) {
  if (item.days_until_due == null) return '';
  if (item.days_until_due < 0) return t('payables.daysLate', { days: -item.days_until_due });
  if (item.days_until_due === 0) return t('payables.today');
  return t('payables.daysLeft', { days: item.days_until_due });
}

export default function PayablesPage() {
  const { locale, t } = useI18n();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<number | null>(null);

  const payablesQuery = usePayables();
  const recurringQuery = useRecurringExpenses();
  const overview = payablesQuery.data ?? null;
  const recurring: RecurringItem[] = recurringQuery.data ?? [];
  const isLoading = payablesQuery.isPending || recurringQuery.isPending;
  const hasError = payablesQuery.isError && !payablesQuery.data;
  const load = () => {
    payablesQuery.refetch();
    recurringQuery.refetch();
  };

  const markPaid = async (item: PayableItem) => {
    const previous = queryClient.getQueryData<PayablesOverview>(qk.documents.payables);
    queryClient.setQueryData<PayablesOverview>(qk.documents.payables, (prev) =>
      prev
        ? {
            ...prev,
            buckets: {
              ...prev.buckets,
              [item.state]: prev.buckets[item.state].filter((doc) => doc.id !== item.id),
            },
            totals: {
              ...prev.totals,
              [item.state]: Number(prev.totals[item.state]) - Number(item.total_amount),
            },
          }
        : prev
    );
    setPayingId(item.id);
    try {
      await documentsService.updateDocument(item.id, { is_paid: true });
      toastSuccess(t('payables.marked'));
      invalidateAfter(queryClient, 'documentPaid');
    } catch {
      queryClient.setQueryData(qk.documents.payables, previous);
      toastError(t('common.errorTitle'));
    } finally {
      setPayingId(null);
    }
  };

  if (isLoading) return <LoadingState text={t('common.loading')} />;
  if (hasError || !overview) {
    return (
      <div className="py-12">
        <ErrorState title={t('common.errorTitle')} message={t('dashboard.loadError')} onRetry={load} />
      </div>
    );
  }

  const hasPayables = BUCKETS.some((bucket) => overview.buckets[bucket].length > 0);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{t('payables.title')}</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('payables.subtitle')}</p>
      </div>

      {!hasPayables ? (
        <EmptyState icon={CalendarClock} title={t('payables.emptyTitle')} description={t('payables.emptyText')} />
      ) : (
        <div className="space-y-6">
          {BUCKETS.filter((bucket) => overview.buckets[bucket].length > 0).map((bucket) => (
            <section key={bucket} className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <header className="flex items-center justify-between border-b border-stone-100 px-5 py-3 dark:border-stone-800">
                <h3 className={`text-sm font-semibold ${BUCKET_STYLE[bucket]}`}>
                  {t(`payables.${bucket}`)} · {overview.buckets[bucket].length}
                </h3>
                <span className={`text-sm font-semibold ${BUCKET_STYLE[bucket]}`}>
                  {formatCurrency(overview.totals[bucket])}
                </span>
              </header>
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {overview.buckets[bucket].map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/documents/${item.id}`} className="min-w-0 hover:underline">
                      <p className="truncate font-medium text-stone-900 dark:text-stone-100">{item.supplier_name || item.title}</p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {[localizeCategoryName(item.category_name, locale), item.due_date ? formatDate(item.due_date) : null, dueLabel(item, t)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{formatCurrency(item.total_amount, item.currency)}</span>
                      <PaymentStatus paid={false} busy={payingId === item.id} onChange={() => markPaid(item)} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start gap-3">
          <Repeat className="mt-0.5 h-5 w-5 text-emerald-700 dark:text-emerald-300" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('payables.recurringTitle')}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">{t('payables.recurringHint')}</p>
          </div>
        </div>
        {recurring.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">{t('payables.recurringEmpty')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {recurring.map((item) => (
              <li
                key={`${item.supplier_id ?? item.name}`}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link href={`/expenses/${item.last_expense_id}`} className="min-w-0 hover:underline">
                  <p className="truncate font-medium text-stone-900 dark:text-stone-100">{item.name}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {[t(`payables.freq_${item.frequency}`), localizeCategoryName(item.category_name, locale), `${t('payables.next')}: ${dayOnly(item.next_expected)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {t('payables.average')} {formatCurrency(item.average_amount, item.currency)}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RECURRING_STYLE[item.state]}`}>
                    {t(`payables.state_${item.state}`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
