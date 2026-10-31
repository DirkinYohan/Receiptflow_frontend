import { apiClient } from '@/lib/api-client';
import {
  Category,
  AvailableCategory,
  CategoryCreatePayload,
  CategoryUpdatePayload,
} from '@/types/category';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export const categoriesService = {
  async getCategories(
    params: { page?: number; scope?: string; is_active?: boolean; search?: string } = {}
  ): Promise<PaginatedResponse<Category>> {
    return apiClient<PaginatedResponse<Category>>('/api/v1/categories/', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  async getAvailableCategories(): Promise<ApiResponse<AvailableCategory[]>> {
    return apiClient<ApiResponse<AvailableCategory[]>>(
      '/api/v1/categories/available/'
    );
  },

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return apiClient<ApiResponse<Category>>(`/api/v1/categories/${id}/`);
  },

  async createCategory(
    payload: CategoryCreatePayload
  ): Promise<ApiResponse<Category>> {
    return apiClient<ApiResponse<Category>>('/api/v1/categories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCategory(
    id: number,
    payload: CategoryUpdatePayload
  ): Promise<ApiResponse<Category>> {
    return apiClient<ApiResponse<Category>>(`/api/v1/categories/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteCategory(id: number): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/api/v1/categories/${id}/`, {
      method: 'DELETE',
    });
  },
};
