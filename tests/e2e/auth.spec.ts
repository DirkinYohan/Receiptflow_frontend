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

test('reset-password works with a link that only has the token', async ({ page }) => {
  let body: Record<string, unknown> = {};
  await mockApi(page, {
    '/api/auth/password-reset/confirm/': async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ json: { status: 'success', message: 'Contraseña restablecida correctamente.' } });
    },
  });
  await page.goto('/reset-password?token=' + 'a'.repeat(64));
  await page.getByRole('textbox', { name: /^Nueva contraseña/ }).fill('Nuev4Clave!Segura');
  await page.getByRole('textbox', { name: /^Confirmar nueva contraseña/ }).fill('Nuev4Clave!Segura');
  await page.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  expect(body).toEqual({ token: 'a'.repeat(64), new_password: 'Nuev4Clave!Segura', confirm_password: 'Nuev4Clave!Segura' });
});

test('verify-email verifies a link that only has the token', async ({ page }) => {
  let body: Record<string, unknown> = {};
  await mockApi(page, {
    '/api/auth/verify-email/': async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ json: { status: 'success', message: 'Correo electrónico verificado correctamente.' } });
    },
  });
  await page.goto('/verify-email?token=' + 'b'.repeat(64));
  await expect(page.getByRole('button', { name: /iniciar sesión|Ir al inicio/i })).toBeVisible();
  expect(body).toEqual({ token: 'b'.repeat(64) });
});
