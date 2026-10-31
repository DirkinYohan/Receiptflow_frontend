'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/providers/I18nProvider';
import { LanguageSelector } from '@/components/features/i18n/LanguageSelector';

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Receipt className="h-5 w-5" />
            </span>
            ReceiptFlow
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">{t('landing.enter')}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="whitespace-nowrap" rightIcon={<ArrowRight className="h-4 w-4" />}>{t('landing.start')}</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{t('landing.hero')}</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600">{t('landing.heroText')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button size="lg">{t('landing.cta')}</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">{t('landing.login')}</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
