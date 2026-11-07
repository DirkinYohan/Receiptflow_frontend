import { afterEach, describe, expect, it } from 'vitest';
import { formatCurrency, formatFileSize, setFormatLocale } from '@/lib/formatters';

afterEach(() => setFormatLocale('es'));

describe('formatters', () => {
  it('formats file sizes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('formats Colombian pesos and handles empty values', () => {
    expect(formatCurrency(124300, 'COP', 0)).toMatch(/124\.300/);
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency('not a number')).toBe('$0.00');
  });

  it('switches to US formatting in English', () => {
    setFormatLocale('en');
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.5');
  });
});
