'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { documentsService } from '@/services/documents.service';
import { ReviewQueueItem } from '@/types/document';
import { AvailableCategory } from '@/types/category';
import { ApiError } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function fromDateInput(value: string): string | null {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

export function documentName(item: ReviewQueueItem): string {
  return item.supplier_data?.name || item.title || item.original_filename;
}

export function FilePreview({ item }: { item: ReviewQueueItem }) {
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

export function ReviewForm({
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
