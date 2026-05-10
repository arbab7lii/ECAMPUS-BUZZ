export type ApiSuccess<TData> = {
  success: true;
  data: TData;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<TData> = ApiSuccess<TData> | ApiError;

