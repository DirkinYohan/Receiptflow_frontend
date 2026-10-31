export type CategoryScope = 'system' | 'user';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  scope: CategoryScope;
  is_system: boolean;
  is_editable: boolean;
  is_active: boolean;
  sort_order: number;
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AvailableCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  scope: CategoryScope;
  is_system: boolean;
}

export interface CategoryCreatePayload {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export type CategoryUpdatePayload = Partial<CategoryCreatePayload>;

export type BudgetState = 'ok' | 'warning' | 'exceeded';

export interface CategoryBudget {
  id: number;
  category: number;
  category_name: string;
  category_color: string;
  monthly_amount: string;
  currency: string;
  status: {
    spent: string;
    remaining: string;
    percentage: string;
    state: BudgetState;
    month: string;
  };
  created_at: string;
  updated_at: string;
}
