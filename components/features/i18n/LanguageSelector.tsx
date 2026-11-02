'use client';

import React from 'react';
import { useI18n } from '@/providers/I18nProvider';
import { Locale } from '@/lib/i18n/messages';

const OPTIONS: { value: Locale; labelKey: 'lang.es' | 'lang.en' }[] = [
  { value: 'es', labelKey: 'lang.es' },
  { value: 'en', labelKey: 'lang.en' },
];

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className={`inline-flex rounded-xl border border-stone-200 bg-white p-1 dark:border-stone-800 dark:bg-stone-900 ${className}`}
    >
      {OPTIONS.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(option.value)}
            className={`min-h-10 whitespace-nowrap rounded-lg px-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
              active ? 'bg-stone-900 text-white dark:bg-stone-700' : 'text-stone-600 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-800/60'
            }`}
          >
            <span className="sm:hidden">{option.value.toUpperCase()}</span>
            <span className="hidden sm:inline">
              {option.value === 'es' ? '🇪🇸 ' : '🇺🇸 '}
              {t(option.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
