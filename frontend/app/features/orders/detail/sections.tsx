'use client';

import { DataTable } from '@/components/data-table';
import { TaskRouteDialog } from '@/components/task-route-dialog';
import { DeleteButton, ErrorNotice, LoadingState, PageHeader } from '@/components/page-tools';
import { TaskStatusBadge, TaskTypeBadge } from '@/components/task-status';
import { Box, Button, Card, Flex, Grid, Heading } from '@radix-ui/themes';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import type { PageModel } from './use-page';
export function PageHeading({
  model,
}: {
  model: Pick<PageModel, 'user' | 'order' | 'deleting' | 'handleDelete'>;
}) {
  const { user, order, deleting, handleDelete } = model;
  return (
    <PageHeader
      title={order ? `Заказ ${order.number}` : 'Заказ'}
      description={order ? `Статус: ${order.status} · Создан: ${order.createdLabel}` : undefined}
      action={
        <Flex gap="2" wrap="wrap">
          {order && user?.role === 'admin' ? (
            <DeleteButton
              label="Удалить заказ"
              confirmText={`Удалить заказ ${order.number} и все связанные задачи? Номенклатуры останутся в справочнике.`}
              disabled={deleting}
              onDelete={handleDelete}
            />
          ) : null}
          <Button asChild variant="soft" color="gray">
            <Link href="/orders">
              <ArrowLeft size={16} /> Назад
            </Link>
          </Button>
        </Flex>
      }
    />
  );
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return <ErrorNotice message={error} />;
}

export function OrderDetails({ model }: { model: Pick<PageModel, 'order' | 'loading'> }) {
  const { order, loading } = model;
  return loading ? (
    <LoadingState label="Загружаем заказ" />
  ) : order ? (
    <Grid columns="1" gap="4">
      <Card>
        <Box p="4" pb="0">
          <Heading size="4">Строки заказа</Heading>
        </Box>
        <DataTable
          rows={order.lines}
          rowKey={(line) => line.id}
          columns={[
            { key: 'column-0', header: 'ID', cell: (line) => line.id },
            { key: 'column-1', header: 'Номенклатура', cell: (line) => line.itemName },
            { key: 'column-2', header: 'Количество', cell: (line) => line.quantityLabel },
          ]}
        />
      </Card>

      <Card>
        <Box p="4" pb="0">
          <Heading size="4">Связанные задачи</Heading>
        </Box>
        <DataTable
          rows={order.tasks}
          rowKey={(task) => task.id}
          columns={[
            { key: 'column-0', header: 'ID', cell: (task) => <>#{task.id}</> },
            {
              key: 'column-1',
              header: 'Тип',
              cell: (task) => (
                <>
                  <TaskTypeBadge type={task.task_type} />
                </>
              ),
            },
            {
              key: 'column-2',
              header: 'Статус',
              cell: (task) => (
                <>
                  <TaskStatusBadge status={task.status} />
                </>
              ),
            },
            { key: 'column-3', header: 'Задача', cell: (task) => task.title },
            { key: 'column-4', header: 'Номенклатура', cell: (task) => task.item.name },
            { key: 'column-5', header: 'План', cell: (task) => task.plannedLabel },
            { key: 'actual', header: 'Факт', cell: (task) => task.actualLabel },
            { key: 'defect', header: 'Брак', cell: (task) => task.defectLabel },
            { key: 'workstation', header: 'Рабочий пост', cell: (task) => task.workstationLabel },
            { key: 'operation', header: 'Операция', cell: (task) => task.operationLabel },
            {
              key: 'column-6',
              header: 'Зависит от',
              cell: (task) =>
                task.dependencies.map((dependency) => (
                  <div key={dependency.id}>
                    #{dependency.id} · {dependency.item.name}
                  </div>
                )),
            },
            {
              key: 'column-7',
              header: '',
              cell: (task) => (
                <>
                  <TaskRouteDialog task={task} />
                  <Button asChild size="2" variant="soft" color="gray">
                    <Link href={`/tasks/${task.id}`}>
                      <Eye size={15} /> Открыть
                    </Link>
                  </Button>
                </>
              ),
            },
          ]}
        />
      </Card>
    </Grid>
  ) : null;
}
