'use client';

import React, { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Locale } from '@/lib/i18n/messages';
import { setTranslateLocale, translateFor } from '@/lib/i18n/translate';
import { setFormatLocale } from '@/lib/formatters';

const STORAGE_KEY = 'rf-lang';
const CHANGE_EVENT = 'rf-lang-change';

function readLocale(): Locale {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : 'es';
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => 'es' as Locale);

  useEffect(() => {
    setFormatLocale(locale);
    setTranslateLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translateFor(locale, key, vars),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
