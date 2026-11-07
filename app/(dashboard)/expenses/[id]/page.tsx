'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Repeat,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExpenseFormModal } from '@/components/features/expenses/ExpenseFormModal';
import { DocumentBreakdown } from '@/components/features/documents/DocumentBreakdown';
import { expensesService } from '@/services/expenses.service';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { useExpense } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const expId = Number(params.id);
  const { locale, t } = useI18n();

  const { success: toastSuccess, error: toastError } = useToast();

  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const expenseQuery = useExpense(expId);
  const expense = expenseQuery.data ?? null;
  const isLoading = expenseQuery.isPending;
  const hasError = expenseQuery.isError;

  const handleDelete = async () => {
    if (!confirm(t('expenses.deleteConfirm'))) return;
    try {
      await expensesService.deleteExpense(expId);
      queryClient.removeQueries({ queryKey: qk.expenses.detail(expId) });
      invalidateAfter(queryClient, 'expense');
      toastSuccess(t('expenses.deleted'));
      router.push('/expenses');
    } catch {
      toastError(t('expenses.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" text={t('expenses.loadingDetail')} />
      </div>
    );
  }

  if (hasError || !expense) {
    return (
      <div className="py-12">
        <ErrorState
          title={t('expenses.notFound')}
          message={t('expenses.notFoundText')}
          onRetry={() => expenseQuery.refetch()}
        />
      </div>
    );
  }

  const lineItems = expense.line_items || [];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/expenses"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {expense.description}
              </h2>
              {expense.is_recurring && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <Repeat className="w-3 h-3" />
                  <span>{t('expenses.recurring')}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 dark:text-zinc-500">
              {t('expenses.registeredOn', { date: formatDateTime(expense.created_at) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            {t('expenses.edit')}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            leftIcon={<Trash2 className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block dark:text-zinc-500">
            {t('expenses.totalAmount')}
          </span>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            {formatCurrency(expense.total_amount, expense.currency)}
          </p>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{t('expenses.currencyLabel', { currency: expense.currency })}</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block dark:text-zinc-500">
            {t('expenses.colCategory')}
          </span>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {localizeCategoryName(expense.category_name, locale) || t('common.noCategory')}
          </p>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{t('expenses.categoryHint')}</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block dark:text-zinc-500">
            {t('expenses.supplier')}
          </span>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate">
            {expense.supplier_name || t('dashboard.noSupplier')}
          </p>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{t('expenses.supplierHint')}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('expenses.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">{t('expenses.incurredAt')}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatDateTime(expense.incurred_at)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">{t('expenses.paymentMethod')}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {expense.payment_method
                    ? t(`method.${expense.payment_method}`)
                    : t('method.empty')}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">{t('expenses.tax')}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {expense.tax_amount != null && expense.tax_amount !== ''
                    ? formatCurrency(expense.tax_amount, expense.currency)
                    : ''}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">{t('expenses.reimbursable')}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {expense.is_reimbursable ? t('common.yes') : t('common.no')}
                </span>
              </div>

              {expense.notes && (
                <div className="pt-2">
                  <span className="text-zinc-500 block mb-1 dark:text-zinc-400">{t('expenses.notes')}</span>
                  <p className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300">
                    {expense.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{t('detail.original')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center flex-1 flex flex-col justify-center items-center">
              {expense.document ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {t('expenses.fromDocument')}
                    </p>
                  </div>
                  <Link href={`/documents/${expense.document}`}>
                    <Button variant="outline" size="sm">
                      {t('expenses.openDocument')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {t('expenses.manual')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {lineItems.length > 0 && (
        <DocumentBreakdown lineItems={lineItems} currency={expense.currency} />
      )}

      <ExpenseFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        expense={expense}
        onSuccess={() => undefined}
      />
    </div>
  );
}
