'use client';

import { PageLayout } from '@/components/page-layout';
import { PageError, PageHeading, TaskDetails } from '@/features/tasks/detail/sections';
import { useTaskPage } from '@/features/tasks/detail/use-page';

export default function TaskPage() {
  const model = useTaskPage();
  return (
    <PageLayout>
      <PageHeading model={model} />
      <PageError model={model} />
      <TaskDetails model={model} />
    </PageLayout>
  );
}
