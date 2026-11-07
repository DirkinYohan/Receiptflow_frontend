'use client';

import { ChevronRight } from 'lucide-react';
import { ReviewQueueItem } from '@/types/document';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';
import { documentName } from '@/components/features/review/ReviewForm';

export function ReviewTable({ items, onOpen }: { items: ReviewQueueItem[]; onOpen: (id: number) => void }) {
  const { t } = useI18n();
  const firstReason = (item: ReviewQueueItem) =>
    item.status === 'failed'
      ? t('review.failed')
      : item.review_reasons[0] ||
        (item.missing_fields.length
          ? `${t('review.missing')}: ${item.missing_fields.map((field) => t(`review.field_${field}`)).join(', ')}`
          : '');

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-400">
          <tr>
            <th className="px-4 py-3 font-medium">{t('review.colDocument')}</th>
            <th className="px-4 py-3 font-medium">{t('review.colTotal')}</th>
            <th className="px-4 py-3 font-medium">{t('review.colDate')}</th>
            <th className="px-4 py-3 font-medium">{t('review.colReason')}</th>
            <th className="px-4 py-3 font-medium">{t('review.colUploaded')}</th>
            <th className="px-4 py-3" aria-label={t('review.open')} />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {items.map((item) => (
            <tr
              key={item.id}
              tabIndex={0}
              onClick={() => onOpen(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen(item.id);
                }
              }}
              className="cursor-pointer hover:bg-stone-50 focus:bg-stone-50 focus:outline-none dark:hover:bg-stone-800/60 dark:focus:bg-stone-800/60"
            >
              <td className="max-w-[220px] px-4 py-3">
                <p className="truncate font-medium text-stone-900 dark:text-stone-100">{documentName(item)}</p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                  {t(`type.${item.document_type}`)} · {item.original_filename}
                </p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-stone-900 dark:text-stone-100">
                {item.total_amount != null ? formatCurrency(item.total_amount, item.currency) : t('common.emptyValue')}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-stone-600 dark:text-stone-400">
                {formatDate(item.issued_at) || t('common.noDate')}
              </td>
              <td className="max-w-[320px] px-4 py-3">
                <p className="line-clamp-2 text-orange-800 dark:text-orange-200">{firstReason(item)}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-stone-500 dark:text-stone-400">{formatDate(item.created_at)}</td>
              <td className="px-4 py-3 text-right text-stone-400 dark:text-stone-500">
                <ChevronRight className="ml-auto h-4 w-4" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
