import { apiFetch, apiResult } from "@/shared/api/fetcher";
import type { ListResponse } from "@/shared/api/types";

import type { TaskDto, UpdateTaskPayload } from "./types";

export async function getTasks(page = 1, size = 20) {
  return apiFetch<ListResponse<TaskDto>>(`/api/v1/tasks?page=${page}&size=${size}`, { cache: "no-store" });
}

export async function getTasksResult(page = 1, size = 20) {
  return apiResult(getTasks(page, size));
}

export async function getTask(id: number) {
  return apiFetch<TaskDto>(`/api/v1/tasks/${id}`, { cache: "no-store" });
}

export async function getTaskResult(id: number) {
  return apiResult(getTask(id));
}

export async function updateTask(id: number, payload: UpdateTaskPayload) {
  return apiFetch<TaskDto>(`/api/v1/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
