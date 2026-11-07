import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@/types/api';

function mockFetch(status: number, body: unknown) {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (err) {
    return err as ApiError;
  }
  throw new Error('expected the request to fail');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiClient', () => {
  it('returns the parsed body on success', async () => {
    mockFetch(200, { status: 'success', data: { id: 1 } });
    await expect(apiClient('/api/v1/expenses/', { skipAuth: true })).resolves.toEqual({
      status: 'success',
      data: { id: 1 },
    });
  });

  it('maps the backend errors list to field errors', async () => {
    mockFetch(400, {
      status: 'error',
      message: 'Error de validación en los datos enviados.',
      errors: [
        { field: 'new_password', message: 'La contraseña es demasiado común.' },
        { field: 'new_password', message: 'La contraseña es completamente numérica.' },
      ],
    });
    const error = await captureError(apiClient('/api/auth/password-reset/confirm/', { method: 'POST', skipAuth: true }));
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Error de validación en los datos enviados.');
    expect(error.fieldErrors?.new_password).toBe(
      'La contraseña es demasiado común., La contraseña es completamente numérica.',
    );
  });

  it('uses detail when there is no message', async () => {
    mockFetch(403, { detail: 'No tienes permiso.' });
    const error = await captureError(apiClient('/api/v1/users/', { skipAuth: true }));
    expect(error.message).toBe('No tienes permiso.');
  });

  it('reports a connection error when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await captureError(apiClient('/api/v1/expenses/', { skipAuth: true }));
    expect(error.statusCode).toBe(0);
  });
});
