'use client';

import React from 'react';
import { Building2, Star, Edit, Trash2, Mail, Phone, FileText, Receipt } from 'lucide-react';
import { Supplier } from '@/types/supplier';
import { useI18n } from '@/providers/I18nProvider';

type SupplierCardProps = {
  supplier: Supplier;
  onToggleFavorite: (supplier: Supplier, event: React.MouseEvent) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
};

export function SupplierCard({ supplier, onToggleFavorite, onEdit, onDelete }: SupplierCardProps) {
  const { t } = useI18n();
  return (
        <div
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
                onClick={(e) => onToggleFavorite(supplier, e)}
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
                onClick={() => onEdit(supplier)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer dark:text-zinc-500 dark:hover:text-indigo-400"
                title={t('common.edit')}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(supplier)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer dark:text-zinc-500 dark:hover:text-rose-400"
                title={t('common.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
  );
}
