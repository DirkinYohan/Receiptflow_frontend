'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/types/api';
import { useI18n } from '@/providers/I18nProvider';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await authService.requestPasswordReset({ email });
      setSuccessMessage(t('auth.forgotSent'));
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || t('auth.forgotError'));
    } finally {
      setIsLoading(false);
    }
  };

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
          {t('auth.forgotPageTitle')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('auth.forgotPageSubtitle')}
        </p>
      </div>

      {successMessage && (
        <Alert type="success">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert type="danger" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {!successMessage ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.emailLabel')}
            type="email"
            required
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startIcon={<Mail className="w-4 h-4" />}
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            {t('auth.sendResetLink')}
          </Button>
        </form>
      ) : (
        <div className="pt-2">
          <Link href="/reset-password">
            <Button variant="outline" className="w-full">
              {t('auth.haveRecoveryToken')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
