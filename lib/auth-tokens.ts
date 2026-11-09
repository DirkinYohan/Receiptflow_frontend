import { AuthTokens } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'receiptflow_access_token';
const REFRESH_TOKEN_KEY = 'receiptflow_refresh_token';
const REMEMBER_KEY = 'receiptflow_remember';
const LAST_ACTIVITY_KEY = 'receiptflow_last_activity';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

function isRemembered(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === '1';
}

function activeStorage(): Storage {
  return isRemembered() ? localStorage : sessionStorage;
}

function removeTokensFrom(storage: Storage): void {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(LAST_ACTIVITY_KEY);
}

export function isSessionIdle(now: number = Date.now()): boolean {
  if (typeof window === 'undefined' || isRemembered()) return false;
  const last = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || 0);
  return Boolean(sessionStorage.getItem(ACCESS_TOKEN_KEY)) && now - last > IDLE_TIMEOUT_MS;
}

function readToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  if (!isRemembered()) {
    removeTokensFrom(localStorage);
    if (isSessionIdle()) {
      removeTokensFrom(sessionStorage);
      return null;
    }
  }
  return activeStorage().getItem(key);
}

export function getTokens(): AuthTokens | null {
  const access = readToken(ACCESS_TOKEN_KEY);
  const refresh = readToken(REFRESH_TOKEN_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function getAccessToken(): string | null {
  return readToken(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return readToken(REFRESH_TOKEN_KEY);
}

export function markActivity(now: number = Date.now()): void {
  if (typeof window === 'undefined' || isRemembered()) return;
  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  }
}

export function setTokens(tokens: { access: string; refresh?: string }, remember?: boolean): void {
  if (typeof window === 'undefined') return;
  if (remember !== undefined) {
    removeTokensFrom(localStorage);
    removeTokensFrom(sessionStorage);
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, '1');
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }
  const storage = activeStorage();
  storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  if (tokens.refresh) {
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
  markActivity();
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  removeTokensFrom(localStorage);
  removeTokensFrom(sessionStorage);
  localStorage.removeItem(REMEMBER_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(decodedJson);
    if (!decoded.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
}
