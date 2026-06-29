import { Badge } from "@radix-ui/themes";

import type { TaskStatus, TaskType, TaskUpdateStatus } from "@/types/api";

const statusLabels: Record<TaskUpdateStatus, string> = {
  waiting: "Ожидает",
  to_do: "К выполнению",
  in_progress: "В работе",
  blocked: "Заблокирована",
  done: "Выполнена",
  cancelled: "Отменена",
  rejected: "Отклонена",
};

const taskTypeLabels: Record<TaskType, string> = {
  warehouse_delivery: "Доставка",
  operation: "Операция",
  quality_review: "ОТК",
  transfer: "Перемещение",
};

const colors: Record<TaskUpdateStatus, React.ComponentProps<typeof Badge>["color"]> = {
  waiting: "gray",
  to_do: "blue",
  in_progress: "amber",
  blocked: "red",
  done: "green",
  cancelled: "gray",
  rejected: "red",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge color={colors[status]}>{statusLabels[status]}</Badge>;
}

export function TaskTypeBadge({ type }: { type: TaskType }) {
  return <Badge variant="soft">{taskTypeLabels[type]}</Badge>;
}

export function getTaskStatusLabel(status: TaskStatus) {
  return statusLabels[status];
}

export function getTaskTypeLabel(type: TaskType) {
  return taskTypeLabels[type];
}
