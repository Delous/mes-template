"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Flex, Grid, Heading } from "@radix-ui/themes";
import { ArrowLeft, Eye } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { TaskStatusBadge, TaskTypeBadge } from "@/components/task-status";
import { DeleteButton, ErrorNotice, formatDate, formatQuantity, LoadingState, PageHeader } from "@/components/page-tools";
import { deleteOrder, getCatalog, getOrder, normalizeApiError } from "@/lib/api";
import type { ItemDto, OrderDetailDto } from "@/types/api";

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [items, setItems] = useState<ItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orderResponse, itemResponse] = await Promise.all([
        getOrder(orderId),
        getCatalog("items", 1, 100),
      ]);
      setOrder(orderResponse);
      setItems(itemResponse.items);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handleDelete() {
    if (!order) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteOrder(order.id);
      router.replace("/orders");
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
      setDeleting(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeader
        title={order ? `Заказ ${order.number}` : "Заказ"}
        description={order ? `Статус: ${order.status} · Создан: ${formatDate(order.created_at)}` : undefined}
        action={
          <Flex gap="2" wrap="wrap">
            {order && user?.role === "admin" ? (
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
      <ErrorNotice message={error} />

      {loading ? (
        <LoadingState label="Загружаем заказ" />
      ) : order ? (
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          <Box className="surface table-scroll order-lines-panel">
            <Box p="4" pb="0">
              <Heading size="4">Строки заказа</Heading>
            </Box>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Номенклатура</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.id}</td>
                    <td>{items.find((item) => item.id === line.item_id)?.name ?? `#${line.item_id}`}</td>
                    <td>{formatQuantity(line.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          <Box className="surface table-scroll order-lines-panel">
            <Box p="4" pb="0">
              <Heading size="4">Связанные задачи</Heading>
            </Box>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Описание</th>
                  <th>Номенклатура</th>
                  <th>План</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {order.tasks.map((task) => (
                  <tr key={task.id}>
                    <td>#{task.id}</td>
                    <td>
                      <TaskTypeBadge type={task.task_type} />
                    </td>
                    <td>
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td>{task.description || task.item.name}</td>
                    <td>{task.item.name}</td>
                    <td>{formatQuantity(task.planned_quantity)}</td>
                    <td>
                      <Button asChild size="2" variant="soft" color="gray">
                        <Link href={`/tasks/${task.id}`}>
                          <Eye size={15} /> Открыть
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Grid>
      ) : null}
    </div>
  );
}
