'use client';

import React, { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { usersService } from '@/services/users.service';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { ApiError } from '@/types/api';

export function PasswordSettingsCard() {
  const { t } = useI18n();
  const { success: toastSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'));
      return;
    }

    setIsChangingPassword(true);

    try {
      await usersService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toastSuccess(t('settings.passwordOk'));
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setPasswordError(apiErr.message || t('settings.passwordError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{t('settings.security')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {passwordError && (
          <Alert type="danger" className="mb-4" onClose={() => setPasswordError('')}>
            {passwordError}
          </Alert>
        )}

        {passwordSuccess && (
          <Alert type="success" className="mb-4">
            {t('settings.passwordUpdated')}
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label={t('settings.currentPassword')}
            type="password"
            required
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isChangingPassword}
          />

          <Input
            label={t('settings.newPassword')}
            type="password"
            required
            placeholder={t('settings.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isChangingPassword}
          />

          <Input
            label={t('settings.confirmPassword')}
            type="password"
            required
            placeholder={t('settings.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isChangingPassword}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            variant="outline"
            isLoading={isChangingPassword}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            {t('settings.updatePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
