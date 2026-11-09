'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/LoadingState';
import { CheckCircle2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/types/api';
import { useI18n } from '@/providers/I18nProvider';

function VerifyEmailContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialToken = searchParams.get('token') || '';

  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(Boolean(initialToken));
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!initialToken) return;
    authService
      .verifyEmail(initialEmail ? { email: initialEmail, token: initialToken } : { token: initialToken })
      .then(() => setIsSuccess(true))
      .catch((err: unknown) => {
        const apiErr = err as ApiError;
        setErrorMessage(
          apiErr.statusCode === 400 || !apiErr.message ? tRef.current('auth.verifyInvalidToken') : apiErr.message,
        );
      })
      .finally(() => setIsLoading(false));
  }, [initialEmail, initialToken]);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setErrorMessage(t('auth.verifyEnterEmail'));
      return;
    }
    setResendStatus('loading');
    try {
      await authService.resendVerificationEmail(email);
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
      setErrorMessage(t('auth.verifyResendError'));
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {t('auth.verifySuccessTitle')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
            {t('auth.verifySuccessText')}
          </p>
        </div>
        <Link href="/login" className="block">
          <Button className="w-full">{t('auth.goToLogin')}</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState text={t('auth.verifying')} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 mb-6 transition-colors dark:text-stone-400"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('auth.backToLogin')}</span>
        </Link>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          {t('auth.verifyPageTitle')}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          {t('auth.verifyPageSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <Alert type="danger" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {resendStatus === 'sent' && (
        <Alert type="success">
          {t('auth.verifyResent')}
        </Alert>
      )}

      {initialEmail && !initialToken && (
        <Alert type="info">
          {t('auth.verifySentPrefix')} <strong>{initialEmail}</strong>.{' '}
          {t('auth.verifySentSuffix')}
        </Alert>
      )}

      <form onSubmit={handleResend} className="space-y-4">
        <p className="text-sm text-stone-500 dark:text-stone-400">{t('auth.verifyResendHint')}</p>
        <Input
          label={t('auth.emailLabel')}
          type="email"
          required
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          startIcon={<Mail className="w-4 h-4" />}
          disabled={resendStatus === 'loading'}
        />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          isLoading={resendStatus === 'loading'}
        >
          <RefreshCw className="w-4 h-4" />
          {t('auth.verifyResendButton')}
        </Button>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">{t('common.loading')}</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
