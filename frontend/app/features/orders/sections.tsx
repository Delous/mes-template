'use client';

import { DataTable } from '@/components/data-table';
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  PageHeader,
  Pagination,
} from '@/components/page-tools';
import { Badge, Button, Card } from '@radix-ui/themes';
import { Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { pageSize } from './model';
import type { PageModel } from './use-page';
export function PageHeading() {
  return (
    <PageHeader
      title="Заказы"
      action={
        <Button asChild>
          <Link href="/orders/new">
            <Plus size={16} /> Новый заказ
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

export function OrdersTable({
  model,
}: {
  model: Pick<PageModel, 'orders' | 'page' | 'setPage' | 'total' | 'loading'>;
}) {
  const { orders, page, setPage, total, loading } = model;
  return loading ? (
    <LoadingState label="Загружаем заказы" />
  ) : orders.length === 0 ? (
    <EmptyState label="Заказы не найдены" />
  ) : (
    <>
      <Card>
        <DataTable
          rows={orders}
          rowKey={(order) => order.id}
          columns={[
            { key: 'column-0', header: 'ID', cell: (order) => order.id },
            { key: 'column-1', header: 'Номер', cell: (order) => order.number },
            {
              key: 'column-2',
              header: 'Статус',
              cell: (order) => (
                <>
                  <Badge>{order.status}</Badge>
                </>
              ),
            },
            {
              key: 'column-3',
              header: 'Строки',
              cell: (order) => (
                <>
                  {order.lines.length} · {order.quantityLabel}
                </>
              ),
            },
            { key: 'column-4', header: 'Создан', cell: (order) => order.createdLabel },
            {
              key: 'column-5',
              header: '',
              cell: (order) => (
                <>
                  <Button asChild size="2" variant="soft" color="gray">
                    <Link href={`/orders/${order.id}`}>
                      <Eye size={15} /> Открыть
                    </Link>
                  </Button>
                </>
              ),
            },
          ]}
        />
      </Card>
      <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
    </>
  );
}
