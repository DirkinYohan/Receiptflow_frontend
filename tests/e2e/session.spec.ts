import { expect, test } from '@playwright/test';
import { fakeAccessToken, mockApi, testUser } from './mock-api';

async function mockLogin(page: import('@playwright/test').Page) {
  await mockApi(page, {
    '/api/auth/login/': (route) =>
      route.fulfill({
        json: {
          status: 'success',
          message: 'Inicio de sesión exitoso.',
          user: testUser,
          tokens: { access: fakeAccessToken, refresh: 'refresh-token' },
        },
      }),
  });
}

async function signIn(page: import('@playwright/test').Page, remember: boolean) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /^Correo/ }).fill(testUser.email);
  await page.getByRole('textbox', { name: /^Contraseña/ }).fill('ClaveDePrueba1!');
  if (remember) await page.getByLabel('Mantener la sesión iniciada en este dispositivo').check();
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('by default the session ends when the browser is closed', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await mockLogin(page);
  await signIn(page, false);

  const stored = await page.evaluate(() => ({
    session: sessionStorage.getItem('receiptflow_access_token'),
    local: localStorage.getItem('receiptflow_access_token'),
  }));
  expect(stored.session).toBeTruthy();
  expect(stored.local).toBeNull();

  const reopened = await context.newPage();
  await mockLogin(reopened);
  await reopened.goto('/');
  await reopened.goto('/dashboard');
  await expect(reopened).toHaveURL(/\/login/);
  await context.close();
});

test('the session expires after 30 minutes without activity', async ({ page }) => {
  await mockLogin(page);
  await page.addInitScript((token) => {
    if (sessionStorage.getItem('e2e-seeded')) return;
    sessionStorage.setItem('e2e-seeded', '1');
    sessionStorage.setItem('receiptflow_access_token', token);
    sessionStorage.setItem('receiptflow_refresh_token', 'refresh-token');
    sessionStorage.setItem('receiptflow_last_activity', String(Date.now() - 31 * 60 * 1000));
  }, fakeAccessToken);
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('"keep me signed in" survives closing the browser', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await mockLogin(page);
  await signIn(page, true);
  expect(await page.evaluate(() => localStorage.getItem('receiptflow_remember'))).toBe('1');

  const reopened = await context.newPage();
  await mockLogin(reopened);
  await reopened.goto('/dashboard');
  await expect(reopened).toHaveURL(/\/dashboard$/);
  await context.close();
});

test('an old session saved without "keep me signed in" is ignored', async ({ page }) => {
  await mockLogin(page);
  await page.addInitScript((token) => {
    localStorage.setItem('receiptflow_access_token', token);
    localStorage.setItem('receiptflow_refresh_token', 'refresh-token');
  }, fakeAccessToken);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => localStorage.getItem('receiptflow_access_token'))).toBeNull();
});
