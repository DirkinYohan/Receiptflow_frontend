'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Mail, Lock, LogIn, Receipt } from 'lucide-react';
import { ApiError } from '@/types/api';
import { useI18n } from '@/providers/I18nProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(
        apiErr.message || t('auth.loginError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Receipt className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Receipt<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {t('auth.welcome')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <Alert type="danger" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('auth.email')}
          type="email"
          required
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          startIcon={<Mail className="w-4 h-4" />}
          disabled={isLoading}
        />

        <div className="space-y-1">
          <Input
            label={t('auth.password')}
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startIcon={<Lock className="w-4 h-4" />}
            disabled={isLoading}
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline"
            >
              {t('auth.forgot')}
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          {t('auth.login')}
        </Button>
      </form>

      <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('auth.noAccount')}{' '}
          <Link
            href="/register"
            className="font-semibold text-emerald-800 hover:underline dark:text-emerald-200"
          >
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
