import { apiClient } from '@/lib/api-client';
import {
  Document,
  DocumentDetail,
  DocumentStats,
  DocumentStatusResponse,
  DocumentUploadPayload,
  DocumentUpdateExtractedDataPayload,
  PayablesOverview,
  ReviewQueueItem,
} from '@/types/document';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export interface DocumentQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  document_type?: string;
  category?: number;
  supplier?: number;
  currency?: string;
  payment_method?: string;
  is_paid?: boolean;
  issued_at_from?: string;
  issued_at_to?: string;
  created_from?: string;
  created_to?: string;
  min_total?: number;
  max_total?: number;
  search?: string;
  ordering?: string;
}

export const documentsService = {
  async getDocuments(
    params: DocumentQueryParams = {}
  ): Promise<PaginatedResponse<Document>> {
    return apiClient<PaginatedResponse<Document>>('/api/v1/documents/', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  async getDocument(id: number): Promise<ApiResponse<DocumentDetail>> {
    return apiClient<ApiResponse<DocumentDetail>>(`/api/v1/documents/${id}/`);
  },

  async uploadDocument(
    payload: DocumentUploadPayload
  ): Promise<ApiResponse<DocumentDetail>> {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.title) formData.append('title', payload.title);
    if (payload.document_type) formData.append('document_type', payload.document_type);
    if (payload.notes) formData.append('notes', payload.notes);

    return apiClient<ApiResponse<DocumentDetail>>('/api/v1/documents/', {
      method: 'POST',
      body: formData,
    });
  },

  async updateDocument(
    id: number,
    data: Partial<Document>
  ): Promise<ApiResponse<DocumentDetail>> {
    return apiClient<ApiResponse<DocumentDetail>>(`/api/v1/documents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: number): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/api/v1/documents/${id}/`, {
      method: 'DELETE',
    });
  },

  async processDocument(id: number): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/api/v1/documents/${id}/process/`, {
      method: 'POST',
    });
  },

  async retryProcessing(id: number): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/api/v1/documents/${id}/retry/`, {
      method: 'POST',
    });
  },

  async updateExtractedData(
    id: number,
    payload: DocumentUpdateExtractedDataPayload
  ): Promise<ApiResponse<DocumentDetail>> {
    return apiClient<ApiResponse<DocumentDetail>>(
      `/api/v1/documents/${id}/extracted-data/`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  },

  async getProcessingStatus(
    id: number
  ): Promise<ApiResponse<DocumentStatusResponse>> {
    return apiClient<ApiResponse<DocumentStatusResponse>>(
      `/api/v1/documents/${id}/status/`
    );
  },

  async getReviewQueue(): Promise<ApiResponse<{ count: number; results: ReviewQueueItem[] }>> {
    return apiClient<ApiResponse<{ count: number; results: ReviewQueueItem[] }>>(
      '/api/v1/documents/review-queue/'
    );
  },

  async getPayables(): Promise<ApiResponse<PayablesOverview>> {
    return apiClient<ApiResponse<PayablesOverview>>('/api/v1/documents/payables/');
  },

  async getStats(): Promise<ApiResponse<DocumentStats>> {
    return apiClient<ApiResponse<DocumentStats>>('/api/v1/documents/stats/');
  },
};
