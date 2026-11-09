import { expect, test, type Page } from '@playwright/test';
import { fakeAccessToken, mockApi } from './mock-api';

async function signIn(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('receiptflow_access_token', token);
    localStorage.setItem('receiptflow_refresh_token', 'refresh-token');
    localStorage.setItem('receiptflow_remember', '1');
  }, fakeAccessToken);
}

test('settings checks that the new passwords match before calling the API', async ({ page }) => {
  let changeRequests = 0;
  await mockApi(page, {
    '/api/v1/users/me/change-password/': (route) => {
      changeRequests += 1;
      return route.fulfill({ json: { status: 'success' } });
    },
  });
  await signIn(page);
  await page.goto('/settings');
  await expect(page.getByText('Seguridad y contraseña')).toBeVisible();
  await page.getByRole('textbox', { name: /^Contraseña actual/ }).fill('ClaveActual1!');
  await page.getByRole('textbox', { name: /^Nueva contraseña/ }).fill('ClaveNueva1!');
  await page.getByRole('textbox', { name: /^Confirmar nueva contraseña/ }).fill('OtraClave1!');
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  await expect(page.getByText('Las contraseñas nuevas no coinciden.')).toBeVisible();
  expect(changeRequests).toBe(0);
});

test('the review queue lists documents that need attention', async ({ page }) => {
  await mockApi(page, {
    '/api/v1/documents/review-queue/': (route) =>
      route.fulfill({
        json: {
          status: 'success',
          data: {
            count: 1,
            results: [
              {
                id: 11,
                title: 'Factura luz',
                original_filename: 'luz.pdf',
                status: 'review_required',
                supplier_data: { id: 3, name: 'Empresa de Energía' },
                total_amount: '98000.00',
                currency: 'COP',
                issued_at: '2026-10-28T12:00:00Z',
                review_reasons: ['No se identificó la fecha de emisión.'],
                missing_fields: [],
              },
            ],
          },
        },
      }),
  });
  await signIn(page);
  await page.goto('/review');
  await expect(page.getByText('Empresa de Energía')).toBeVisible();
  await expect(page.getByText('No se identificó la fecha de emisión.')).toBeVisible();
});
