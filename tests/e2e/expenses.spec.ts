import { expect, test } from '@playwright/test';
import { fakeAccessToken, mockApi } from './mock-api';

const expense = {
  id: 7,
  document: null,
  category: 1,
  category_name: 'Alimentación',
  supplier: null,
  supplier_name: null,
  description: 'Almuerzo de prueba',
  amount: '25000.00',
  tax_amount: '0.00',
  discount_amount: '0.00',
  tip_amount: '0.00',
  total_amount: '25000.00',
  currency: 'COP',
  payment_method: 'cash',
  incurred_at: '2026-11-01T12:00:00Z',
  is_recurring: false,
  recurrence_frequency: '',
  is_reimbursable: false,
  has_line_items: false,
  line_items_count: 0,
  notes: '',
  created_at: '2026-11-01T12:00:00Z',
  updated_at: '2026-11-01T12:00:00Z',
};

test('the expense form loads the expense to edit and starts empty for a new one', async ({ page }) => {
  await mockApi(page, {
    '/api/v1/expenses/': (route) =>
      route.fulfill({ json: { count: 1, next: null, previous: null, results: [expense] } }),
  });
  await page.addInitScript((token) => {
    localStorage.setItem('receiptflow_access_token', token);
    localStorage.setItem('receiptflow_refresh_token', 'refresh-token');
    localStorage.setItem('receiptflow_remember', '1');
  }, fakeAccessToken);

  await page.goto('/expenses');
  await expect(page.getByText('Almuerzo de prueba')).toBeVisible();

  await page.getByTitle(/^Editar/).first().click();
  const description = page.locator('input[name="description"]');
  await expect(description).toHaveValue('Almuerzo de prueba');
  await expect(page.locator('input[name="amount"]')).toHaveValue('25000.00');

  await page.keyboard.press('Escape');
  await expect(description).toHaveCount(0);

  await page.getByRole('button', { name: 'Nuevo gasto' }).first().click();
  await expect(description).toHaveValue('');
  await expect(page.locator('input[name="amount"]')).toHaveValue('');
});
