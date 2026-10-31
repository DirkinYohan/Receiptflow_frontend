import { apiClient } from '@/lib/api-client';
import { CategoryBudget } from '@/types/category';
import { ApiResponse } from '@/types/api';

export const budgetsService = {
  async getBudgets(): Promise<ApiResponse<CategoryBudget[]>> {
    return apiClient<ApiResponse<CategoryBudget[]>>('/api/v1/budgets/');
  },

  // Saving a budget for a category that already has one updates it.
  async saveBudget(category: number, monthlyAmount: number): Promise<ApiResponse<CategoryBudget>> {
    return apiClient<ApiResponse<CategoryBudget>>('/api/v1/budgets/', {
      method: 'POST',
      body: JSON.stringify({ category, monthly_amount: monthlyAmount }),
    });
  },

  async deleteBudget(id: number): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/api/v1/budgets/${id}/`, { method: 'DELETE' });
  },
};
