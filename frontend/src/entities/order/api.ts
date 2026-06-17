import { apiFetch, apiResult } from "@/shared/api/fetcher";
import type { ListResponse } from "@/shared/api/types";

import type { CreateOrderPayload, OrderDto } from "./types";

export async function getOrders(page = 1, size = 20) {
  return apiFetch<ListResponse<OrderDto>>(`/api/v1/orders?page=${page}&size=${size}`, { cache: "no-store" });
}

export async function getOrdersResult(page = 1, size = 20) {
  return apiResult(getOrders(page, size));
}

export async function getOrder(id: number) {
  return apiFetch<OrderDto>(`/api/v1/orders/${id}`, { cache: "no-store" });
}

export async function createOrder(payload: CreateOrderPayload) {
  return apiFetch<OrderDto>("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
