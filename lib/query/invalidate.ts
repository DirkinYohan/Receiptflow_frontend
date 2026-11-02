import { QueryClient, QueryKey } from '@tanstack/react-query';
import { qk } from './keys';

const AFFECTS: Record<Change, readonly QueryKey[]> = {
  document: [qk.documents.all, qk.expenses.all, qk.dashboard.all, qk.budgets.all, qk.suppliers.all],
  documentPaid: [qk.documents.all, qk.dashboard.all],
  expense: [qk.expenses.all, qk.dashboard.all, qk.budgets.all, qk.suppliers.all, qk.documents.all],
  supplier: [qk.suppliers.all, qk.documents.all, qk.expenses.all, qk.dashboard.all],
  category: [qk.categories.all, qk.budgets.all, qk.expenses.all, qk.documents.all, qk.dashboard.all],
  budget: [qk.budgets.all],
};

export type Change = 'document' | 'documentPaid' | 'expense' | 'supplier' | 'category' | 'budget';

export function invalidateAfter(client: QueryClient, change: Change) {
  return Promise.all(AFFECTS[change].map((queryKey) => client.invalidateQueries({ queryKey })));
}
