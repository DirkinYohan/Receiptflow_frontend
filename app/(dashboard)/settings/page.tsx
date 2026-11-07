'use client';

import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Shield,
  Calendar,
  Save,
  KeyRound,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { usersService } from '@/services/users.service';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { LanguageSelector } from '@/components/features/i18n/LanguageSelector';
import { ThemeToggle } from '@/components/features/theme/ThemeToggle';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { ApiError } from '@/types/api';

export default function SettingsPage() {
  const { user, refreshUser, updateUserData } = useAuth();
  const { success: toastSuccess } = useToast();
  const { t } = useI18n();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');

    try {
      const res = await usersService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        avatar: avatarFile,
      });
      if (res.data) {
        updateUserData(res.data);
      }
      toastSuccess(t('settings.profileOk'));
      refreshUser();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setProfileError(apiErr.message || t('settings.profileError'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('settings.title')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('settings.language')}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <LanguageSelector />
          <ThemeToggle />
          <span className="text-sm text-stone-500 dark:text-stone-400">{t('theme.hint')}</span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xl font-bold overflow-hidden shadow-md">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.initials || 'U'}</span>
                )}
              </div>
              <label
                htmlFor="avatar_input"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer shadow-xs hover:scale-110 transition-transform"
                title={t('settings.changePhoto')}
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="avatar_input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {user.full_name || user.email}
                </h3>
                <Badge variant={user.is_email_verified ? 'success' : 'warning'} size="sm">
                  {user.is_email_verified ? t('settings.verified') : t('settings.unverified')}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 dark:text-zinc-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 border-t sm:border-t-0 pt-3 sm:pt-0 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <span>{t('settings.memberSince', { date: formatDate(user.date_joined) })}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('settings.personalInfo')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileError && (
              <Alert type="danger" className="mb-4" onClose={() => setProfileError('')}>
                {profileError}
              </Alert>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label={t('settings.firstName')}
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isUpdatingProfile}
              />

              <Input
                label={t('settings.lastName')}
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isUpdatingProfile}
              />

              <Input
                label={t('settings.email')}
                type="email"
                disabled
                value={user.email}
                helperText={t('settings.emailLocked')}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isUpdatingProfile}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {t('settings.saveProfile')}
              </Button>
            </form>
          </CardContent>
        </Card>

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('settings.accountDetails')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs sm:text-sm">
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">{t('settings.userId')}</span>
            <span className="font-mono font-medium">{user.id}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">{t('settings.username')}</span>
            <span className="font-mono font-medium">{user.username}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">{t('settings.accountStatus')}</span>
            <span className="text-emerald-600 font-semibold dark:text-emerald-400">
              {user.is_active ? t('settings.active') : t('settings.inactive')}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">{t('settings.lastLogin')}</span>
            <span className="text-zinc-500 dark:text-zinc-400">{formatDateTime(user.last_login)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">{t('settings.lastActivity')}</span>
            <span className="text-zinc-500 dark:text-zinc-400">{formatDateTime(user.last_activity_at)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
