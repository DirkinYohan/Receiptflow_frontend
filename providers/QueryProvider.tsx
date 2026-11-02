'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/types/api';

function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') return false;
  const status = (error as ApiError | undefined)?.statusCode;
  // 4xx are final answers (session, permissions, validation): retrying only adds traffic.
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for a minute: moving between modules reuses it without new requests.
        staleTime: 60_000,
        // Unused data is kept 10 minutes, so coming back shows it instantly while it revalidates.
        gcTime: 10 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

/**
 * One cache per browser tab, in memory only (never persisted), so private data
 * is not written to disk. AuthProvider clears it on login, logout and expired sessions.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
