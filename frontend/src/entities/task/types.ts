import type { WorkCenterDto } from "@/entities/catalog/types";

export type TaskType = "warehouse_delivery" | "operation" | "quality_review" | "transfer";

export type TaskStatus = "waiting" | "to_do" | "in_progress" | "blocked" | "done" | "cancelled" | "rejected";

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

export type UpdateTaskPayload = {
  status: TaskStatus;
  actual_quantity_delta?: string;
  defect_quantity_delta?: string;
  comment?: string;
};
