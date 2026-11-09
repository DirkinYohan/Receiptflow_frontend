'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search } from 'lucide-react';
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
import { SupplierCard } from '@/components/features/suppliers/SupplierCard';

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
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Directorio de             {t('suppliers.title')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
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
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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
