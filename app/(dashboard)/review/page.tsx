'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { documentsService } from '@/services/documents.service';
import { useAvailableCategories, useReviewQueue } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { ReviewQueueItem } from '@/types/document';
import { ApiError } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { FilePreview, ReviewForm, documentName } from '@/components/features/review/ReviewForm';
import { ReviewTable } from '@/components/features/review/ReviewTable';

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
