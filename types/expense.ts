import { ExpenseItem, PaymentMethod } from './document';

export interface Expense {
  id: number;
  description: string;
  amount: string;
  currency: string;
  category: number | null;
  category_name?: string;
  supplier: number | null;
  supplier_name?: string;
  document: number | null;
  incurred_at: string;
  payment_method: PaymentMethod | '';
  tax_amount: string;
  discount_amount: string;
  tip_amount: string;
  total_amount: string;
  notes: string;
  is_recurring: boolean;
  recurring_frequency: string;
  is_reimbursable: boolean;
  is_tax_deductible: boolean;
  has_line_items: boolean;
  line_items_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseDetail extends Expense {
  line_items: ExpenseItem[];
}

export interface ExpenseStats {
  count: number;
  total_amount: string | number;
  average_amount: string | number;
  max_amount: string | number | null;
  min_amount: string | number | null;
  recurring_count: number;
  reimbursable_total: string | number;
}

export interface ExpenseCreatePayload {
  description: string;
  amount: number | string;
  currency?: string;
  category?: number | null;
  supplier?: number | null;
  document?: number | null;
  incurred_at: string;
  payment_method?: PaymentMethod | '';
  tax_amount?: number | string;
  discount_amount?: number | string;
  tip_amount?: number | string;
  notes?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  is_reimbursable?: boolean;
  is_tax_deductible?: boolean;
  line_items?: ExpenseItem[];
}

export interface ExpenseCreateFromDocumentPayload {
  document_id: number;
  category_id?: number | null;
  supplier_id?: number | null;
  description?: string;
  payment_method?: string;
  notes?: string;
}

export type RecurringState = 'missing' | 'due_soon' | 'ok';

export interface RecurringItem {
  supplier_id: number | null;
  name: string;
  category_name: string | null;
  frequency: string;
  occurrences: number;
  average_amount: number | string;
  currency: string;
  last_date: string;
  next_expected: string;
  state: RecurringState;
  last_expense_id: number;
}
