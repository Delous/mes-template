'use client';

import { Detail } from '@/components/detail';
import { OrderPlanningSummary } from '@/components/order-planning-summary';
import { TaskRouteDialog } from '@/components/task-route-dialog';

import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  PageHeader,
  Pagination,
} from '@/components/page-tools';
import { TaskStatusBadge } from '@/components/task-status';
import { Box, Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { pageSize } from './model';
import type { PageModel } from './use-page';
export function PageHeading() {
  return <PageHeader title="Задачи" />;
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return <ErrorNotice message={error} />;
}

export function TasksList({
  model,
}: {
  model: Pick<PageModel, 'tasks' | 'page' | 'setPage' | 'total' | 'loading'>;
}) {
  const { tasks, page, setPage, total, loading } = model;
  return loading ? (
    <LoadingState label="Загружаем задачи" />
  ) : tasks.length === 0 ? (
    <EmptyState label="Нет задач" />
  ) : (
    <>
      <Grid columns={{ initial: '1', lg: '2' }} gap="4">
        {tasks.map((task) => (
          <Card key={task.id} size="3">
            <Flex direction="column" gap="4">
              <Flex align="start" justify="between" gap="3">
                <Box>
                  <Heading size="4">{task.title}</Heading>
                  <Text size="2" color="gray">
                    {task.orderLabel}
                  </Text>
                </Box>
                <TaskStatusBadge status={task.status} />
              </Flex>

              <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                <OrderPlanningSummary order={task.order} />
                <Detail label="План" value={task.plannedLabel} />
                <Detail label="Факт" value={task.actualLabel} />
                <Detail label="Брак" value={task.defectLabel} />
              </Grid>

              {task.pendingDependencies.length > 0 ? (
                <Box>
                  <Text as="div" size="2" weight="bold" color="red">
                    Ожидает выполнения задач:
                  </Text>
                  {task.pendingDependencies.map((dependency) => (
                    <Text key={dependency.id} as="div" size="2" color="gray">
                      {dependency.id} · {dependency.name}
                    </Text>
                  ))}
                </Box>
              ) : null}

              <TaskRouteDialog task={task} />
              <Button asChild variant="soft" color="gray">
                <Link href={`/tasks/${task.id}`}>
                  <Eye size={15} /> Подробнее
                </Link>
              </Button>
            </Flex>
          </Card>
        ))}
      </Grid>
      <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
    </>
  );
}
