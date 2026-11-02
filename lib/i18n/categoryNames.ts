import type { Locale } from './messages';

type CategoryEntry = {
  slug: string;
  es: string;
  en: string;
  description: { es: string; en: string };
};

/**
 * Categorías del sistema (`scope = 'system'`).
 * En la base de datos se guardan con el nombre en inglés
 * (ver `seed_categories.py` en el backend), por eso se traducen aquí.
 */
const SYSTEM_CATEGORIES: CategoryEntry[] = [
  {
    slug: 'food',
    es: 'Alimentación',
    en: 'Food',
    description: {
      es: 'Gastos en restaurantes, comida, supermercado y alimentos.',
      en: 'Restaurants, groceries, supermarkets and food.',
    },
  },
  {
    slug: 'transportation',
    es: 'Transporte',
    en: 'Transportation',
    description: {
      es: 'Gastos de transporte: gasolina, taxi, autobús, vuelos, peajes.',
      en: 'Transport: fuel, taxis, buses, flights and tolls.',
    },
  },
  {
    slug: 'technology',
    es: 'Tecnología',
    en: 'Technology',
    description: {
      es: 'Hardware, software, suscripciones tecnológicas, accesorios.',
      en: 'Hardware, software, tech subscriptions and accessories.',
    },
  },
  {
    slug: 'health',
    es: 'Salud',
    en: 'Health',
    description: {
      es: 'Médicos, medicinas, seguros de salud, consultas, dentistas.',
      en: 'Doctors, medicine, health insurance, appointments and dentists.',
    },
  },
  {
    slug: 'home',
    es: 'Hogar',
    en: 'Home',
    description: {
      es: 'Renta, servicios, muebles, reparaciones y mantenimiento del hogar.',
      en: 'Rent, utilities, furniture, repairs and home upkeep.',
    },
  },
  {
    slug: 'entertainment',
    es: 'Entretenimiento',
    en: 'Entertainment',
    description: {
      es: 'Cine, streaming, eventos, deportes, suscripciones de ocio.',
      en: 'Movies, streaming, events, sports and leisure subscriptions.',
    },
  },
  {
    slug: 'education',
    es: 'Educación',
    en: 'Education',
    description: {
      es: 'Cursos, libros, colegiaturas, capacitaciones y material educativo.',
      en: 'Courses, books, tuition, training and school supplies.',
    },
  },
  {
    slug: 'shopping',
    es: 'Compras',
    en: 'Shopping',
    description: {
      es: 'Ropa, accesorios, compras generales y bienes de consumo.',
      en: 'Clothes, accessories, general shopping and consumer goods.',
    },
  },
  {
    slug: 'other',
    es: 'Otros',
    en: 'Other',
    description: {
      es: 'Gastos misceláneos que no encajan en otras categorías.',
      en: 'Miscellaneous expenses that fit no other category.',
    },
  },
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

/** Description in the active language; user categories keep what the user wrote. */
export function localizeCategoryDescription(
  category: CategoryLike & { description?: string | null },
  locale: Locale
): string {
  const raw = category.description ?? '';
  const isSystem = category.is_system ?? category.scope === 'system';
  if (!isSystem) return raw;
  const entry =
    (category.slug ? BY_SLUG.get(category.slug) : undefined) ??
    BY_NAME.get((category.name ?? '').trim().toLowerCase());
  return entry ? entry.description[locale] : raw;
}
