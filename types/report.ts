export interface DashboardSummary {
  total_expenses: number | string;
  expenses_count: number;
  average_expense: number | string;
  max_expense: number | string | null;
  min_expense: number | string | null;
  documents_count: number;
  documents_processed: number;
  suppliers_count: number;
  categories_count: number;
  expense_variation_pct: number;
  period: {
    start: string;
    end: string;
  };
}

export interface MonthlyExpense {
  month: string;
  label: string;
  count: number;
  total: number;
}

export interface CategoryExpense {
  category_id: number | null;
  name: string | null;
  icon: string | null;
  color: string | null;
  scope: string | null;
  count: number;
  total: number;
}

export interface SupplierExpense {
  supplier_id: number | null;
  name: string | null;
  tax_id: string | null;
  count: number;
  total: number;
}

export interface RecentExpenseItem {
  id: number;
  description: string;
  amount: number;
  currency: string;
  incurred_at: string;
  category: {
    id: number | null;
    name: string | null;
    color: string | null;
    icon: string | null;
  };
  supplier: {
    id: number | null;
    name: string | null;
  };
  document_id: number | null;
}

export interface RecentDocumentItem {
  id: number;
  title: string;
  document_type: string;
  status: string;
  total_amount: number | null;
  currency: string;
  supplier_name: string | null;
  category_name: string | null;
  created_at: string;
  processed_at: string | null;
  issued_at: string | null;
}

export interface ExpenseEvolutionItem {
  month: string;
  total: number;
  count: number;
}
