'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/types/api';
import { useI18n } from '@/providers/I18nProvider';

function ResetPasswordForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const hasLink = Boolean(token);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmPasswordReset({
        ...(email ? { email } : {}),
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const fields = apiErr.fieldErrors || {};
      setErrorMessage(
        fields.new_password || fields.confirm_password || (apiErr.statusCode === 400 ? t('auth.resetError') : apiErr.message) || t('auth.resetError'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('auth.resetSuccessTitle')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {t('auth.resetSuccessText')}
          </p>
        </div>
        <Link href="/login" className="block">
          <Button className="w-full">{t('auth.goToLogin')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors dark:text-zinc-400"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('auth.backToLogin')}</span>
        </Link>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {t('auth.resetPageTitle')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('auth.resetPageSubtitle')}
        </p>
      </div>

      {!hasLink ? (
        <div className="space-y-4">
          <Alert type="danger">{t('auth.resetLinkInvalid')}</Alert>
          <Link href="/forgot-password" className="block">
            <Button className="w-full">{t('auth.requestNewLink')}</Button>
          </Link>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="space-y-2">
              <Alert type="danger" onClose={() => setErrorMessage('')}>
                {errorMessage}
              </Alert>
              <Link
                href="/forgot-password"
                className="inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300"
              >
                {t('auth.requestNewLink')}
              </Link>
            </div>
          )}

          {email && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {t('auth.resetForAccount')} <strong className="break-all">{email}</strong>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.newPassword')}
              type="password"
              required
              placeholder={t('auth.passwordPlaceholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              startIcon={<Lock className="w-4 h-4" />}
              disabled={isLoading}
            />

            <Input
              label={t('auth.confirmNewPassword')}
              type="password"
              required
              placeholder={t('auth.confirmNewPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              startIcon={<Lock className="w-4 h-4" />}
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              {t('auth.savePassword')}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-400 dark:text-zinc-500">{t('common.loading')}</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
