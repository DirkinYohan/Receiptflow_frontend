'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Dropdown } from '@/components/ui/Dropdown';
import { User as UserIcon, LogOut, Settings } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  if (!user) return null;

  const initials =
    user.initials ||
    `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() ||
    'U';

  const trigger = (
    <div className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="hidden md:block text-left">
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {user.full_name || user.email}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {user.email}
        </p>
      </div>
    </div>
  );

  const dropdownItems = [
    {
      label: t('menu.profile'),
      icon: <UserIcon className="w-4 h-4" />,
      onClick: () => {
        router.push('/settings');
      },
    },
    {
      label: t('menu.settings'),
      icon: <Settings className="w-4 h-4" />,
      onClick: () => {
        router.push('/settings');
      },
    },
    {
      label: t('menu.logout'),
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: () => {
        logout();
      },
    },
  ];

  return <Dropdown trigger={trigger} items={dropdownItems} align="right" />;
}
