'use client';

import React from 'react';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { Document } from '@/types/document';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';
import { StatusBadge } from './StatusBadge';
import { PaymentStatus } from './PaymentStatus';

export function documentLabel(doc: Document) {
  return doc.supplier_name || doc.title || doc.original_filename || '';
}

export function DocumentCard({
  doc,
  busy,
  onOpen,
  onDelete,
  onRetry,
  onTogglePaid,
}: {
  doc: Document;
  busy?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRetry: () => void;
  onTogglePaid: (paid: boolean) => void;
}) {
  const { locale, t } = useI18n();
  const canRetry = doc.status === 'failed' || doc.status === 'review_required' || doc.status === 'pending';

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-stone-900 dark:text-stone-100">{documentLabel(doc)}</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {t(`type.${doc.document_type}`)} · {doc.document_number || t('detail.noNumber')}
              {doc.category_name && <> · {localizeCategoryName(doc.category_name, locale)}</>}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-stone-900 dark:text-stone-100">
            {doc.total_amount ? formatCurrency(doc.total_amount, doc.currency) : t('common.emptyValue')}
          </p>
        </div>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{formatDate(doc.issued_at) || t('common.noDate')}</p>
      </button>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={doc.status} />
        <PaymentStatus paid={Boolean(doc.is_paid)} busy={busy} onChange={onTogglePaid} />
      </div>
      <div className="mt-3 flex justify-end gap-1">
        {canRetry && (
          <button type="button" aria-label={t('documents.reprocess')} onClick={onRetry} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button type="button" aria-label={t('common.view')} onClick={onOpen} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800">
          <Eye className="h-4 w-4" />
        </button>
        <button type="button" aria-label={t('common.delete')} onClick={onDelete} className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 dark:text-stone-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
