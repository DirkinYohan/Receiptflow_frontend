'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ExternalLink,
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

export default function SuppliersPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const { t } = useI18n();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [filterTab, setFilterTab] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const params: Record<string, any> = {
        page: currentPage,
        page_size: 15,
      };

      if (filterTab === 'favorites') {
        params.is_favorite = true;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const res = await suppliersService.getSuppliers(params);
      setSuppliers(res.results || []);
      setTotalCount(res.count || 0);
      setTotalPages(res.total_pages || 1);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterTab, debouncedSearch]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleToggleFavorite = async (supplier: Supplier, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await suppliersService.toggleFavorite(supplier.id);
      const isFav = res.data?.is_favorite ?? !supplier.is_favorite;
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, is_favorite: isFav } : s))
      );
      toastSuccess(
        isFav ? 'Marcado como favorito.' : 'Removido de favoritos.'
      );
    } catch {
      toastError('No se pudo actualizar el estado de favorito.');
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`¿Eliminar al proveedor "${supplier.name}"?`)) return;
    try {
      await suppliersService.deleteSupplier(supplier.id);
      toastSuccess('Proveedor eliminado.');
      fetchSuppliers();
    } catch {
      toastError('Error al eliminar el proveedor.');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const tabs = [
    { id: 'all', label: 'Todos los Proveedores' },
    { id: 'favorites', label: 'Favoritos' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
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
          Nuevo Proveedor
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={filterTab}
        onTabChange={(id) => {
          setFilterTab(id as any);
          setCurrentPage(1);
        }}
      />

      {/* Search */}
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

      {/* Content */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text="Cargando proveedores..." />
        </div>
      ) : hasError ? (
        <ErrorState
          title="Error al cargar proveedores"
          message="No se pudieron sincronizar los proveedores con el servidor."
          onRetry={fetchSuppliers}
        />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No se encontraron proveedores"
          description={
            searchQuery || filterTab !== 'all'
              ? 'No hay proveedores que coincidan con la búsqueda.'
              : 'Los proveedores se crean automáticamente al procesar tus facturas o puedes agregarlos manualmente.'
          }
          action={
            <Button
              onClick={() => {
                setSelectedSupplier(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Registrar Proveedor
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
                      title={supplier.is_favorite ? 'Remover favorito' : 'Marcar favorito'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        supplier.is_favorite
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${supplier.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {supplier.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span className="truncate">{supplier.email}</span>
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span>{supplier.phone}</span>
                      </p>
                    )}
                    {supplier.address && (
                      <p className="truncate text-zinc-400">{supplier.address}</p>
                    )}
                  </div>
                </div>

                {/* Footer with activity and actions */}
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-zinc-400 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{supplier.document_count ?? 0} docs</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{supplier.expense_count ?? 0} gastos</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Eliminar"
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

      {/* Supplier Modal */}
      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
      />
    </div>
  );
}
