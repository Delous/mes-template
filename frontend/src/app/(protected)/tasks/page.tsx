import { getTasksResult } from "@/entities/task/api";
import { mapTaskForView } from "@/entities/task/mappers";
import { TasksBoard } from "@/features/tasks/TasksBoard";
import { labels } from "@/shared/i18n/labels";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function TasksPage() {
  const result = await getTasksResult();
  const tasks = result.ok ? result.data.items.map(mapTaskForView) : [];

  return (
    <div className="page-content">
      <PageHeader title={labels.entities.tasks} description="Доступные текущему пользователю задачи возвращает backend с учетом роли." />
      {!result.ok ? <ErrorNotice message={result.message} /> : null}
      <TasksBoard tasks={tasks} />
    </div>
  );
}
