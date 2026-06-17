export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };
