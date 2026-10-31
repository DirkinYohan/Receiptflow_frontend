'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

const TONE: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  processing: 'border-sky-200 bg-sky-50 text-sky-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  review_required: 'border-orange-200 bg-orange-50 text-orange-800',
  failed: 'border-rose-200 bg-rose-50 text-rose-800',
};

export function StatusBadge({
  status,
  className = '',
}: {
  status: string;
  className?: string;
}) {
  const { t } = useI18n();
  const known = status in TONE;
  const label = known ? t(`status.${status}`) : t('status.review_required');
  const tone = TONE[status] || TONE.review_required;
  const spinning = status === 'processing' || status === 'pending';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone} ${className}`}
    >
      {spinning && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
      <span>{label}</span>
    </span>
  );
}
