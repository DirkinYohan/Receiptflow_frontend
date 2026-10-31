'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Repeat } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PaymentStatus } from '@/components/features/documents/PaymentStatus';
import { documentsService } from '@/services/documents.service';
import { expensesService } from '@/services/expenses.service';
import { DueState, PayableItem, PayablesOverview } from '@/types/document';
import { RecurringItem, RecurringState } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

const BUCKETS: DueState[] = ['overdue', 'due_soon', 'upcoming', 'no_due_date'];

const BUCKET_STYLE: Record<DueState, string> = {
  overdue: 'text-red-700',
  due_soon: 'text-orange-700',
  upcoming: 'text-stone-700',
  no_due_date: 'text-stone-500',
};

const RECURRING_STYLE: Record<RecurringState, string> = {
  missing: 'border-red-200 bg-red-50 text-red-800',
  due_soon: 'border-orange-200 bg-orange-50 text-orange-800',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

// Dates without time (YYYY-MM-DD) are read at midday so the local timezone can't shift the day.
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
  const [overview, setOverview] = useState<PayablesOverview | null>(null);
  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setHasError(false);
    try {
      const [payablesRes, recurringRes] = await Promise.all([
        documentsService.getPayables(),
        expensesService.getRecurring(),
      ]);
      setOverview(payablesRes.data ?? null);
      setRecurring(recurringRes.data ?? []);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async (item: PayableItem) => {
    setPayingId(item.id);
    try {
      await documentsService.updateDocument(item.id, { is_paid: true });
      toastSuccess(t('payables.marked'));
      setOverview((prev) =>
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
    } catch {
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
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{t('payables.title')}</h2>
        <p className="mt-1 text-sm text-stone-500">{t('payables.subtitle')}</p>
      </div>

      {!hasPayables ? (
        <EmptyState icon={CalendarClock} title={t('payables.emptyTitle')} description={t('payables.emptyText')} />
      ) : (
        <div className="space-y-6">
          {BUCKETS.filter((bucket) => overview.buckets[bucket].length > 0).map((bucket) => (
            <section key={bucket} className="rounded-2xl border border-stone-200 bg-white shadow-sm">
              <header className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
                <h3 className={`text-sm font-semibold ${BUCKET_STYLE[bucket]}`}>
                  {t(`payables.${bucket}`)} · {overview.buckets[bucket].length}
                </h3>
                <span className={`text-sm font-semibold ${BUCKET_STYLE[bucket]}`}>
                  {formatCurrency(overview.totals[bucket])}
                </span>
              </header>
              <ul className="divide-y divide-stone-100">
                {overview.buckets[bucket].map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/documents/${item.id}`} className="min-w-0 hover:underline">
                      <p className="truncate font-medium text-stone-900">{item.supplier_name || item.title}</p>
                      <p className="text-sm text-stone-500">
                        {[localizeCategoryName(item.category_name, locale), item.due_date ? formatDate(item.due_date) : null, dueLabel(item, t)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">{formatCurrency(item.total_amount, item.currency)}</span>
                      <PaymentStatus paid={false} busy={payingId === item.id} onChange={() => markPaid(item)} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Repeat className="mt-0.5 h-5 w-5 text-emerald-700" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-stone-900">{t('payables.recurringTitle')}</h3>
            <p className="text-sm text-stone-500">{t('payables.recurringHint')}</p>
          </div>
        </div>
        {recurring.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">{t('payables.recurringEmpty')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {recurring.map((item) => (
              <li
                key={`${item.supplier_id ?? item.name}`}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link href={`/expenses/${item.last_expense_id}`} className="min-w-0 hover:underline">
                  <p className="truncate font-medium text-stone-900">{item.name}</p>
                  <p className="text-sm text-stone-500">
                    {[t(`payables.freq_${item.frequency}`), localizeCategoryName(item.category_name, locale), `${t('payables.next')}: ${dayOnly(item.next_expected)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-stone-600">
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
