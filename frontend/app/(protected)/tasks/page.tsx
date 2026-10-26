'use client';

import { PageLayout } from '@/components/page-layout';
import { PageError, PageHeading, TasksList } from '@/features/tasks/sections';
import { useTasksPage } from '@/features/tasks/use-page';

export default function TasksPage() {
  const model = useTasksPage();
  return (
    <PageLayout>
      <PageHeading />
      <PageError model={model} />
      <TasksList model={model} />
    </PageLayout>
  );
}
