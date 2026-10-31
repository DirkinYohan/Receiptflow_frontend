import { apiClient } from '@/lib/api-client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
  EmailVerificationPayload,
  RefreshTokenResponse,
} from '@/types/auth';
import { ApiResponse } from '@/types/api';
import { getRefreshToken } from '@/lib/auth-tokens';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async logout(): Promise<void> {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await apiClient<ApiResponse>('/api/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // Even if server call fails, local cleanup will occur
      }
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    const refresh = getRefreshToken();
    return apiClient<RefreshTokenResponse>('/api/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
      skipAuth: true,
    });
  },

  async requestPasswordReset(
    payload: PasswordResetRequestPayload
  ): Promise<ApiResponse> {
    return apiClient<ApiResponse>('/api/auth/password-reset/', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async confirmPasswordReset(
    payload: PasswordResetConfirmPayload
  ): Promise<ApiResponse> {
    return apiClient<ApiResponse>('/api/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async verifyEmail(payload: EmailVerificationPayload): Promise<ApiResponse> {
    return apiClient<ApiResponse>('/api/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    return apiClient<ApiResponse>('/api/auth/resend-verification-email/', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  },
};
