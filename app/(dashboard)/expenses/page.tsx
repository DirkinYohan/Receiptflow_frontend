'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Search, Receipt, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ExpenseFormModal } from '@/components/features/expenses/ExpenseFormModal';
import { expensesService } from '@/services/expenses.service';
import { useAvailableCategories, useExpenseStats, useExpenses } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';
import { ExpensesTable } from '@/components/features/expenses/ExpensesTable';

export default function ExpensesPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { success: toastSuccess, error: toastError } = useToast();

  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [ordering, setOrdering] = useState('-incurred_at');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<'xlsx' | 'csv' | null>(null);

  const handleExport = async (fileFormat: 'xlsx' | 'csv') => {
    setExporting(fileFormat);
    try {
      await expensesService.exportExpenses(fileFormat, categoryFilter ? { category: categoryFilter } : {});
    } catch {
      toastError(t('expenses.exportError'));
    } finally {
      setExporting(null);
    }
  };

  const filters = {
    ...(categoryFilter ? { category: Number(categoryFilter) } : {}),
    ...(paymentFilter ? { payment_method: paymentFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const expensesQuery = useExpenses({ ...filters, page: currentPage, page_size: 15, ordering });
  const statsQuery = useExpenseStats(filters);
  const { data: categories = [] } = useAvailableCategories();
  const expenses = expensesQuery.data?.results ?? [];
  const totalCount = expensesQuery.data?.count ?? 0;
  const totalPages = expensesQuery.data?.total_pages ?? 1;
  const stats = statsQuery.data ?? null;
  const isLoading = expensesQuery.isPending;
  const hasError = expensesQuery.isError && !expensesQuery.data;

  const handleDelete = async (expense: Expense, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t('expenses.deleteNamed', { name: expense.description }))) return;

    setDeletingId(expense.id);
    try {
      await expensesService.deleteExpense(expense.id);
      queryClient.removeQueries({ queryKey: qk.expenses.detail(expense.id) });
      toastSuccess(t('expenses.deleted'));
      invalidateAfter(queryClient, 'expense');
    } catch {
      toastError(t('expenses.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (expense: Expense, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('expenses.title')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('expenses.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
          <Button
            onClick={() => {
              setSelectedExpense(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('expenses.new')}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t('expenses.filtered')}
            </span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {formatCurrency(stats.total_amount)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t('expenses.average')}
            </span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {formatCurrency(stats.average_amount)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t('expenses.totalCount')}
            </span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {stats.count}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t('expenses.recurringCount')}
            </span>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.recurring_count}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-5 lg:col-span-6">
          <Input
            placeholder={t('expenses.search')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="sm:col-span-3 lg:col-span-2">
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('expenses.allCategories')}
            options={[
              { value: '', label: t('expenses.allCategories') },
              ...categories.map((c) => ({ value: c.id, label: localizeCategoryName(c, locale) })),
            ]}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <Select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('expenses.allMethods')}
            options={[
              { value: '', label: t('expenses.allMethods') },
              { value: 'cash', label: t('method.cash') },
              { value: 'card', label: t('method.card') },
              { value: 'transfer', label: t('method.transfer') },
              { value: 'digital', label: t('method.digital') },
            ]}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <Select
            value={ordering}
            onChange={(e) => {
              setOrdering(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '-incurred_at', label: t('expenses.sortRecent') },
              { value: 'incurred_at', label: t('expenses.sortOldest') },
              { value: '-amount', label: t('expenses.sortHigh') },
              { value: 'amount', label: t('expenses.sortLow') },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text={t('expenses.loading')} />
        </div>
      ) : hasError ? (
        <ErrorState
          title={t('common.errorTitle')}
          message={t('expenses.loadError')}
          onRetry={() => expensesQuery.refetch()}
        />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t('expenses.empty')}
          description={
            searchQuery || categoryFilter || paymentFilter
              ? t('expenses.emptyFiltered')
              : t('expenses.empty')
          }
          action={
            <Button
              onClick={() => {
                setSelectedExpense(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('expenses.new')}
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <ExpensesTable
              expenses={expenses}
              deletingId={deletingId}
              onOpen={(id) => router.push(`/expenses/${id}`)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={15}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onSuccess={() => undefined}
      />
    </div>
  );
}
