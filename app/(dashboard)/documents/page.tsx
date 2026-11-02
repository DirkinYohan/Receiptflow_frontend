'use client';

import React, { Suspense, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { DocumentCard } from '@/components/features/documents/DocumentCard';
import { DocumentTable } from '@/components/features/documents/DocumentTable';
import { DocumentUploadModal } from '@/components/features/documents/DocumentUploadModal';
import { documentsService } from '@/services/documents.service';
import { Document } from '@/types/document';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocuments } from '@/hooks/queries';
import { qk } from '@/lib/query/keys';
import { invalidateAfter } from '@/lib/query/invalidate';
import { PaginatedResponse } from '@/types/api';
import { useI18n } from '@/providers/I18nProvider';
import { ApiError } from '@/types/api';

export default function DocumentsRoute() {
  return (
    <Suspense fallback={null}>
      <DocumentsPage />
    </Suspense>
  );
}

function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { success: toastSuccess, error: toastError } = useToast();

  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [ordering, setOrdering] = useState('-created_at');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  const params = {
    page: currentPage,
    page_size: 15,
    ordering,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(typeFilter ? { document_type: typeFilter } : {}),
    ...(paidFilter !== '' ? { is_paid: paidFilter === 'true' } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const listKey = qk.documents.list(params);
  const documentsQuery = useDocuments(params);
  const documents = documentsQuery.data?.results ?? [];
  const totalCount = documentsQuery.data?.count ?? 0;
  const totalPages = documentsQuery.data?.total_pages ?? 1;
  const isLoading = documentsQuery.isPending;
  const hasError = documentsQuery.isError && !documentsQuery.data;

  const patchList = (update: (rows: Document[]) => Document[]) =>
    queryClient.setQueryData<PaginatedResponse<Document>>(listKey, (page) =>
      page ? { ...page, results: update(page.results ?? []) } : page
    );

  const togglePaid = async (doc: Document, paid: boolean) => {
    const previous = queryClient.getQueryData<PaginatedResponse<Document>>(listKey);
    patchList((rows) => rows.map((item) => (item.id === doc.id ? { ...item, is_paid: paid } : item)));
    setActionInProgressId(doc.id);
    try {
      await documentsService.updateDocument(doc.id, { is_paid: paid });
      toastSuccess(paid ? t('payment.savedPaid') : t('payment.savedUnpaid'));
      invalidateAfter(queryClient, 'documentPaid');
    } catch {
      queryClient.setQueryData(listKey, previous);
      toastError(t('payment.saveError'));
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRetry = async (docId: number) => {
    setActionInProgressId(docId);
    try {
      await documentsService.retryProcessing(docId);
      toastSuccess(t('documents.reprocessOk'));
      invalidateAfter(queryClient, 'document');
    } catch (err) {
      toastError((err as ApiError).message || t('documents.reprocessError'));
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(t('documents.deleteConfirm'))) return;
    setActionInProgressId(doc.id);
    try {
      await documentsService.deleteDocument(doc.id);
      patchList((rows) => rows.filter((item) => item.id !== doc.id));
      queryClient.removeQueries({ queryKey: qk.documents.detail(doc.id) });
      toastSuccess(t('documents.deleted'));
      invalidateAfter(queryClient, 'document');
    } catch {
      toastError(t('documents.deleteError'));
    } finally {
      setActionInProgressId(null);
    }
  };

  const statusTabs = [
    { id: 'all', label: t('common.all') },
    { id: 'completed', label: t('status.completed') },
    { id: 'review_required', label: t('status.review_required') },
    { id: 'processing', label: t('status.processing') },
    { id: 'pending', label: t('status.pending') },
    { id: 'failed', label: t('status.failed') },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{t('documents.title')}</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('documents.subtitle')}</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} leftIcon={<Upload className="h-4 w-4" />}>
          {t('common.upload')}
        </Button>
      </div>

      <Tabs
        tabs={statusTabs}
        activeTab={statusFilter}
        onTabChange={(id) => {
          setStatusFilter(id);
          setCurrentPage(1);
        }}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-6">
          <Input
            aria-label={t('common.search')}
            placeholder={t('documents.search')}
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            startIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="md:col-span-2">
          <Select
            aria-label={t('documents.type')}
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: t('type.all') },
              { value: 'receipt', label: t('type.receipt') },
              { value: 'invoice', label: t('type.invoice') },
              { value: 'ticket', label: t('type.ticket') },
              { value: 'other', label: t('type.other') },
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <Select
            aria-label={t('payment.filter')}
            value={paidFilter}
            onChange={(event) => {
              setPaidFilter(event.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: t('payment.all') },
              { value: 'true', label: t('payment.paid') },
              { value: 'false', label: t('payment.unpaid') },
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <Select
            aria-label={t('documents.sortRecent')}
            value={ordering}
            onChange={(event) => {
              setOrdering(event.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '-created_at', label: t('documents.sortRecent') },
              { value: 'created_at', label: t('documents.sortOldest') },
              { value: '-total_amount', label: t('documents.sortHigh') },
              { value: 'total_amount', label: t('documents.sortLow') },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:hidden">
          <div className="h-28 animate-pulse rounded-2xl bg-white dark:bg-stone-900" />
          <div className="h-28 animate-pulse rounded-2xl bg-white dark:bg-stone-900" />
        </div>
      ) : null}

      {isLoading ? (
        <div className="hidden h-64 animate-pulse rounded-2xl bg-white md:block dark:bg-stone-900" />
      ) : hasError ? (
        <ErrorState title={t('common.errorTitle')} message={t('documents.loadError')} onRetry={() => documentsQuery.refetch()} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('documents.title')}
          description={searchQuery || statusFilter !== 'all' || typeFilter || paidFilter ? t('documents.emptyFiltered') : t('documents.empty')}
          action={
            <Button onClick={() => setIsUploadModalOpen(true)} leftIcon={<Upload className="h-4 w-4" />}>
              {t('common.upload')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                busy={actionInProgressId === doc.id}
                onOpen={() => router.push(`/documents/${doc.id}`)}
                onDelete={() => handleDelete(doc)}
                onRetry={() => handleRetry(doc.id)}
                onTogglePaid={(paid) => togglePaid(doc, paid)}
              />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:block dark:border-stone-800 dark:bg-stone-900">
            <DocumentTable
              documents={documents}
              busyId={actionInProgressId}
              onOpen={(id) => router.push(`/documents/${id}`)}
              onDelete={handleDelete}
              onRetry={handleRetry}
              onTogglePaid={togglePaid}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={15}
              onPageChange={setCurrentPage}
            />
          </div>
          <div className="md:hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={15}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => invalidateAfter(queryClient, 'document')}
      />
    </div>
  );
}
