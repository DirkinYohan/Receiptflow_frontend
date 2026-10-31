'use client';

import React, { useRef } from 'react';
import { Plus, UploadCloud } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

export function UploadArea({
  onFiles,
  compact = false,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null | undefined) => {
    const files = Array.from(list ?? []);
    if (files.length) onFiles(files);
  };

  return (
    <div>
      {compact ? (
        <button
          type="button"
          disabled={disabled}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            pick(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('upload.addMore')}
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            pick(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"
        >
          <UploadCloud className="mb-3 h-8 w-8 text-stone-400" aria-hidden />
          <p className="text-sm font-semibold text-stone-900">{t('upload.drop')}</p>
          <p className="mt-1 text-sm text-stone-500">{t('upload.or')}</p>
          <p className="mt-3 text-xs text-stone-400">{t('upload.types')}</p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
        className="sr-only"
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
