'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { getAccessToken } from '@/lib/auth-tokens';
import { LoadingState } from '@/components/ui/LoadingState';
import { LanguageSelector } from '@/components/features/i18n/LanguageSelector';
import { ThemeToggle } from '@/components/features/theme/ThemeToggle';

const SESSION_REDIRECT_ROUTES = ['/login', '/register'];

function subscribeToNothing() {
  return () => {};
}

function useHasStoredSession() {
  return useSyncExternalStore(subscribeToNothing, () => !!getAccessToken(), () => false);
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const hasStoredSession = useHasStoredSession();
  const resumingSession =
    SESSION_REDIRECT_ROUTES.includes(pathname) && hasStoredSession && (isLoading || isAuthenticated);

  return (
    <div className="grid min-h-screen bg-[#f6f7f8] lg:grid-cols-2 dark:bg-stone-950">
      <div className="hidden flex-col justify-between bg-white p-12 lg:flex dark:bg-stone-900">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Receipt className="h-5 w-5" />
          </span>
          <span className="text-xl font-semibold text-stone-900 dark:text-stone-100">ReceiptFlow</span>
        </Link>
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{t('auth.showcaseTitle')}</h2>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{t('auth.showcaseText')}</p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('auth.point1')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('auth.point1b')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('auth.point2')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('auth.point2b')}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-stone-400 dark:text-stone-500">© {new Date().getFullYear()} ReceiptFlow</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-end gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          {resumingSession ? <LoadingState text={t('auth.checkingSession')} /> : children}
        </div>
      </div>
    </div>
  );
}
