'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { useI18n } from '@/providers/I18nProvider';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t('common.errorTitle');
  const resolvedMessage = message ?? t('common.errorMessage');
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
        {resolvedTitle}
      </h4>
      <p className="text-sm text-stone-600 dark:text-stone-400 max-w-sm mb-5 leading-relaxed">
        {resolvedMessage}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
