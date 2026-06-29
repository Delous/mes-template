import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type {
  AdminUserDto,
  ApiErrorBody,
  CatalogDtoMap,
  CatalogPayloadMap,
  CatalogResource,
  CatalogUpdatePayloadMap,
  CreateOrderPayload,
  CreateUserPayload,
  CreateWorkstationPayload,
  ListResponse,
  LoginPayload,
  MeDto,
  OrderDto,
  TaskDto,
  UpdateTaskPayload,
  UpdateUserPayload,
  ValuesIngestResponse,
  ValuesPayload,
  WorkstationDto,
} from "@/types/api";

import * as mockApi from "./mock-api";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://arm.delous.ru").replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshRequest: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/api/v1/refresh") ||
      originalRequest.url?.includes("/api/v1/login")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshRequest ??= apiClient.post("/api/v1/refresh").then(() => undefined);

    try {
      await refreshRequest;
      return apiClient(originalRequest);
    } finally {
      refreshRequest = null;
    }
  },
);

function formatValidationDetail(detail: unknown) {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item !== "object" || item === null) return String(item);
        const issue = item as { loc?: unknown; msg?: unknown };
        const location = Array.isArray(issue.loc) ? issue.loc.join(".") : "";
        const message = typeof issue.msg === "string" ? issue.msg : "Ошибка валидации";
        return location ? `${location}: ${message}` : message;
      })
      .join("; ");
  }

  return null;
}

export function normalizeApiError(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const detail = formatValidationDetail(error.response?.data?.detail);
    if (detail) return detail;

    const message = error.response?.data?.message;
    if (typeof message === "string") return message;

    if (error.response?.status === 400) return "Некорректные данные запроса.";
    if (error.response?.status === 401) return "Сессия истекла. Войдите снова.";
    if (error.response?.status === 403) return "Недостаточно прав для действия.";
    if (error.response?.status === 404) return "Данные не найдены.";
    if (error.response?.status === 409) return "Действие конфликтует с текущими данными.";
    if (error.response?.status === 422) return "Проверьте заполнение формы.";

    return error.message || "Ошибка API.";
  }

  return error instanceof Error ? error.message : "Неизвестная ошибка.";
}

export async function login(payload: LoginPayload) {
  if (useMockApi) return mockApi.login(payload);

  await apiClient.post("/api/v1/login", payload);
  return getMe();
}

export async function logout() {
  if (useMockApi) return mockApi.logout();
  await apiClient.post("/api/v1/logout").catch(() => undefined);
}

export async function getMe() {
  if (useMockApi) return mockApi.getMe();
  const response = await apiClient.get<MeDto>("/api/v1/me");
  return response.data;
}

export async function getTasks(page = 1, size = 20) {
  if (useMockApi) return mockApi.getTasks(page, size);
  const response = await apiClient.get<ListResponse<TaskDto>>("/api/v1/tasks", { params: { page, size } });
  return response.data;
}

export async function getTask(id: number) {
  if (useMockApi) return mockApi.getTask(id);
  const response = await apiClient.get<TaskDto>(`/api/v1/tasks/${id}`);
  return response.data;
}

export async function updateTask(id: number, payload: UpdateTaskPayload) {
  if (useMockApi) return mockApi.updateTask(id, payload);
  const response = await apiClient.patch<TaskDto>(`/api/v1/tasks/${id}`, payload);
  return response.data;
}

export async function getOrders(page = 1, size = 20) {
  if (useMockApi) return mockApi.getOrders(page, size);
  const response = await apiClient.get<ListResponse<OrderDto>>("/api/v1/orders", { params: { page, size } });
  return response.data;
}

export async function getOrder(id: number) {
  if (useMockApi) return mockApi.getOrder(id);
  const response = await apiClient.get<OrderDto>(`/api/v1/orders/${id}`);
  return response.data;
}

export async function createOrder(payload: CreateOrderPayload) {
  if (useMockApi) return mockApi.createOrder(payload);
  const response = await apiClient.post<OrderDto>("/api/v1/orders", payload);
  return response.data;
}

export async function getCatalog<R extends CatalogResource>(
  resource: R,
  page = 1,
  size = 20,
  includeDeleted = false,
) {
  if (useMockApi) return mockApi.getCatalog(resource, page, size, includeDeleted);
  const response = await apiClient.get<ListResponse<CatalogDtoMap[R]>>(`/api/v1/catalogs/${resource}`, {
    params: { page, size, include_deleted: includeDeleted },
  });
  return response.data;
}

export async function getCatalogItem<R extends CatalogResource>(resource: R, id: number) {
  if (useMockApi) return mockApi.getCatalogItem(resource, id);
  const response = await apiClient.get<CatalogDtoMap[R]>(`/api/v1/catalogs/${resource}/${id}`);
  return response.data;
}

export async function createCatalogItem<R extends CatalogResource>(resource: R, payload: CatalogPayloadMap[R]) {
  if (useMockApi) return mockApi.createCatalogItem(resource, payload);
  const response = await apiClient.post<CatalogDtoMap[R]>(`/api/v1/catalogs/${resource}`, payload);
  return response.data;
}

export async function updateCatalogItem<R extends CatalogResource>(
  resource: R,
  id: number,
  payload: CatalogUpdatePayloadMap[R],
) {
  if (useMockApi) return mockApi.updateCatalogItem(resource, id, payload);
  const response = await apiClient.patch<CatalogDtoMap[R]>(`/api/v1/catalogs/${resource}/${id}`, payload);
  return response.data;
}

export async function deleteCatalogItem<R extends CatalogResource>(resource: R, id: number) {
  if (useMockApi) return mockApi.deleteCatalogItem(resource, id);
  await apiClient.delete(`/api/v1/catalogs/${resource}/${id}`);
}

export async function getAdminUsers(page = 1, size = 20) {
  if (useMockApi) return mockApi.getAdminUsers(page, size);
  const response = await apiClient.get<ListResponse<AdminUserDto>>("/api/v1/admin/users", { params: { page, size } });
  return response.data;
}

export async function createAdminUser(payload: CreateUserPayload) {
  if (useMockApi) return mockApi.createAdminUser(payload);
  const response = await apiClient.post<AdminUserDto>("/api/v1/admin/users", payload);
  return response.data;
}

export async function updateAdminUser(id: number, payload: UpdateUserPayload) {
  if (useMockApi) return mockApi.updateAdminUser(id, payload);
  const response = await apiClient.patch<AdminUserDto>(`/api/v1/admin/users/${id}`, payload);
  return response.data;
}

export async function getAdminWorkstations() {
  if (useMockApi) return mockApi.getAdminWorkstations();
  const response = await apiClient.get<WorkstationDto[]>("/api/v1/admin/workstations");
  return response.data;
}

export async function createAdminWorkstation(payload: CreateWorkstationPayload) {
  if (useMockApi) return mockApi.createAdminWorkstation(payload);
  const response = await apiClient.post<WorkstationDto>("/api/v1/admin/workstations", payload);
  return response.data;
}

export async function deleteAdminWorkstation(id: number) {
  if (useMockApi) return mockApi.deleteAdminWorkstation(id);
  await apiClient.delete(`/api/v1/admin/workstations/${id}`);
}

export async function postValues(payload: ValuesPayload) {
  if (useMockApi) return mockApi.postValues(payload);
  const response = await apiClient.post<ValuesIngestResponse>("/api/v1/values", payload);
  return response.data;
}

export async function getValues(start: number, end: number) {
  if (useMockApi) return mockApi.getValues(start, end);
  const response = await apiClient.get<ValuesPayload>("/api/v1/values", { params: { start, end } });
  return response.data;
}
