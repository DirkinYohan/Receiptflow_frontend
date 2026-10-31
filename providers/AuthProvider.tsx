'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, LoginCredentials, RegisterPayload } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { usersService } from '@/services/users.service';
import { getAccessToken, setTokens, clearTokens } from '@/lib/auth-tokens';
import { useToast } from './ToastProvider';

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

  const fetchCurrentUser = useCallback(async () => {
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
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => {
      clearTokens();
      setUser(null);
      toastInfo('Tu sesión ha expirado. Por favor ingresa nuevamente.', 'Sesión terminada');
      router.push('/login');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [fetchCurrentUser, router, toastInfo]);

  // Route protection
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

      // Si la cuenta requiere verificación de correo, NO se inicia sesión:
      // el usuario debe confirmar su correo antes de entrar a la aplicación.
      if (res.requires_email_verification || !res.tokens) {
        router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
        return;
      }

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
