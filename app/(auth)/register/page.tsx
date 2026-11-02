'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/providers/I18nProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Mail, Lock, User as UserIcon, UserPlus, Receipt } from 'lucide-react';
import { ApiError } from '@/types/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    accept_terms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    if (formData.password !== formData.password_confirm) {
      setFieldErrors({ password_confirm: t('auth.passwordMismatch') });
      return;
    }

    if (!formData.accept_terms) {
      setErrorMessage(t('auth.acceptTermsRequired'));
      return;
    }

    setIsLoading(true);

    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        accept_terms: formData.accept_terms,
      });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(
        apiErr.message || t('auth.registerError')
      );
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
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
          {t('auth.registerTitle')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('auth.registerSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <Alert type="danger" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('auth.firstName')}
            name="first_name"
            required
            placeholder={t('auth.firstNamePlaceholder')}
            value={formData.first_name}
            onChange={handleChange}
            startIcon={<UserIcon className="w-4 h-4" />}
            error={fieldErrors.first_name}
            disabled={isLoading}
          />
          <Input
            label={t('auth.lastName')}
            name="last_name"
            required
            placeholder={t('auth.lastNamePlaceholder')}
            value={formData.last_name}
            onChange={handleChange}
            startIcon={<UserIcon className="w-4 h-4" />}
            error={fieldErrors.last_name}
            disabled={isLoading}
          />
        </div>

        <Input
          label={t('auth.emailLabel')}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={formData.email}
          onChange={handleChange}
          startIcon={<Mail className="w-4 h-4" />}
          error={fieldErrors.email}
          disabled={isLoading}
        />

        <Input
          label={t('auth.password')}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder={t('auth.passwordPlaceholder')}
          value={formData.password}
          onChange={handleChange}
          startIcon={<Lock className="w-4 h-4" />}
          error={fieldErrors.password}
          disabled={isLoading}
        />

        <Input
          label={t('auth.confirmPassword')}
          name="password_confirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder={t('auth.confirmPasswordPlaceholder')}
          value={formData.password_confirm}
          onChange={handleChange}
          startIcon={<Lock className="w-4 h-4" />}
          error={fieldErrors.password_confirm}
          disabled={isLoading}
        />

        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="accept_terms"
            name="accept_terms"
            type="checkbox"
            required
            checked={formData.accept_terms}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer dark:text-indigo-400"
            disabled={isLoading}
          />
          <label
            htmlFor="accept_terms"
            className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal"
          >
            {t('auth.acceptTerms')}
          </label>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          {t('auth.createAccount')}
        </Button>
      </form>

      <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('auth.hasAccount')}{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline"
          >
            {t('auth.loginCta')}
          </Link>
        </p>
      </div>
    </div>
  );
}
