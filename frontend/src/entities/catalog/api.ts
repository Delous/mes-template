import { apiFetch, apiResult } from "@/shared/api/fetcher";
import type { ListResponse } from "@/shared/api/types";

import type { CatalogEntityMap, CatalogResource } from "./types";

export async function getCatalogList<T extends CatalogResource>(
  resource: T,
  params?: { page?: number; size?: number; includeDeleted?: boolean },
) {
  const search = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 20),
    include_deleted: String(params?.includeDeleted ?? false),
  });

  return apiFetch<ListResponse<CatalogEntityMap[T]>>(`/api/v1/catalogs/${resource}?${search.toString()}`, {
    cache: "force-cache",
    next: { revalidate: 60, tags: [`catalog-${resource}`] },
  });
}

export async function getCatalogListResult<T extends CatalogResource>(
  resource: T,
  params?: { page?: number; size?: number; includeDeleted?: boolean },
) {
  return apiResult(getCatalogList(resource, params));
}

export async function createCatalogEntity<T extends CatalogResource>(resource: T, payload: unknown) {
  return apiFetch<CatalogEntityMap[T]>(`/api/v1/catalogs/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCatalogEntity<T extends CatalogResource>(resource: T, id: number, payload: unknown) {
  return apiFetch<CatalogEntityMap[T]>(`/api/v1/catalogs/${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCatalogEntity(resource: CatalogResource, id: number) {
  return apiFetch<void>(`/api/v1/catalogs/${resource}/${id}`, { method: "DELETE" });
}
