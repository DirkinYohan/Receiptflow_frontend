import { expect, test } from '@playwright/test';
import { fakeAccessToken, mockApi } from './mock-api';

function isoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

test('the home page filters its numbers by period', async ({ page }) => {
  const summaryRanges: string[] = [];
  await mockApi(page, {
    '/api/v1/reports/dashboard/summary/': (route) => {
      const url = new URL(route.request().url());
      summaryRanges.push(`${url.searchParams.get('start_date')}..${url.searchParams.get('end_date')}`);
      return route.fulfill({ json: { status: 'success', data: { total_expenses: 0 } } });
    },
    '/api/v1/documents/payables/': (route) =>
      route.fulfill({
        json: {
          status: 'success',
          data: {
            buckets: { overdue: [], due_soon: [], upcoming: [], no_due_date: [] },
            totals: { overdue: 0, due_soon: 0, upcoming: 0, no_due_date: 0 },
          },
        },
      }),
    '/api/v1/documents/stats/': (route) =>
      route.fulfill({ json: { status: 'success', data: { completed: 0, review_required: 0, failed: 0, paid: 0, unpaid: 0 } } }),
    '/api/v1/expenses/': (route) =>
      route.fulfill({ json: { count: 1, results: [{ id: 1, incurred_at: '2025-02-10T12:00:00Z' }] } }),
  });
  await page.addInitScript((token) => {
    localStorage.setItem('receiptflow_access_token', token);
    localStorage.setItem('receiptflow_refresh_token', 'refresh-token');
    localStorage.setItem('receiptflow_remember', '1');
  }, fakeAccessToken);

  const now = new Date();
  const today = isoDate(now);
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Últimos 3 meses' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Este mes' }).click();
  await expect.poll(() => summaryRanges).toContain(`${isoDate(new Date(now.getFullYear(), now.getMonth(), 1))}..${today}`);

  await page.getByRole('button', { name: 'Este año' }).click();
  await expect.poll(() => summaryRanges).toContain(`${now.getFullYear()}-01-01..${today}`);

  await page.getByRole('button', { name: 'Todo' }).click();
  await expect.poll(() => summaryRanges).toContain(`2025-02-10..${today}`);

  await page.getByLabel('Desde').fill('2026-01-15');
  await expect(page.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => summaryRanges).toContain(`2026-01-15..${today}`);
});
