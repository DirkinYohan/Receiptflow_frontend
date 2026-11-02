'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileText, Loader2, X, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { UploadArea } from '@/components/features/documents/UploadArea';
import { documentsService } from '@/services/documents.service';
import { formatFileSize } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';

const MAX_FILES = 20; // matches the backend upload rate limit (20/min)
const MAX_SIZE = 20 * 1024 * 1024;
const CONCURRENCY = 3;
const POLL_MS = 2500;
const POLL_LIMIT_MS = 60000;

type ItemState = 'queued' | 'uploading' | 'processing' | 'completed' | 'review_required' | 'failed' | 'error';

interface UploadItem {
  key: string;
  file: File;
  state: ItemState;
  docId?: number;
}

const SETTLED: ItemState[] = ['completed', 'review_required', 'failed', 'error'];

function StateIcon({ state }: { state: ItemState }) {
  if (state === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" aria-hidden />;
  if (state === 'review_required') return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden />;
  if (state === 'failed' || state === 'error') return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />;
  if (state === 'queued') return <FileText className="h-4 w-4 text-stone-400 dark:text-stone-500" aria-hidden />;
  return <Loader2 className="h-4 w-4 animate-spin text-stone-500 dark:text-stone-400" aria-hidden />;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const update = (key: string, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const addFiles = (files: File[]) => {
    const accepted = files.filter((file) => file.size <= MAX_SIZE);
    const room = Math.max(MAX_FILES - items.length, 0);
    if (accepted.length > room) setErrorMessage(t('upload.maxFiles', { max: MAX_FILES }));
    else if (accepted.length < files.length) setErrorMessage(t('upload.tooBig'));
    else setErrorMessage('');
    const next = accepted.slice(0, room).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      state: 'queued' as ItemState,
    }));
    setItems((prev) => [...prev, ...next]);
  };

  const reset = () => {
    setItems([]);
    setErrorMessage('');
    setFinished(false);
  };

  const close = () => {
    if (running) return;
    if (finished) onSuccess();
    reset();
    onClose();
  };

  const uploadOne = async (item: UploadItem): Promise<{ key: string; docId?: number; state: ItemState }> => {
    update(item.key, { state: 'uploading' });
    try {
      const created = await documentsService.uploadDocument({
        file: item.file,
        title: item.file.name.replace(/\.[^/.]+$/, ''),
      });
      const docId = created.data?.id;
      const status = created.data?.status;
      const state: ItemState =
        status === 'completed' || status === 'review_required' || status === 'failed' ? status : 'processing';
      update(item.key, { docId, state });
      return { key: item.key, docId, state };
    } catch {
      update(item.key, { state: 'error' });
      return { key: item.key, state: 'error' };
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const queue = items.filter((item) => item.state === 'queued');
    if (!queue.length) {
      setErrorMessage(t('upload.needFile'));
      return;
    }
    setRunning(true);
    setErrorMessage('');

    // Upload a few at a time so the server and the OCR provider are not flooded.
    const results: { key: string; docId?: number; state: ItemState }[] = [];
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        while (cursor < queue.length) {
          const item = queue[cursor++];
          results.push(await uploadOne(item));
        }
      })
    );

    // Documents still being read in the background: poll until they settle.
    let pending = results.filter((r) => r.state === 'processing' && r.docId);
    const started = Date.now();
    while (pending.length && Date.now() - started < POLL_LIMIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      const checks = await Promise.all(
        pending.map(async (r) => {
          try {
            const res = await documentsService.getProcessingStatus(r.docId as number);
            return { ...r, state: (res.data?.status as ItemState) || r.state };
          } catch {
            return r;
          }
        })
      );
      checks.forEach((r) => {
        if (SETTLED.includes(r.state)) update(r.key, { state: r.state });
      });
      pending = checks.filter((r) => !SETTLED.includes(r.state));
    }

    setRunning(false);
    setFinished(true);
  };

  const count = (states: ItemState[]) => items.filter((item) => states.includes(item.state)).length;
  const queuedCount = count(['queued']);
  const needsReview = count(['review_required', 'failed']);
  const stillWorking = count(['processing']);

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('upload.title')} description={t('upload.description')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert type="danger" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        {!items.length ? (
          <UploadArea onFiles={addFiles} disabled={running} />
        ) : (
          <>
            <ul className="max-h-80 divide-y divide-stone-100 overflow-y-auto rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
              {items.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <StateIcon state={item.state} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">{item.file.name}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {formatFileSize(item.file.size)} · {t(`upload.state_${item.state}`)}
                      </p>
                    </div>
                  </div>
                  {item.state === 'queued' && !running && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((other) => other.key !== item.key))}
                      aria-label={t('upload.remove')}
                      className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-stone-400 dark:hover:bg-stone-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!running && !finished && items.length < MAX_FILES && <UploadArea onFiles={addFiles} compact />}
          </>
        )}

        {finished && (
          <Alert type={needsReview ? 'warning' : 'success'}>
            {t('upload.summary', {
              done: count(['completed']),
              review: needsReview,
              failed: count(['error']),
            })}
            {stillWorking > 0 && <span className="block">{t('upload.stillWorking', { count: stillWorking })}</span>}
          </Alert>
        )}

        <div className="flex justify-end gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
          {finished ? (
            <>
              {needsReview > 0 && (
                <Link href="/review" onClick={close}>
                  <Button type="button" variant="outline">{t('upload.goReview')}</Button>
                </Link>
              )}
              <Button type="button" onClick={close}>{t('upload.done')}</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" disabled={running} onClick={close}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" isLoading={running} disabled={!queuedCount}>
                {queuedCount > 1 ? t('upload.submitMany', { count: queuedCount }) : t('upload.submit')}
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
