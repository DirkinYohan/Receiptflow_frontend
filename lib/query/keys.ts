/**
 * Cache keys. Every key starts with its domain so a change can invalidate a whole
 * domain (['expenses']) or just one entry (['expenses', 'detail', 7]).
 */
export const qk = {
  documents: {
    all: ['documents'] as const,
    list: (params: object) => ['documents', 'list', params] as const,
    detail: (id: number) => ['documents', 'detail', id] as const,
    stats: ['documents', 'stats'] as const,
    review: ['documents', 'review-queue'] as const,
    payables: ['documents', 'payables'] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (params: object) => ['expenses', 'list', params] as const,
    stats: (params: object) => ['expenses', 'stats', params] as const,
    detail: (id: number) => ['expenses', 'detail', id] as const,
    recurring: ['expenses', 'recurring'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: (params: object) => ['dashboard', 'summary', params] as const,
    monthly: (params: object) => ['dashboard', 'monthly', params] as const,
    byCategory: (params: object) => ['dashboard', 'by-category', params] as const,
    bySupplier: (params: object) => ['dashboard', 'by-supplier', params] as const,
    recentExpenses: (limit: number) => ['dashboard', 'recent-expenses', limit] as const,
    recentDocuments: (limit: number) => ['dashboard', 'recent-documents', limit] as const,
  },
  categories: {
    all: ['categories'] as const,
    available: ['categories', 'available'] as const,
    list: (params: object) => ['categories', 'list', params] as const,
  },
  budgets: {
    all: ['budgets'] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    list: (params: object) => ['suppliers', 'list', params] as const,
    autocomplete: (query: string) => ['suppliers', 'autocomplete', query] as const,
  },
};
