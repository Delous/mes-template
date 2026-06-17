import { apiFetch, apiResult } from "@/shared/api/fetcher";
import type { ListResponse } from "@/shared/api/types";

import type { AdminUserDto, AdminWorkstationDto, CreateUserPayload, UpdateUserPayload } from "./types";

const usersPath = "/api/v1/admin/users";
const workstationsPath = "/api/v1/admin/workstations";

export async function getUsers(page = 1, size = 50) {
  return apiFetch<ListResponse<AdminUserDto>>(`${usersPath}?page=${page}&size=${size}`, { cache: "no-store" });
}

export async function getUsersResult(page = 1, size = 50) {
  return apiResult(getUsers(page, size));
}

export async function getAdminWorkstations() {
  return apiFetch<AdminWorkstationDto[]>(workstationsPath, { cache: "no-store" });
}

export async function getAdminWorkstationsResult() {
  return apiResult(getAdminWorkstations());
}

export async function createUser(payload: CreateUserPayload) {
  return apiFetch<AdminUserDto>(usersPath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  return apiFetch<AdminUserDto>(`${usersPath}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
