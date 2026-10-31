export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }> | Record<string, string[] | string> | string[];
}

export interface PaginatedResponse<T> {
  status?: string;
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: T[];
}

export interface ApiError {
  message: string;
  fieldErrors?: Record<string, string>;
  statusCode?: number;
}
