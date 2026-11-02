import { QueryClient, QueryKey } from '@tanstack/react-query';
import { qk } from './keys';

/**
 * What each kind of write can change. Invalidating only marks those entries as stale:
 * the ones on screen refetch now, the rest refetch the next time they are shown.
 * Nothing else is touched, and the page never reloads.
 */
const AFFECTS: Record<Change, readonly QueryKey[]> = {
  // Reading/approving a document can create or update its expense, supplier and budget usage.
  document: [qk.documents.all, qk.expenses.all, qk.dashboard.all, qk.budgets.all, qk.suppliers.all],
  // Paid / unpaid only moves the document between "to pay" lists and the paid counters.
  documentPaid: [qk.documents.all, qk.dashboard.all],
  expense: [qk.expenses.all, qk.dashboard.all, qk.budgets.all, qk.suppliers.all, qk.documents.all],
  // Supplier names and favorites appear in documents and expenses too.
  supplier: [qk.suppliers.all, qk.documents.all, qk.expenses.all, qk.dashboard.all],
  category: [qk.categories.all, qk.budgets.all, qk.expenses.all, qk.documents.all, qk.dashboard.all],
  budget: [qk.budgets.all],
};

export type Change = 'document' | 'documentPaid' | 'expense' | 'supplier' | 'category' | 'budget';

export function invalidateAfter(client: QueryClient, change: Change) {
  return Promise.all(AFFECTS[change].map((queryKey) => client.invalidateQueries({ queryKey })));
}
