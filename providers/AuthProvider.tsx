'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { User, LoginCredentials, RegisterPayload } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { usersService } from '@/services/users.service';
import { getAccessToken, setTokens, clearTokens } from '@/lib/auth-tokens';
import { useToast } from './ToastProvider';
import { translate } from '@/lib/i18n/translate';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserData: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const { info: toastInfo } = useToast();
  const queryClient = useQueryClient();
  const profileRequest = useRef<Promise<void> | null>(null);

  const resetCache = useCallback(() => queryClient.clear(), [queryClient]);

  const fetchCurrentUser = useCallback(() => {
    if (profileRequest.current) return profileRequest.current;
    profileRequest.current = (async () => {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const res = await usersService.getProfile();
        if (res.data) {
          setUser(res.data);
        }
      } catch {
        clearTokens();
        resetCache();
        setUser(null);
      } finally {
        setIsLoading(false);
        profileRequest.current = null;
      }
    })();
    return profileRequest.current;
  }, [resetCache]);

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => {
      clearTokens();
      resetCache();
      setUser(null);
      toastInfo(translate('api.sessionExpired'), translate('api.sessionEnded'));
      router.push('/login');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [fetchCurrentUser, resetCache, router, toastInfo]);

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
    const token = getAccessToken();

    if (!token && !isPublic) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (token && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [isLoading, pathname, router]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      resetCache();
      if (res.tokens) {
        setTokens(res.tokens);
      }
      if (res.user) {
        setUser(res.user);
      }
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await authService.register(payload);

      if (res.requires_email_verification || !res.tokens) {
        router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
        return;
      }

      resetCache();
      setTokens(res.tokens);
      if (res.user) {
        setUser(res.user);
      }
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      clearTokens();
      resetCache();
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateUserData = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
