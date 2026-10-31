'use client';

import React from 'react';
import Link from 'next/link';
import { RecentDocumentItem, RecentExpenseItem } from '@/types/report';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/features/documents/StatusBadge';
import { useI18n } from '@/providers/I18nProvider';
import { ArrowRight } from 'lucide-react';

export function RecentActivity({
  expenses,
  documents,
  loading = false,
}: {
  expenses: RecentExpenseItem[];
  documents: RecentDocumentItem[];
  loading?: boolean;
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900">{t('dashboard.recentExpenses')}</h3>
          <Link href="/expenses" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
            {t('dashboard.seeAll')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {expenses.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">{t('dashboard.noExpenses')}</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {expenses.slice(0, 5).map((expense) => (
              <li key={expense.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">{expense.description || t('dashboard.noDescription')}</p>
                  <p className="text-xs text-stone-500">
                    {expense.supplier.name || t('dashboard.noSupplier')} · {formatDate(expense.incurred_at) || t('common.noDate')}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-stone-900">{formatCurrency(expense.amount, expense.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900">{t('dashboard.recentDocuments')}</h3>
          <Link href="/documents" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
            {t('dashboard.seeAll')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">{t('dashboard.noDocuments')}</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {documents.slice(0, 5).map((doc) => (
              <li key={doc.id}>
                <Link href={`/documents/${doc.id}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900">{doc.supplier_name || doc.title}</p>
                    <p className="text-xs text-stone-500">{formatDate(doc.issued_at || doc.created_at) || t('common.noDate')}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold text-stone-900">
                      {doc.total_amount ? formatCurrency(doc.total_amount, doc.currency) : t('common.emptyValue')}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
