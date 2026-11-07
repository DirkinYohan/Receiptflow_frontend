import { describe, expect, it } from 'vitest';
import { lookup, translateFor } from '@/lib/i18n/translate';
import { messages } from '@/lib/i18n/messages';

function keysOf(node: unknown, prefix = ''): string[] {
  if (!node || typeof node !== 'object') return [prefix];
  return Object.entries(node).flatMap(([key, value]) => keysOf(value, prefix ? `${prefix}.${key}` : key));
}

describe('translations', () => {
  it('has the same keys in Spanish and English', () => {
    expect(keysOf(messages.en).sort()).toEqual(keysOf(messages.es).sort());
  });

  it('looks up nested keys and falls back to the key', () => {
    expect(lookup('es', 'auth.checkingSession')).toBe('Comprobando tu sesión…');
    expect(lookup('en', 'auth.checkingSession')).toBe('Checking your session…');
    expect(lookup('es', 'does.not.exist')).toBe('does.not.exist');
  });

  it('fills variables', () => {
    const key = keysOf(messages.es).find((k) => /\{\w+\}/.test(lookup('es', k))) as string;
    const variable = (lookup('es', key).match(/\{(\w+)\}/) as RegExpMatchArray)[1];
    const text = translateFor('es', key, { [variable]: 'VALOR' });
    expect(text).toContain('VALOR');
    expect(text).not.toContain(`{${variable}}`);
  });
});
