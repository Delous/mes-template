'use client';

import { Detail } from '@/components/detail';
import { TaskRouteDialog } from '@/components/task-route-dialog';

import { ErrorNotice, LoadingState, PageHeader } from '@/components/page-tools';
import { TaskStatusBadge, TaskTypeBadge } from '@/components/task-status';
import type { TaskDto, TaskUpdateStatus, UserRole } from '@/types/api';
import { Button, Card, Flex, Grid, Text, TextArea, TextField } from '@radix-ui/themes';
import { ArrowLeft, Check, Pause, Play, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { FormEvent } from 'react';
import type { PageModel } from './use-page';
export function PageHeading({ model }: { model: Pick<PageModel, 'task'> }) {
  const { task } = model;
  return (
    <PageHeader
      title={task ? task.title : 'Задача'}
      description={task ? task.orderLabel : undefined}
      action={
        <Button asChild variant="soft" color="gray">
          <Link href="/tasks">
            <ArrowLeft size={16} /> Назад
          </Link>
        </Button>
      }
    />
  );
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return <ErrorNotice message={error} />;
}

export function TaskDetails({
  model,
}: {
  model: Pick<PageModel, 'user' | 'task' | 'loading' | 'submitting' | 'handleTransition'>;
}) {
  const { user, task, loading, submitting, handleTransition } = model;
  return loading ? (
    <LoadingState label="Загружаем задачу" />
  ) : task ? (
    <>
      <Card size="3" mb="4">
        <Flex align="center" justify="between" gap="3" wrap="wrap">
          <Flex gap="3" wrap="wrap">
            <TaskTypeBadge type={task.task_type} />
            <TaskStatusBadge status={task.status} />
          </Flex>
          <TaskActions
            task={task}
            role={user?.role}
            submitting={submitting}
            onTransition={handleTransition}
          />
        </Flex>
      </Card>

      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        <Card size="3">
          <Grid columns={{ initial: '1', sm: '2' }} gap="3">
            <Detail label="Заказ" value={task.orderLabel} />
            <Detail label="Номенклатура" value={task.item.name} />
            <Detail label="План" value={task.plannedLabel} />
            <Detail label="Факт" value={task.actualLabel} />
            <Detail label="Брак" value={task.defectLabel} />
          </Grid>
        </Card>

        <Card size="3">
          <Grid columns={{ initial: '1', sm: '2' }} gap="3">
            <Detail label="Рабочий пост" value={task.workstationLabel} />
            <Detail label="Операция" value={task.operationLabel} />
            <Detail label="Обновлено" value={task.updatedLabel} />
          </Grid>
          <Flex mt="4">
            <TaskRouteDialog task={task} />
          </Flex>
        </Card>
      </Grid>
      {task.pendingDependencies.length > 0 ? (
        <Card size="3" mt="4">
          <Text as="div" weight="bold" color="red" mb="2">
            Заблокирована до завершения:
          </Text>
          {task.pendingDependencies.map((dependency) => (
            <Text key={dependency.id} as="div" size="2">
              #{dependency.id} · {dependency.item.name}
            </Text>
          ))}
        </Card>
      ) : null}
    </>
  ) : null;
}
function TaskActions({
  task,
  role,
  submitting,
  onTransition,
}: {
  task: TaskDto;
  role?: UserRole;
  submitting: boolean;
  onTransition: (status: TaskUpdateStatus, event?: FormEvent<HTMLFormElement>) => void;
}) {
  const canStart =
    task.status === 'to_do' && ['admin', 'operator', 'reviewer'].includes(role ?? '');
  const canResume = task.status === 'blocked' && ['admin', 'operator'].includes(role ?? '');
  const canBlock = task.status === 'in_progress' && ['admin', 'operator'].includes(role ?? '');
  const canCompleteOperation =
    ['to_do', 'in_progress'].includes(task.status) &&
    task.task_type === 'operation' &&
    (role === 'operator' || role === 'admin');
  const canCompleteSimple =
    ['to_do', 'in_progress'].includes(task.status) &&
    task.task_type !== 'operation' &&
    (role === 'operator' || role === 'reviewer' || role === 'admin');
  const canReject =
    ['to_do', 'in_progress'].includes(task.status) &&
    task.task_type === 'quality_review' &&
    (role === 'reviewer' || role === 'admin');

  return (
    <Flex gap="2" wrap="wrap" align="center">
      {role === 'admin' && ['to_do', 'blocked'].includes(task.status) ? (
        <Button
          size="2"
          color="red"
          variant="soft"
          disabled={submitting}
          onClick={() => onTransition('cancelled')}
        >
          <XCircle size={15} /> Отменить
        </Button>
      ) : null}
      {canStart ? (
        <Button size="2" disabled={submitting} onClick={() => onTransition('in_progress')}>
          <Play size={15} /> Взять в работу
        </Button>
      ) : null}
      {canResume ? (
        <Button
          size="2"
          variant="soft"
          disabled={submitting}
          onClick={() => onTransition('in_progress')}
        >
          <RotateCcw size={15} /> Возобновить
        </Button>
      ) : null}
      {canCompleteOperation ? (
        <form onSubmit={(event) => onTransition('done', event)}>
          <Flex gap="2" wrap="wrap" align="center">
            <TextField.Root name="actual_quantity_delta" placeholder="Выпущено" size="2" required />
            <Button size="2" color="green" type="submit" disabled={submitting}>
              <Check size={15} /> Завершить
            </Button>
          </Flex>
        </form>
      ) : null}
      {canCompleteSimple ? (
        <Button size="2" color="green" disabled={submitting} onClick={() => onTransition('done')}>
          <Check size={15} /> Завершить
        </Button>
      ) : null}
      {canReject ? (
        <form onSubmit={(event) => onTransition('rejected', event)}>
          <Flex gap="2" wrap="wrap" align="center">
            <TextField.Root name="defect_quantity_delta" placeholder="Брак" size="2" required />
            <TextArea name="comment" placeholder="Комментарий" rows={1} required />
            <Button size="2" color="red" type="submit" disabled={submitting}>
              <XCircle size={15} /> Отклонить
            </Button>
          </Flex>
        </form>
      ) : null}
      {canBlock ? (
        <Button
          size="2"
          variant="soft"
          color="red"
          disabled={submitting}
          onClick={() => onTransition('blocked')}
        >
          <Pause size={15} /> Заблокировать
        </Button>
      ) : null}
    </Flex>
  );
}
