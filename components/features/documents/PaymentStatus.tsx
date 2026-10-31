'use client';

import React from 'react';
import { Check, Circle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

export function PaymentStatus({
  paid,
  onChange,
  disabled = false,
  busy = false,
}: {
  paid: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const { t } = useI18n();
  const label = paid ? t('payment.paid') : t('payment.unpaid');

  return (
    <button
      type="button"
      aria-pressed={paid}
      aria-label={label}
      disabled={disabled || busy || !onChange}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onChange?.(!paid);
      }}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60 ${
        paid
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-stone-200 bg-white text-stone-700'
      }`}
    >
      {paid ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Circle className="h-4 w-4" aria-hidden />
      )}
      <span>{busy ? t('common.loading') : label}</span>
    </button>
  );
}
