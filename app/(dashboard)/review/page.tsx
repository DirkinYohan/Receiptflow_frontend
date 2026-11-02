'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, ExternalLink, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { documentsService } from '@/services/documents.service';
import { useAvailableCategories, useReviewQueue } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { ReviewQueueItem } from '@/types/document';
import { AvailableCategory } from '@/types/category';
import { ApiError } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function fromDateInput(value: string): string | null {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

function documentName(item: ReviewQueueItem): string {
  return item.supplier_data?.name || item.title || item.original_filename;
}

function FilePreview({ item }: { item: ReviewQueueItem }) {
  const { t } = useI18n();
  if (!item.file_url) return null;
  const isImage = item.mime_type.startsWith('image/');
  return (
    <div className="flex h-full flex-col gap-2">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.file_url}
          alt={item.title || item.original_filename}
          className="max-h-[70vh] w-full rounded-xl bg-stone-50 object-contain dark:bg-stone-800/60"
        />
      ) : (
        <iframe src={item.file_url} title={item.original_filename} className="h-[70vh] w-full rounded-xl bg-stone-50 dark:bg-stone-800/60" />
      )}
      <a
        href={item.file_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-200"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        {t('review.openFile')}
      </a>
    </div>
  );
}

function ReviewForm({
  item,
  categories,
  reprocessing,
  onApproved,
  onReprocess,
  onDiscard,
}: {
  item: ReviewQueueItem;
  categories: AvailableCategory[];
  reprocessing: boolean;
  onApproved: () => void;
  onReprocess: () => void;
  onDiscard: () => void;
}) {
  const { locale, t } = useI18n();
  const { success: toastSuccess, error: toastError } = useToast();
  const [supplierName, setSupplierName] = useState(item.supplier_data?.name || '');
  const [total, setTotal] = useState(item.total_amount != null ? String(item.total_amount) : '');
  const [issuedAt, setIssuedAt] = useState(toDateInput(item.issued_at));
  const [dueDate, setDueDate] = useState(toDateInput(item.due_date));
  const [categoryId, setCategoryId] = useState(item.category ? String(item.category) : '');
  const [isPaid, setIsPaid] = useState(Boolean(item.is_paid));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = saving || reprocessing;

  const approve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!total) {
      setError(t('review.needTotal'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const originalSupplier = item.supplier_data?.name || '';
      await documentsService.updateExtractedData(item.id, {
        status: 'completed',
        total_amount: total,
        issued_at: fromDateInput(issuedAt),
        due_date: fromDateInput(dueDate),
        is_paid: isPaid,
        ...(categoryId ? { category_id: Number(categoryId) } : {}),
        ...(supplierName.trim() && supplierName.trim() !== originalSupplier
          ? { supplier_name: supplierName.trim() }
          : {}),
      });
      toastSuccess(t('review.approved'));
      onApproved();
    } catch (err) {
      toastError((err as ApiError).message || t('review.approveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={approve} className="space-y-5">
      {(item.review_reasons.length > 0 || item.missing_fields.length > 0 || item.status === 'failed') && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm dark:border-orange-900 dark:bg-orange-950/40">
          <p className="flex items-center gap-2 font-semibold text-orange-950 dark:text-orange-200">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            {t('review.why')}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-orange-900 dark:text-orange-200">
            {item.status === 'failed' && <li>{t('review.failed')}</li>}
            {item.review_reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
            {item.missing_fields.length > 0 && (
              <li>
                {t('review.missing')}: {item.missing_fields.map((field) => t(`review.field_${field}`)).join(', ')}
              </li>
            )}
          </ul>
        </div>
      )}

      <Input label={t('review.supplier')} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
      <Input
        label={t('review.total')}
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        error={!total ? error : undefined}
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label={t('review.date')} type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
        <Input label={t('review.dueDate')} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <Select
        label={t('review.category')}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        placeholder="—"
        options={categories.map((category) => ({
          value: String(category.id),
          label: localizeCategoryName(category, locale),
        }))}
      />
      <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
        <input
          type="checkbox"
          checked={isPaid}
          onChange={(e) => setIsPaid(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-emerald-700 dark:border-stone-700 dark:text-emerald-300"
        />
        {t('review.paid')}
      </label>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" isLoading={saving} disabled={busy} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
          {t('review.approve')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReprocess}
          isLoading={reprocessing}
          disabled={busy}
          leftIcon={<RotateCcw className="h-4 w-4" />}
        >
          {reprocessing ? t('review.reprocessing') : t('review.reprocess')}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onDiscard}
          disabled={busy}
          aria-label={t('review.discard')}
          leftIcon={<Trash2 className="h-4 w-4" />}
        />
      </div>
    </form>
  );
}

function ReviewTable({ items, onOpen }: { items: ReviewQueueItem[]; onOpen: (id: number) => void }) {
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

export default function ReviewPage() {
  const { t } = useI18n();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reprocessing, setReprocessing] = useState(false);

  const queueQuery = useReviewQueue();
  const { data: categories = [] } = useAvailableCategories();
  const items = queueQuery.data ?? [];
  const isLoading = queueQuery.isPending;
  const hasError = queueQuery.isError && !queueQuery.data;
  const load = () => queueQuery.refetch();

  const current = items.find((item) => item.id === selectedId) ?? null;

  const backToList = () => setSelectedId(null);

  const removeCurrent = () => {
    queryClient.setQueryData<ReviewQueueItem[]>(qk.documents.review, (list = []) =>
      list.filter((item) => item.id !== selectedId)
    );
    invalidateAfter(queryClient, 'document');
    backToList();
  };

  const reprocess = async () => {
    if (!current || reprocessing) return;
    setReprocessing(true);
    try {
      await documentsService.retryProcessing(current.id);
      toastSuccess(t('review.reprocessed'));
      await invalidateAfter(queryClient, 'document');
      backToList();
    } catch (err) {
      toastError((err as ApiError).message || t('review.reprocessError'));
    } finally {
      setReprocessing(false);
    }
  };

  const discard = async () => {
    if (!current || !confirm(t('review.discardConfirm'))) return;
    try {
      await documentsService.deleteDocument(current.id);
      toastSuccess(t('detail.deleted'));
      removeCurrent();
    } catch {
      toastError(t('detail.deleteError'));
    }
  };

  if (isLoading) return <LoadingState text={t('common.loading')} />;
  if (hasError) {
    return (
      <div className="py-12">
        <ErrorState title={t('common.errorTitle')} message={t('dashboard.loadError')} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{t('review.title')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">{t('review.subtitle')}</p>
        </div>
        {items.length > 0 && !current && (
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('review.count', { count: items.length })}</span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t('review.emptyTitle')} description={t('review.emptyText')} />
      ) : !current ? (
        <ReviewTable items={items} onOpen={setSelectedId} />
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={backToList} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            {t('review.backToList')}
          </Button>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <FilePreview item={current} />
            </section>
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <p className="mb-4 truncate text-sm font-medium text-stone-500 dark:text-stone-400">{documentName(current)}</p>
              <ReviewForm
                key={current.id}
                item={current}
                categories={categories}
                reprocessing={reprocessing}
                onApproved={removeCurrent}
                onReprocess={reprocess}
                onDiscard={discard}
              />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
