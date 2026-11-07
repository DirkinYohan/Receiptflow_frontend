import type { Page, Route } from '@playwright/test';

export const API = 'http://127.0.0.1:8999';

const base64Url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

export const fakeAccessToken = `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url({ exp: 4102444800, user_id: 1 })}.signature`;

export const testUser = {
  id: 1,
  email: 'e2e@receiptflow.test',
  username: 'e2e',
  first_name: 'Prueba',
  last_name: 'E2E',
  full_name: 'Prueba E2E',
  initials: 'PE',
  avatar: null,
  avatar_url: null,
  is_active: true,
  is_staff: false,
  is_superuser: false,
  is_email_verified: true,
  email_verified_at: null,
};

type Handler = (route: Route) => Promise<void> | void;

export async function mockApi(page: Page, overrides: Record<string, Handler> = {}) {
  await page.route(`${API}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204 });
    }
    if (overrides[pathname]) {
      return overrides[pathname](route);
    }
    if (pathname === '/api/auth/refresh/') {
      return route.fulfill({ json: { access: fakeAccessToken, refresh: 'refresh-token' } });
    }
    if (pathname === '/api/v1/users/me/') {
      return route.fulfill({ json: { status: 'success', data: testUser } });
    }
    return route.fulfill({ json: { status: 'success', data: [], results: [], count: 0 } });
  });
}
