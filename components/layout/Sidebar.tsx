'use client';

import React from 'react';
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
  Receipt,
  Settings,
} from 'lucide-react';
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

export function Sidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className={`sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 ${className}`}>
      <div className="px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Receipt className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100">ReceiptFlow</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-stone-100'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
