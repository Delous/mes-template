'use client';

import { DataTable } from '@/components/data-table';
import { TaskListTools } from '@/components/list-tools';
import { OrderPlanningFields } from '@/components/order-planning-fields';
import { TaskRouteDialog } from '@/components/task-route-dialog';
import { DeleteButton, ErrorNotice, LoadingState, PageHeader } from '@/components/page-tools';
import { TaskStatusBadge } from '@/components/task-status';
import { Box, Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
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

export function OrderDetails({
  model,
}: {
  model: Pick<
    PageModel,
    'order' | 'loading' | 'saving' | 'handleSave' | 'taskQuery' | 'setTaskQuery' | 'visibleTasks'
  >;
}) {
  const { order, loading, saving, handleSave, taskQuery, setTaskQuery, visibleTasks } = model;
  return loading ? (
    <LoadingState label="Загружаем заказ" />
  ) : order ? (
    <Grid columns="1" gap="4">
      <Card size="3">
        <Heading size="4" mb="3">
          Приоритет и дедлайн
        </Heading>
        <form key={`${order.id}-${order.updated_at}`} onSubmit={handleSave}>
          <Grid columns={{ initial: '1', sm: '2' }} gap="3" mb="3">
            <OrderPlanningFields
              priority={order.priority}
              deadlineDate={order.deadline}
              disabled={saving}
            />
          </Grid>
          <Button type="submit" disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </form>
      </Card>
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
          <Heading size="4" mb="3">
            Связанные задачи
          </Heading>
          <TaskListTools query={taskQuery} onChange={setTaskQuery} />
          <Text as="p" size="2" color="gray" mb="3">
            Найдено {visibleTasks.length} из {order.tasks.length}
          </Text>
          {visibleTasks.length === 0 && (
            <Text as="p" color="gray" mb="3">
              Задачи не найдены. Попробуйте изменить условия поиска.
            </Text>
          )}
        </Box>
        <DataTable
          rows={visibleTasks}
          rowKey={(task) => task.id}
          columns={[
            { key: 'column-0', header: 'ID', cell: (task) => <>{task.id}</> },
            {
              key: 'column-2',
              header: 'Статус',
              cell: (task) => (
                <>
                  <TaskStatusBadge status={task.status} />
                </>
              ),
            },
            {
              key: 'column-3',
              header: 'Задача',
              cell: (task) => (
                <>
                  <Text as="div" weight="medium">
                    {task.title}
                  </Text>
                  <Text as="div" size="2" color="gray">
                    {task.orderLabel}
                  </Text>
                </>
              ),
            },
            { key: 'column-5', header: 'План', cell: (task) => task.plannedLabel },
            { key: 'actual', header: 'Факт', cell: (task) => task.actualLabel },
            { key: 'defect', header: 'Брак', cell: (task) => task.defectLabel },
            {
              key: 'column-6',
              header: 'Зависит от',
              cell: (task) =>
                task.dependencies.map((dependency) => (
                  <div key={dependency.id}>
                    {dependency.id} · {dependency.name}
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
