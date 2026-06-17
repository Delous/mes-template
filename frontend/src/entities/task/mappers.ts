import { labels } from "@/shared/i18n/labels";

import type { TaskDto } from "./types";

export type TaskView = TaskDto & {
  taskTypeLabel: string;
  statusLabel: string;
};

export function mapTaskForView(task: TaskDto): TaskView {
  return {
    ...task,
    taskTypeLabel: labels.taskTypes[task.task_type],
    statusLabel: labels.taskStatuses[task.status],
  };
}
