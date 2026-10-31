'use client';

import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Shield,
  CheckCircle2,
  Calendar,
  Clock,
  Save,
  AlertCircle,
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
import { formatDateTime } from '@/lib/formatters';
import { ApiError } from '@/types/api';

export default function SettingsPage() {
  const { user, refreshUser, updateUserData } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t } = useI18n();

  // Profile Form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Form state
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
      toastSuccess('Perfil actualizado correctamente.');
      refreshUser();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setProfileError(apiErr.message || 'Error al actualizar el perfil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.');
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('settings.title')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-stone-900">{t('settings.language')}</h3>
        <div className="mt-3">
          <LanguageSelector />
        </div>
      </Card>

      {/* Account Status Card */}
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
                title="Cambiar foto de perfil"
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
                  {user.is_email_verified ? 'Verificado' : 'Pendiente Verificación'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 border-t sm:border-t-0 pt-3 sm:pt-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span>Miembro desde {formatDateTime(user.date_joined).split(',')[0]}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Edit Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <span>Información Personal</span>
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
                label="Nombre"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isUpdatingProfile}
              />

              <Input
                label="Apellido"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isUpdatingProfile}
              />

              <Input
                label="Correo electrónico"
                type="email"
                disabled
                value={user.email}
                helperText="El correo no se puede modificar directamente."
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isUpdatingProfile}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Guardar Perfil
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Seguridad y Contraseña</span>
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
                Tu contraseña ha sido actualizada.
              </Alert>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Contraseña actual"
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
              />

              <Input
                label="Nueva contraseña"
                type="password"
                required
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />

              <Input
                label="Confirmar nueva contraseña"
                type="password"
                required
                placeholder="Repite la nueva contraseña"
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
                Actualizar Contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Info Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Detalles de la Cuenta y Auditoría</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs sm:text-sm">
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500">ID de Usuario</span>
            <span className="font-mono font-medium">{user.id}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500">Nombre de Usuario</span>
            <span className="font-mono font-medium">{user.username}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500">Estado de la cuenta</span>
            <span className="text-emerald-600 font-semibold">
              {user.is_active ? 'Activa y autorizada' : 'Desactivada'}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500">Última sesión registrada</span>
            <span className="text-zinc-500">{formatDateTime(user.last_login)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-zinc-500">Última actividad</span>
            <span className="text-zinc-500">{formatDateTime(user.last_activity_at)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
