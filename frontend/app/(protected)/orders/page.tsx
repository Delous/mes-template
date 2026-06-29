"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Eye, Plus } from "lucide-react";

import { EmptyState, ErrorNotice, formatDate, formatQuantity, LoadingState, PageHeader, Pagination } from "@/components/page-tools";
import { getOrders, normalizeApiError } from "@/lib/api";
import type { OrderDto } from "@/types/api";

const pageSize = 20;

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getOrders(page, pageSize);
      setOrders(response.items);
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <div className="page-content">
      <PageHeader
        title="Заказы"
        description="Создание заказа запускает построение производственных задач."
        action={
          <Button asChild>
            <Link href="/orders/new">
              <Plus size={16} /> Новый заказ
            </Link>
          </Button>
        }
      />
      <ErrorNotice message={error} />

      {loading ? (
        <LoadingState label="Загружаем заказы" />
      ) : orders.length === 0 ? (
        <EmptyState label="Заказы не найдены" />
      ) : (
        <>
          <Box className="surface table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Номер</th>
                  <th>Статус</th>
                  <th>Строки</th>
                  <th>Создан</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.number}</td>
                    <td>
                      <Badge>{order.status}</Badge>
                    </td>
                    <td>
                      {order.lines.length} · {formatQuantity(order.lines.reduce((sum, line) => sum + Number(line.quantity), 0))}
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <Button asChild size="2" variant="soft" color="gray">
                        <Link href={`/orders/${order.id}`}>
                          <Eye size={15} /> Открыть
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
