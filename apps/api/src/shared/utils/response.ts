import type { Context } from "hono";
import type { ApiResponse, PaginatedResponse } from "@/shared/types/common";

export const success = <T>(c: Context, data: T, status: 200 | 201 = 200) => {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
    },
    status,
  );
};

export const created = <T>(c: Context, data: T) => {
  return success(c, data, 201);
};

export const error = (
  c: Context,
  message: string,
  status: 400 | 401 | 403 | 404 | 500 = 400,
) => {
  return c.json<ApiResponse>(
    {
      success: false,
      error: message,
    },
    status,
  );
};

export const paginated = <T>(
  c: Context,
  data: T,
  meta: PaginatedResponse<T>["meta"],
) => {
  return c.json<PaginatedResponse<T>>({
    success: true,
    data,
    meta,
  });
};
