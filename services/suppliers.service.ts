import { apiClient } from '@/lib/api-client';
import {
  Supplier,
  SupplierAutocomplete,
  SupplierCreatePayload,
  SupplierUpdatePayload,
} from '@/types/supplier';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export const suppliersService = {
  async getSuppliers(
    params: { page?: number; is_favorite?: boolean; search?: string; ordering?: string } = {}
  ): Promise<PaginatedResponse<Supplier>> {
    return apiClient<PaginatedResponse<Supplier>>('/api/v1/suppliers/', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  async autocomplete(query: string = ''): Promise<ApiResponse<SupplierAutocomplete[]>> {
    return apiClient<ApiResponse<SupplierAutocomplete[]>>(
      '/api/v1/suppliers/autocomplete/',
      {
        params: { q: query },
      }
    );
  },

  async getSupplier(id: number): Promise<ApiResponse<Supplier>> {
    return apiClient<ApiResponse<Supplier>>(`/api/v1/suppliers/${id}/`);
  },

  async createSupplier(
    payload: SupplierCreatePayload
  ): Promise<ApiResponse<Supplier>> {
    return apiClient<ApiResponse<Supplier>>('/api/v1/suppliers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSupplier(
    id: number,
    payload: SupplierUpdatePayload
  ): Promise<ApiResponse<Supplier>> {
    return apiClient<ApiResponse<Supplier>>(`/api/v1/suppliers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteSupplier(id: number): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/api/v1/suppliers/${id}/`, {
      method: 'DELETE',
    });
  },

  async toggleFavorite(id: number): Promise<ApiResponse<{ is_favorite: boolean }>> {
    return apiClient<ApiResponse<{ is_favorite: boolean }>>(
      `/api/v1/suppliers/${id}/toggle-favorite/`,
      {
        method: 'POST',
      }
    );
  },
};
