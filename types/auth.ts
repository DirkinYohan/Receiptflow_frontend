export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  initials: string;
  avatar: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_email_verified: boolean;
  email_verified_at: string | null;
  last_login: string | null;
  last_activity_at: string | null;
  date_joined: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  status: 'success' | 'error';
  message: string;
  user: User;
  tokens?: AuthTokens | null;
  requires_email_verification?: boolean;
}

export interface RefreshTokenResponse {
  status: 'success' | 'error';
  message: string;
  tokens: {
    access: string;
    refresh?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  accept_terms: boolean;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  email: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface EmailVerificationPayload {
  email: string;
  token: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
  avatar?: File | null;
}
