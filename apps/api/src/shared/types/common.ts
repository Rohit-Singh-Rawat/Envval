export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = ApiResponse<T> & {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};
