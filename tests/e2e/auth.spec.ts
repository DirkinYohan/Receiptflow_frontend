import { expect, test } from '@playwright/test';
import { fakeAccessToken, mockApi, testUser } from './mock-api';

test('signs in and lands on the dashboard', async ({ page }) => {
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
  await page.goto('/login');
  await page.getByRole('textbox', { name: /^Correo/ }).fill(testUser.email);
  await page.getByRole('textbox', { name: /^Contraseña/ }).fill('ClaveDePrueba1!');
  await page.getByRole('button', { name: /entrar|iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('shows the server message when the credentials are wrong', async ({ page }) => {
  await mockApi(page, {
    '/api/auth/login/': (route) =>
      route.fulfill({ status: 401, json: { status: 'error', message: 'Correo o contraseña incorrectos.' } }),
  });
  await page.goto('/login');
  await page.getByRole('textbox', { name: /^Correo/ }).fill(testUser.email);
  await page.getByRole('textbox', { name: /^Contraseña/ }).fill('ClaveIncorrecta1!');
  await page.getByRole('button', { name: /entrar|iniciar sesión/i }).click();
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('verify-email without a link offers to resend the email', async ({ page }) => {
  await mockApi(page);
  await page.goto('/verify-email?email=e2e%40receiptflow.test');
  await expect(page.getByRole('button', { name: 'Reenviar correo de verificación' })).toBeVisible();
  await expect(page.getByText('Token de verificación')).toHaveCount(0);
});

test('reset-password without a link asks for a new one', async ({ page }) => {
  await mockApi(page);
  await page.goto('/reset-password');
  await expect(page.getByText(/Este enlace no es válido o está incompleto/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pedir un enlace nuevo' })).toBeVisible();
});

test('protected pages redirect to login without a session', async ({ page }) => {
  await mockApi(page);
  await page.goto('/expenses');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fexpenses/);
});
