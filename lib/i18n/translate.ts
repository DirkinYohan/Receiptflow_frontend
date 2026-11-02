import { Locale, messages } from './messages';

let activeLocale: Locale = 'es';

export function setTranslateLocale(locale: Locale) {
  activeLocale = locale;
}

export function currentLocale(): Locale {
  return activeLocale;
}

export function lookup(locale: Locale, key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages[locale]);
  return typeof value === 'string' ? value : key;
}

export function translateFor(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  let text = lookup(locale, key);
  if (vars) {
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });
  }
  return text;
}

export function translate(key: string, vars?: Record<string, string | number>): string {
  return translateFor(activeLocale, key, vars);
}
