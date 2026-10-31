import { apiClient, apiDownload } from '@/lib/api-client';
import {
  Expense,
  ExpenseDetail,
  ExpenseStats,
  ExpenseCreatePayload,
  ExpenseCreateFromDocumentPayload,
  RecurringItem,
} from '@/types/expense';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export interface ExpenseQueryParams {
  page?: number;
  page_size?: number;
  category?: number;
  supplier?: number;
  payment_method?: string;
  currency?: string;
  min_amount?: number;
  max_amount?: number;
  is_recurring?: boolean;
  is_reimbursable?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
  ordering?: string;
}

export const expensesService = {
  async exportExpenses(
    fileFormat: 'xlsx' | 'csv',
    params: { start_date?: string; end_date?: string; category?: number | string } = {}
  ): Promise<void> {
    return apiDownload('/api/v1/expenses/export/', { file_format: fileFormat, ...params });
  },

  async getRecurring(): Promise<ApiResponse<RecurringItem[]>> {
    return apiClient<ApiResponse<RecurringItem[]>>('/api/v1/expenses/recurring/');
  },

  async getExpenses(
    params: ExpenseQueryParams = {}
  ): Promise<PaginatedResponse<Expense>> {
    return apiClient<PaginatedResponse<Expense>>('/api/v1/expenses/', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  async getExpense(id: number): Promise<ApiResponse<ExpenseDetail>> {
    return apiClient<ApiResponse<ExpenseDetail>>(`/api/v1/expenses/${id}/`);
  },

  async createExpense(
    payload: ExpenseCreatePayload
  ): Promise<ApiResponse<ExpenseDetail>> {
    return apiClient<ApiResponse<ExpenseDetail>>('/api/v1/expenses/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateExpense(
    id: number,
    payload: Partial<ExpenseCreatePayload>
  ): Promise<ApiResponse<ExpenseDetail>> {
    return apiClient<ApiResponse<ExpenseDetail>>(`/api/v1/expenses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteExpense(id: number): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/api/v1/expenses/${id}/`, {
      method: 'DELETE',
    });
  },

  async createFromDocument(
    payload: ExpenseCreateFromDocumentPayload
  ): Promise<ApiResponse<ExpenseDetail>> {
    return apiClient<ApiResponse<ExpenseDetail>>(
      '/api/v1/expenses/from-document/',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async getStats(
    params: ExpenseQueryParams = {}
  ): Promise<ApiResponse<ExpenseStats>> {
    return apiClient<ApiResponse<ExpenseStats>>('/api/v1/expenses/stats/', {
      params: params as Record<string, string | number | boolean>,
    });
  },
};
