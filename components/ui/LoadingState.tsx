'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

export function LoadingState({
  text,
  className = '',
}: {
  text?: string;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-stone-500 dark:text-stone-400 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-emerald-700 dark:text-emerald-300" aria-hidden />
      <p className="text-sm font-medium">{text || t('common.loading')}</p>
    </div>
  );
}
