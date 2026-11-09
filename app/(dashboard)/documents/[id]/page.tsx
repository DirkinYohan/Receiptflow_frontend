'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Edit, ExternalLink, Receipt, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { DetailSection } from '@/components/ui/DetailSection';
import { StatusBadge } from '@/components/features/documents/StatusBadge';
import { PaymentStatus } from '@/components/features/documents/PaymentStatus';
import { DocumentExtractedDataModal } from '@/components/features/documents/DocumentExtractedDataModal';
import { DocumentBreakdown } from '@/components/features/documents/DocumentBreakdown';
import { documentsService } from '@/services/documents.service';
import { expensesService } from '@/services/expenses.service';
import { DocumentDetail } from '@/types/document';
import { formatCurrency, formatDate, formatFileSize } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { useDocument } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { useI18n } from '@/providers/I18nProvider';
import { ApiError } from '@/types/api';
import { DetailRow } from '@/components/ui/DetailRow';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = Number(params.id);
  const { t } = useI18n();
  const { success: toastSuccess, error: toastError } = useToast();

  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [paying, setPaying] = useState(false);

  const documentQuery = useDocument(docId);
  const document = documentQuery.data ?? null;
  const isLoading = documentQuery.isPending;
  const hasError = documentQuery.isError;
  const isProcessing = document?.status === 'pending' || document?.status === 'processing';
  const detailKey = qk.documents.detail(docId);
  const setDocument = (next: DocumentDetail) => queryClient.setQueryData(detailKey, next);

  const togglePaid = async (paid: boolean) => {
    if (!document) return;
    setDocument({ ...document, is_paid: paid });
    setPaying(true);
    try {
      await documentsService.updateDocument(docId, { is_paid: paid });
      toastSuccess(paid ? t('payment.savedPaid') : t('payment.savedUnpaid'));
      invalidateAfter(queryClient, 'documentPaid');
    } catch {
      setDocument(document);
      toastError(t('payment.saveError'));
    } finally {
      setPaying(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await documentsService.retryProcessing(docId);
      toastSuccess(t('documents.reprocessOk'));
      invalidateAfter(queryClient, 'document');
    } catch (err) {
      toastError((err as ApiError).message || t('documents.reprocessError'));
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCreateExpense = async () => {
    setIsCreatingExpense(true);
    try {
      const res = await expensesService.createFromDocument({ document_id: docId });
      toastSuccess(t('detail.expenseOk'));
      invalidateAfter(queryClient, 'expense');
      if (res.data?.id) router.push(`/expenses/${res.data.id}`);
    } catch {
      toastError(t('detail.expenseError'));
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('detail.deleteConfirm'))) return;
    try {
      await documentsService.deleteDocument(docId);
      queryClient.removeQueries({ queryKey: detailKey });
      invalidateAfter(queryClient, 'document');
      toastSuccess(t('detail.deleted'));
      router.push('/documents');
    } catch {
      toastError(t('detail.deleteError'));
    }
  };

  if (isLoading) return <LoadingState text={t('detail.loading')} />;
  if (hasError || !document) {
    return (
      <div className="py-12">
        <ErrorState title={t('detail.notFound')} message={t('common.errorMessage')} onRetry={() => documentQuery.refetch()} />
      </div>
    );
  }

  const structured = document.structured_data || {};
  const supplier =
    document.supplier_data?.name ||
    (structured.supplier_name ? String(structured.supplier_name) : '') ||
    document.title ||
    t('detail.unknownSupplier');
  const supplierId =
    (structured.supplier_nit ? String(structured.supplier_nit) : '') ||
    (structured.supplier_tax_id ? String(structured.supplier_tax_id) : '') ||
    document.supplier_data?.tax_id ||
    '';
  const classLabel = structured.document_class
    ? t(`docClass.${structured.document_class}`)
    : t(`type.${document.document_type}`);
  const money = (value: string | null) =>
    value != null && value !== '' ? formatCurrency(value, document.currency) : '';

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <Link href="/documents" aria-label={t('common.back')} className="rounded-xl border border-stone-200 bg-white p-2 text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{supplier}</h2>
              <StatusBadge status={document.status} />
            </div>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {classLabel.startsWith('docClass.') ? t(`type.${document.document_type}`) : classLabel}
              {document.created_at ? ` · ${t('detail.uploaded', { date: formatDate(document.created_at) })}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(document.status === 'failed' || document.status === 'review_required' || document.status === 'pending') && (
            <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying} leftIcon={<RotateCcw className="h-4 w-4" />}>
              {t('documents.reprocess')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} leftIcon={<Edit className="h-4 w-4" />}>
            {t('detail.edit')}
          </Button>
          {document.expense_id ? (
            <Button size="sm" onClick={() => router.push(`/expenses/${document.expense_id}`)} leftIcon={<Receipt className="h-4 w-4" />}>
              {t('detail.viewExpense')}
            </Button>
          ) : (
            <Button size="sm" onClick={handleCreateExpense} isLoading={isCreatingExpense} leftIcon={<Receipt className="h-4 w-4" />}>
              {t('detail.expense')}
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={handleDelete} aria-label={t('common.delete')} leftIcon={<Trash2 className="h-4 w-4" />} />
        </div>
      </div>

      {isProcessing && <Alert type="info">{t('status.processingExplain')}</Alert>}
      {document.status === 'review_required' && (
        <Alert type="warning" title={t('status.reviewTitle')}>
          {t('status.reviewExplain')}
        </Alert>
      )}
      {document.status === 'failed' && (
        <Alert type="danger" title={t('status.failed')}>
          {t('status.failedExplain')}
        </Alert>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <p className="text-sm text-stone-500 dark:text-stone-400">{t('detail.total')}</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{money(document.total_amount)}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">{t('detail.date')}</p>
            <p className="mt-1 font-medium text-stone-900 dark:text-stone-100">{formatDate(document.issued_at) || t('common.noDate')}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">{t('detail.payment')}</p>
            <div className="mt-2">
              <PaymentStatus paid={Boolean(document.is_paid)} busy={paying} onChange={togglePaid} />
            </div>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">{t('detail.number')}</p>
            <p className="mt-1 font-medium text-stone-900 dark:text-stone-100">{document.document_number || t('detail.noNumber')}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailSection title={t('detail.important')}>
          <DetailRow label={t('detail.supplier')} value={supplier} />
          <DetailRow label={t('detail.identification')} value={supplierId} />
          <DetailRow label={t('detail.number')} value={document.document_number} />
          <DetailRow label={t('detail.date')} value={formatDate(document.issued_at)} />
          <DetailRow label={t('detail.due')} value={formatDate(document.due_date)} />
          <DetailRow label={t('detail.subtotal')} value={money(document.subtotal_amount)} />
          <DetailRow label={t('detail.tax')} value={money(document.tax_amount)} />
          <DetailRow label={t('detail.currency')} value={document.currency} />
          <DetailRow
            label={t('detail.method')}
            value={document.payment_method ? t(`method.${document.payment_method}`) : ''}
          />
        </DetailSection>

        <DetailSection
          title={t('detail.original')}
          action={
            document.file_url ? (
              <a href={document.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                {t('detail.openOriginal')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null
          }
        >
          {document.file_url && document.mime_type?.includes('image') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={document.file_url} alt={supplier} className="max-h-96 w-full rounded-xl bg-stone-50 object-contain dark:bg-stone-800/60" />
          ) : document.file_url ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Download className="h-8 w-8 text-stone-400 dark:text-stone-500" />
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{document.original_filename}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{formatFileSize(document.file_size)}</p>
              <a href={document.file_url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">{t('detail.viewPdf')}</Button>
              </a>
            </div>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400">{t('detail.noFile')}</p>
          )}
        </DetailSection>
      </div>

      <DetailSection title={t('detail.concepts')}>
        <DocumentBreakdown
          sections={structured.sections}
          lineItems={document.line_items || []}
          currency={document.currency}
          documentClass={structured.document_class}
        />
      </DetailSection>

      {(document.notes || structured.notes) && (
        <DetailSection title={t('detail.extra')}>
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">{document.notes || String(structured.notes || '')}</p>
        </DetailSection>
      )}

      <DocumentExtractedDataModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        document={document}
        onSuccess={(updated) => {
          setDocument(updated);
          invalidateAfter(queryClient, 'document');
        }}
      />
    </div>
  );
}
