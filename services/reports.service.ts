import { apiClient } from '@/lib/api-client';
import {
  DashboardSummary,
  MonthlyExpense,
  CategoryExpense,
  SupplierExpense,
  RecentExpenseItem,
  RecentDocumentItem,
  ExpenseEvolutionItem,
} from '@/types/report';
import { ApiResponse } from '@/types/api';

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  months?: number;
}

export const reportsService = {
  // Dashboard Analytics
  async getDashboardSummary(
    params: DateRangeParams = {}
  ): Promise<ApiResponse<DashboardSummary>> {
    return apiClient<ApiResponse<DashboardSummary>>(
      '/api/v1/reports/dashboard/summary/',
      {
        params: params as Record<string, string | number>,
      }
    );
  },

  async getMonthlyExpenses(
    params: DateRangeParams = {}
  ): Promise<ApiResponse<MonthlyExpense[]>> {
    return apiClient<ApiResponse<MonthlyExpense[]>>(
      '/api/v1/reports/dashboard/monthly-expenses/',
      {
        params: params as Record<string, string | number>,
      }
    );
  },

  async getExpensesByCategory(
    params: DateRangeParams = {}
  ): Promise<ApiResponse<CategoryExpense[]>> {
    return apiClient<ApiResponse<CategoryExpense[]>>(
      '/api/v1/reports/dashboard/expenses-by-category/',
      {
        params: params as Record<string, string | number>,
      }
    );
  },

  async getExpensesBySupplier(
    params: DateRangeParams = {}
  ): Promise<ApiResponse<SupplierExpense[]>> {
    return apiClient<ApiResponse<SupplierExpense[]>>(
      '/api/v1/reports/dashboard/expenses-by-supplier/',
      {
        params: params as Record<string, string | number>,
      }
    );
  },

  async getRecentExpenses(limit: number = 10): Promise<ApiResponse<RecentExpenseItem[]>> {
    return apiClient<ApiResponse<RecentExpenseItem[]>>(
      '/api/v1/reports/dashboard/recent-expenses/',
      {
        params: { limit },
      }
    );
  },

  async getRecentDocuments(limit: number = 10): Promise<ApiResponse<RecentDocumentItem[]>> {
    return apiClient<ApiResponse<RecentDocumentItem[]>>(
      '/api/v1/reports/dashboard/recent-documents/',
      {
        params: { limit },
      }
    );
  },

  async getExpenseEvolution(
    params: DateRangeParams = {}
  ): Promise<ApiResponse<ExpenseEvolutionItem[]>> {
    return apiClient<ApiResponse<ExpenseEvolutionItem[]>>(
      '/api/v1/reports/dashboard/expense-evolution/',
      {
        params: params as Record<string, string | number>,
      }
    );
  },

};
