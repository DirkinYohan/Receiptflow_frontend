'use client';

import React from 'react';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { Document } from '@/types/document';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';
import { StatusBadge } from './StatusBadge';
import { PaymentStatus } from './PaymentStatus';
import { documentLabel } from './DocumentCard';

export function DocumentTable({
  documents,
  busyId,
  onOpen,
  onDelete,
  onRetry,
  onTogglePaid,
}: {
  documents: Document[];
  busyId: number | null;
  onOpen: (id: number) => void;
  onDelete: (doc: Document) => void;
  onRetry: (id: number) => void;
  onTogglePaid: (doc: Document, paid: boolean) => void;
}) {
  const { locale, t } = useI18n();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-stone-200 text-xs font-medium text-stone-500 dark:border-stone-800 dark:text-stone-400">
          <tr>
            <th className="px-4 py-3 font-medium">{t('documents.supplier')}</th>
            <th className="px-4 py-3 font-medium">{t('documents.type')}</th>
            <th className="px-4 py-3 font-medium">{t('documents.number')}</th>
            <th className="px-4 py-3 font-medium">{t('documents.date')}</th>
            <th className="px-4 py-3 font-medium">{t('documents.total')}</th>
            <th className="px-4 py-3 font-medium">{t('documents.payment')}</th>
            <th className="px-4 py-3 font-medium">{t('documents.status')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {documents.map((doc) => {
            const canRetry = doc.status === 'failed' || doc.status === 'review_required' || doc.status === 'pending';
            return (
              <tr
                key={doc.id}
                className="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60"
                onClick={() => onOpen(doc.id)}
              >
                <td className="max-w-[220px] px-4 py-3">
                  <p className="truncate font-medium text-stone-900 dark:text-stone-100">{documentLabel(doc)}</p>
                  {doc.category_name && <p className="truncate text-xs text-stone-500 dark:text-stone-400">{localizeCategoryName(doc.category_name, locale)}</p>}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{t(`type.${doc.document_type}`)}</td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{doc.document_number || t('detail.noNumber')}</td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-600 dark:text-stone-400">
                  {formatDate(doc.issued_at) || t('common.noDate')}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-stone-900 dark:text-stone-100">
                  {doc.total_amount ? formatCurrency(doc.total_amount, doc.currency) : t('common.emptyValue')}
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <PaymentStatus
                    paid={Boolean(doc.is_paid)}
                    busy={busyId === doc.id}
                    onChange={(paid) => onTogglePaid(doc, paid)}
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                    {canRetry && (
                      <button
                        type="button"
                        aria-label={t('documents.reprocess')}
                        onClick={() => onRetry(doc.id)}
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-stone-400 dark:hover:bg-stone-800"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={t('common.view')}
                      onClick={() => onOpen(doc.id)}
                      className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-stone-400 dark:hover:bg-stone-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('common.delete')}
                      onClick={() => onDelete(doc)}
                      className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-stone-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
