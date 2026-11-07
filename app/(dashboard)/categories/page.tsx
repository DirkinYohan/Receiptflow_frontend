'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  Lock,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CategoryFormModal } from '@/components/features/categories/CategoryFormModal';
import { BudgetsPanel } from '@/components/features/categories/BudgetsPanel';
import { categoriesService } from '@/services/categories.service';
import { Category } from '@/types/category';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/providers/I18nProvider';
import { useCategories } from '@/hooks/queries';
import { invalidateAfter } from '@/lib/query/invalidate';
import { localizeCategoryDescription, localizeCategoryName } from '@/lib/i18n/categoryNames';
import { ApiError } from '@/types/api';

export default function CategoriesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const { locale, t } = useI18n();

  const queryClient = useQueryClient();
  const [scopeFilter, setScopeFilter] = useState<'all' | 'system' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const categoriesQuery = useCategories({
    page_size: 100,
    ...(scopeFilter !== 'all' ? { scope: scopeFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const categories = categoriesQuery.data?.results ?? [];
  const isLoading = categoriesQuery.isPending;
  const hasError = categoriesQuery.isError && !categoriesQuery.data;

  const handleDelete = async (category: Category) => {
    if (!category.is_editable) {
      toastError(t('categories.deleteSystemError'));
      return;
    }

    if (
      !confirm(
        t('categories.deleteConfirm', { name: localizeCategoryName(category, locale) })
      )
    )
      return;

    try {
      await categoriesService.deleteCategory(category.id);
      toastSuccess(t('categories.deleted'));
      invalidateAfter(queryClient, 'category');
    } catch (err: unknown) {
      toastError((err as ApiError).message || t('categories.deleteError'));
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const tabs = [
    { id: 'all', label: t('categories.all') },
    { id: 'system', label: t('categories.system') },
    { id: 'user', label: t('categories.mine') },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('categories.title')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('categories.subtitle')}
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedCategory(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t('categories.new')}
        </Button>
      </div>

      <BudgetsPanel />

      <Tabs
        tabs={tabs}
        activeTab={scopeFilter}
        onTabChange={(id) => setScopeFilter(id as 'all' | 'system' | 'user')}
      />

      <div className="max-w-md">
        <Input
          placeholder={t('categories.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text={t('categories.loading')} />
        </div>
      ) : hasError ? (
        <ErrorState
          title={t('categories.loadErrorTitle')}
          message={t('categories.loadErrorText')}
          onRetry={() => categoriesQuery.refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={t('categories.emptyTitle')}
          description={
            searchQuery || scopeFilter !== 'all'
              ? t('categories.emptySearch')
              : t('categories.emptyMine')
          }
          action={
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('categories.create')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const isSystem = cat.scope === 'system';

            return (
              <div
                key={cat.id}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      >
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm sm:text-base">
                          {localizeCategoryName(cat, locale)}
                        </h4>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {cat.usage_count !== undefined
                            ? t('categories.usages', { count: cat.usage_count })
                            : t('categories.active')}
                        </span>
                      </div>
                    </div>

                    <Badge variant={isSystem ? 'neutral' : 'default'} size="sm">
                      {isSystem ? t('categories.systemBadge') : t('categories.personalBadge')}
                    </Badge>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                      {localizeCategoryDescription(cat, locale)}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                    {isSystem ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{t('categories.protected')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('categories.editable')}</span>
                      </span>
                    )}
                  </div>

                  {!isSystem && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer dark:text-zinc-500 dark:hover:text-indigo-400"
                        title={t('common.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer dark:text-zinc-500 dark:hover:text-rose-400"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={() => invalidateAfter(queryClient, 'category')}
      />
    </div>
  );
}
