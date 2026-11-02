import { API_BASE_URL } from './constants';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from './auth-tokens';
import { ApiError } from '@/types/api';
import { currentLocale, translate } from './i18n/translate';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return null;
    }

    const data = await res.json();
    const newAccess = data.tokens?.access || data.access;
    const newRefresh = data.tokens?.refresh || data.refresh || refresh;

    if (newAccess) {
      setTokens({ access: newAccess, refresh: newRefresh });
      return newAccess;
    }
    return null;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth, headers = {}, ...customConfig } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Accept-Language': currentLocale(),
    ...(headers as Record<string, string>),
  };

  // Only set application/json if body is not FormData
  if (!(customConfig.body instanceof FormData) && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    let token = getAccessToken();

    // Check if token is expired before requesting
    if (token && isTokenExpired(token)) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        if (newToken) {
          onRefreshed(newToken);
          token = newToken;
        }
      } else {
        token = await new Promise<string>((resolve) => {
          subscribeTokenRefresh((newToken) => resolve(newToken));
        });
      }
    }

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      headers: reqHeaders,
    });
  } catch (err: unknown) {
    // A cancelled request (newer search, closed page) is not a connection error.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const message = translate('api.connection');
    const error: ApiError = {
      message,
      statusCode: 0,
    };
    throw error;
  }

  // Handle 401 Unauthorized with token refresh retry
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        reqHeaders['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, { ...customConfig, headers: reqHeaders });
        return handleResponse<T>(retryRes);
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
    } else {
      const newToken = await new Promise<string>((resolve) => {
        subscribeTokenRefresh((token) => resolve(token));
      });
      reqHeaders['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, { ...customConfig, headers: reqHeaders });
      return handleResponse<T>(retryRes);
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error: ApiError = {
      message: translate('api.unexpected'),
      statusCode: response.status,
    };

    if (data && typeof data === 'object') {
      if (typeof data.message === 'string') {
        error.message = data.message;
      } else if (typeof data.detail === 'string') {
        error.message = data.detail;
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        error.message = typeof data.errors[0] === 'string' ? data.errors[0] : (data.errors[0].message || translate('api.validation'));
      }

      // Collect field errors
      const fieldErrors: Record<string, string> = {};
      Object.entries(data).forEach(([key, val]) => {
        if (key !== 'status' && key !== 'message' && key !== 'detail') {
          if (Array.isArray(val)) {
            fieldErrors[key] = val.join(', ');
          } else if (typeof val === 'string') {
            fieldErrors[key] = val;
          }
        }
      });
      if (Object.keys(fieldErrors).length > 0) {
        error.fieldErrors = fieldErrors;
        if (!data.message && !data.detail) {
          const firstField = Object.keys(fieldErrors)[0];
          error.message = `${firstField}: ${fieldErrors[firstField]}`;
        }
      }
    }

    throw error;
  }

  return data as T;
}

/** Downloads a file from an authenticated endpoint and hands it to the browser. */
export async function apiDownload(
  endpoint: string,
  params: Record<string, string | number | undefined | null> = {}
): Promise<void> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
  });
  const url = `${API_BASE_URL}${endpoint}${query.toString() ? `?${query}` : ''}`;

  const request = (token: string | null) =>
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  let token = getAccessToken();
  if (token && isTokenExpired(token)) token = await refreshAccessToken();
  let response = await request(token);
  if (response.status === 401) response = await request(await refreshAccessToken());
  if (!response.ok) {
    const error: ApiError = { message: translate('api.download'), statusCode: response.status };
    throw error;
  }

  const disposition = response.headers.get('content-disposition') || '';
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || 'receiptflow-export';
  const href = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
