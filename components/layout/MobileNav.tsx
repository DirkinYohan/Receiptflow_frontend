'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileText,
  FolderTree,
  LayoutDashboard,
  Menu,
  Receipt,
  Settings,
  X,
} from 'lucide-react';
import { UserMenu } from './UserMenu';
import { LanguageSelector } from '@/components/features/i18n/LanguageSelector';
import { useI18n } from '@/providers/I18nProvider';

const ITEMS = [
  { key: 'nav.home', href: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.documents', href: '/documents', icon: FileText },
  { key: 'nav.review', href: '/review', icon: ClipboardCheck },
  { key: 'nav.payables', href: '/payables', icon: CalendarClock },
  { key: 'nav.expenses', href: '/expenses', icon: Receipt },
  { key: 'nav.suppliers', href: '/suppliers', icon: Building2 },
  { key: 'nav.categories', href: '/categories', icon: FolderTree },
  { key: 'nav.reports', href: '/reports', icon: BarChart3 },
  { key: 'nav.settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl p-2 text-stone-700 hover:bg-stone-100"
          aria-label={t('menu.open')}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="text-sm font-semibold text-stone-900">
          ReceiptFlow
        </Link>
        <UserMenu />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-stone-900/30" aria-label={t('common.close')} onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-stone-900">ReceiptFlow</span>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('common.close')} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                      active ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6">
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
