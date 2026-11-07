'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Star,
  Edit,
  Trash2,
  Mail,
  Phone,
  FileText,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { SupplierFormModal } from '@/components/features/suppliers/SupplierFormModal';
import { suppliersService } from '@/services/suppliers.service';
import { Supplier } from '@/types/supplier';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/providers/I18nProvider';
import { useSuppliers } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { PaginatedResponse } from '@/types/api';

export default function SuppliersPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const { t } = useI18n();

  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  const [filterTab, setFilterTab] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const params = {
    page: currentPage,
    page_size: 15,
    ...(filterTab === 'favorites' ? { is_favorite: true } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const listKey = qk.suppliers.list(params);
  const suppliersQuery = useSuppliers(params);
  const suppliers = suppliersQuery.data?.results ?? [];
  const totalCount = suppliersQuery.data?.count ?? 0;
  const totalPages = suppliersQuery.data?.total_pages ?? 1;
  const isLoading = suppliersQuery.isPending;
  const hasError = suppliersQuery.isError && !suppliersQuery.data;

  const patchList = (update: (rows: Supplier[]) => Supplier[]) =>
    queryClient.setQueryData<PaginatedResponse<Supplier>>(listKey, (page) =>
      page ? { ...page, results: update(page.results ?? []) } : page
    );

  const handleToggleFavorite = async (supplier: Supplier, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const previous = queryClient.getQueryData<PaginatedResponse<Supplier>>(listKey);
    patchList((rows) => rows.map((s) => (s.id === supplier.id ? { ...s, is_favorite: !supplier.is_favorite } : s)));
    try {
      const res = await suppliersService.toggleFavorite(supplier.id);
      const isFav = res.data?.is_favorite ?? !supplier.is_favorite;
      toastSuccess(isFav ? t('suppliers.favoriteOn') : t('suppliers.favoriteOff'));
      queryClient.invalidateQueries({ queryKey: qk.suppliers.all, refetchType: 'none' });
    } catch {
      queryClient.setQueryData(listKey, previous);
      toastError(t('suppliers.favoriteError'));
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(t('suppliers.deleteConfirm', { name: supplier.name }))) return;
    try {
      await suppliersService.deleteSupplier(supplier.id);
      patchList((rows) => rows.filter((s) => s.id !== supplier.id));
      toastSuccess(t('suppliers.deleted'));
      invalidateAfter(queryClient, 'supplier');
    } catch {
      toastError(t('suppliers.deleteError'));
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const tabs = [
    { id: 'all', label: t('suppliers.tabAll') },
    { id: 'favorites', label: t('suppliers.tabFavorites') },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Directorio de             {t('suppliers.title')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('suppliers.subtitle')}
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedSupplier(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t('suppliers.new')}
        </Button>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={filterTab}
        onTabChange={(id) => {
          setFilterTab(id as 'all' | 'favorites');
          setCurrentPage(1);
        }}
      />

      <div className="max-w-md">
        <Input
          placeholder={t('suppliers.search')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          startIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text={t('suppliers.loading')} />
        </div>
      ) : hasError ? (
        <ErrorState
          title={t('suppliers.loadErrorTitle')}
          message={t('suppliers.loadErrorText')}
          onRetry={() => suppliersQuery.refetch()}
        />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('suppliers.emptyTitle')}
          description={
            searchQuery || filterTab !== 'all'
              ? t('suppliers.emptySearch')
              : t('suppliers.emptyHint')
          }
          action={
            <Button
              onClick={() => {
                setSelectedSupplier(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('suppliers.register')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm sm:text-base">
                          {supplier.name}
                        </h4>
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 block truncate">
                          {supplier.tax_id ? `${t('suppliers.id')}: ${supplier.tax_id}` : t('suppliers.noId')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(supplier, e)}
                      title={supplier.is_favorite ? t('suppliers.favoriteRemove') : t('suppliers.favoriteAdd')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        supplier.is_favorite
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-zinc-600'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${supplier.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {supplier.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <span className="truncate">{supplier.email}</span>
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <span>{supplier.phone}</span>
                      </p>
                    )}
                    {supplier.address && (
                      <p className="truncate text-zinc-400 dark:text-zinc-500">{supplier.address}</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-zinc-400 font-medium dark:text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t('suppliers.docs', { count: supplier.document_count ?? 0 })}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{t('suppliers.expenses', { count: supplier.expense_count ?? 0 })}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer dark:text-zinc-500 dark:hover:text-indigo-400"
                      title={t('common.edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer dark:text-zinc-500 dark:hover:text-rose-400"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onSuccess={() => invalidateAfter(queryClient, 'supplier')}
      />
    </div>
  );
}
