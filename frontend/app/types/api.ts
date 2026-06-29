export type UserRole = "admin" | "operator" | "reviewer" | "storekeeper";

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

export type LoginPayload = {
  login: string;
  password: string;
};

export type MeDto = {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  workstation_ids: number[];
};

export type WorkstationDto = {
  id: number;
  name: string;
};

export type AdminUserDto = {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  workstations: WorkstationDto[];
};

export type CreateUserPayload = {
  username: string;
  full_name: string;
  password: string;
  role: Exclude<UserRole, "admin">;
  workstation_ids?: number[];
};

export type UpdateUserPayload = {
  password?: string;
  role?: Exclude<UserRole, "admin">;
  workstation_ids?: number[];
};

export type TaskType = "warehouse_delivery" | "operation" | "quality_review" | "transfer";

export type TaskStatus = "waiting" | "to_do" | "in_progress" | "blocked" | "done" | "cancelled" | "rejected";

export type WorkCenterDto = {
  id: number;
  name: string;
  type: "production" | "warehouse" | "quality" | string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type TaskDto = {
  id: number;
  task_type: TaskType;
  status: TaskStatus;
  description: string | null;
  planned_quantity: string;
  actual_quantity: string;
  defect_quantity: string;
  order_id: number;
  order_line_id: number;
  item_id: number;
  route_operation_id: number | null;
  work_center_id: number | null;
  source_work_center_id: number | null;
  target_work_center_id: number | null;
  item: {
    id: number;
    name: string;
    unit_id: number;
  };
  work_center: WorkCenterDto | null;
  source_work_center: WorkCenterDto | null;
  target_work_center: WorkCenterDto | null;
  executor_id: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateTaskPayload = {
  task_type: TaskType;
  description?: string | null;
  planned_quantity: string;
  order_id?: number;
  order_line_id?: number;
  item_id?: number;
  route_operation_id?: number | null;
  work_center_id?: number | null;
  source_work_center_id?: number | null;
  target_work_center_id?: number | null;
};

export type UpdateTaskPayload = {
  status: TaskStatus;
  actual_quantity_delta?: string;
  defect_quantity_delta?: string;
  comment?: string;
};

export type ApiErrorBody = {
  detail?: unknown;
  message?: unknown;
};
