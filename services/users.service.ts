import { apiClient } from '@/lib/api-client';
import { User, ChangePasswordPayload, UpdateProfilePayload } from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const usersService = {
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient<ApiResponse<User>>('/api/v1/users/me/');
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<User>> {
    if (payload.avatar instanceof File) {
      const formData = new FormData();
      formData.append('first_name', payload.first_name);
      formData.append('last_name', payload.last_name);
      formData.append('avatar', payload.avatar);

      return apiClient<ApiResponse<User>>('/api/v1/users/me/', {
        method: 'PATCH',
        body: formData,
      });
    }

    return apiClient<ApiResponse<User>>('/api/v1/users/me/', {
      method: 'PATCH',
      body: JSON.stringify({
        first_name: payload.first_name,
        last_name: payload.last_name,
      }),
    });
  },

  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
    return apiClient<ApiResponse>('/api/v1/users/me/change-password/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
