'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';
import { LanguageSelector } from '@/components/features/i18n/LanguageSelector';
import { useI18n } from '@/providers/I18nProvider';

const TITLES: { href: string; key: string }[] = [
  { href: '/dashboard', key: 'nav.home' },
  { href: '/documents', key: 'nav.documents' },
  { href: '/expenses', key: 'nav.expenses' },
  { href: '/suppliers', key: 'nav.suppliers' },
  { href: '/categories', key: 'nav.categories' },
  { href: '/reports', key: 'nav.reports' },
  { href: '/settings', key: 'nav.settings' },
];

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const current = TITLES.find(
    (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-stone-200 bg-white/90 px-8 backdrop-blur lg:flex">
      <h1 className="text-lg font-semibold text-stone-900">{current ? t(current.key) : 'ReceiptFlow'}</h1>
      <div className="flex items-center gap-3">
        <LanguageSelector />
        <UserMenu />
      </div>
    </header>
  );
}
