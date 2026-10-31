import type { Locale } from './messages';

type CategoryEntry = { slug: string; es: string; en: string };

/**
 * Categorías del sistema (`scope = 'system'`).
 * En la base de datos se guardan con el nombre en inglés
 * (ver `seed_categories.py` en el backend), por eso se traducen aquí.
 */
const SYSTEM_CATEGORIES: CategoryEntry[] = [
  { slug: 'food', es: 'Alimentación', en: 'Food' },
  { slug: 'transportation', es: 'Transporte', en: 'Transportation' },
  { slug: 'technology', es: 'Tecnología', en: 'Technology' },
  { slug: 'health', es: 'Salud', en: 'Health' },
  { slug: 'home', es: 'Hogar', en: 'Home' },
  { slug: 'entertainment', es: 'Entretenimiento', en: 'Entertainment' },
  { slug: 'education', es: 'Educación', en: 'Education' },
  { slug: 'shopping', es: 'Compras', en: 'Shopping' },
  { slug: 'other', es: 'Otros', en: 'Other' },
];

const BY_SLUG = new Map<string, CategoryEntry>(
  SYSTEM_CATEGORIES.map((entry) => [entry.slug, entry])
);

const BY_NAME = new Map<string, CategoryEntry>();
for (const entry of SYSTEM_CATEGORIES) {
  BY_NAME.set(entry.es.toLowerCase(), entry);
  BY_NAME.set(entry.en.toLowerCase(), entry);
}

export type CategoryLike = {
  name?: string | null;
  slug?: string | null;
  is_system?: boolean;
  scope?: string | null;
};

/**
 * Devuelve el nombre de la categoría en el idioma activo.
 *
 * - Categorías del sistema: se traducen según `locale`.
 * - Categorías propias del usuario: se devuelven tal cual.
 *
 * Acepta un objeto `Category` o directamente un `category_name` (string),
 * que es como llegan en gastos, pagos y presupuestos.
 */
export function localizeCategoryName(
  category: CategoryLike | string | null | undefined,
  locale: Locale
): string {
  if (!category) return '';

  if (typeof category === 'string') {
    const rawLabel = category.trim();
    if (!rawLabel) return '';
    return BY_NAME.get(rawLabel.toLowerCase())?.[locale] ?? category;
  }

  const rawName = category.name ?? '';
  if (!rawName) return '';

  // Si sabemos con certeza que es una categoría del usuario, se respeta tal cual.
  const scopeKnown = category.is_system !== undefined || category.scope != null;
  const isSystem = category.is_system ?? category.scope === 'system';
  if (scopeKnown && !isSystem) return rawName;

  const entry =
    (category.slug ? BY_SLUG.get(category.slug) : undefined) ??
    BY_NAME.get(rawName.trim().toLowerCase());

  return entry ? entry[locale] : rawName;
}
